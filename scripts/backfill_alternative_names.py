#!/usr/bin/env python3
"""回補 species_cache 中缺少 alternative_names_zh 的記錄。

從 TaiCOL 和 Wikidata 取得俗名／別名，寫入 alternative_names_zh 欄位。

Usage:
    python scripts/backfill_alternative_names.py --target staging
    python scripts/backfill_alternative_names.py --target prod
    python scripts/backfill_alternative_names.py --target staging --dry-run
"""

import argparse
import os
import sys
import time
from pathlib import Path

import psycopg2

# 專案根目錄
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / 'backend'))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / 'backend' / '.env')


def get_db_url(target):
    url = os.environ.get('DATABASE_URL', '')
    if not url:
        print('ERROR: DATABASE_URL not set in backend/.env')
        sys.exit(1)
    return url


def get_schema(target):
    return 'staging' if target == 'staging' else 'public'


def _strip_author(name):
    """Strip author from scientific name, e.g. 'Canis lupus Linnaeus, 1758' → 'Canis lupus'."""
    if not name:
        return name
    # Canonical names have 2-3 words (genus + species + subspecies); author starts after
    parts = name.split()
    # Keep only lowercase parts after the first uppercase genus word
    canon = [parts[0]]
    for p in parts[1:]:
        if p[0].islower():
            canon.append(p)
        else:
            break
    return ' '.join(canon)


def _resolve_current_taxon_id(scientific_name):
    """Get the current GBIF taxon_id for a scientific name via /species/match."""
    try:
        import requests
        canonical = _strip_author(scientific_name)
        r = requests.get('https://api.gbif.org/v1/species/match',
                         params={'name': canonical, 'verbose': 'false'}, timeout=10)
        r.raise_for_status()
        data = r.json()
        if data.get('matchType') != 'NONE':
            return data.get('usageKey')
    except Exception:
        pass
    return None


def fetch_alternative_names(scientific_name, taxon_id):
    """Resolve alternative names via TaiCOL → Wikidata aliases."""
    canonical = _strip_author(scientific_name)
    # TaiCOL
    try:
        from app.services.taicol import get_chinese_name as taicol_get
        _zh, alt = taicol_get(canonical)
        if alt:
            return alt
    except Exception:
        pass

    # Wikidata aliases — use current GBIF taxon_id to avoid stale ID drift
    resolved_id = _resolve_current_taxon_id(scientific_name) or taxon_id
    try:
        from app.services.wikidata import get_aliases_by_gbif_id
        aliases = get_aliases_by_gbif_id(resolved_id)
        if aliases:
            return aliases
    except Exception:
        pass

    return None


def main():
    parser = argparse.ArgumentParser(description='回補 species_cache alternative_names_zh')
    parser.add_argument('--target', choices=['staging', 'prod'], required=True)
    parser.add_argument('--dry-run', action='store_true', help='只查詢不寫入')
    args = parser.parse_args()

    db_url = get_db_url(args.target)
    schema = get_schema(args.target)

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    # Set search_path
    cur.execute(f"SET search_path TO {schema}, public;")

    # Step 0a: Clean up — null out alternative_names_zh for non-species ranks
    cur.execute("""
        UPDATE species_cache
        SET alternative_names_zh = NULL
        WHERE alternative_names_zh IS NOT NULL
          AND taxon_rank NOT IN ('SPECIES', 'SUBSPECIES', 'VARIETY')
    """)
    cleaned = cur.rowcount
    if cleaned:
        print(f'Cleaned {cleaned} non-species rows that had alternative_names_zh')

    # Step 0b: Re-clean existing alt names with updated filter rules
    cur.execute("""
        SELECT taxon_id, common_name_zh, alternative_names_zh
        FROM species_cache
        WHERE alternative_names_zh IS NOT NULL
    """)
    existing_rows = cur.fetchall()
    recleaned = 0
    from app.services.gbif import clean_alt_names
    for taxon_id, common_name_zh, alt in existing_rows:
        new_alt = clean_alt_names(alt, common_name_zh)
        if new_alt != alt:
            cur.execute(
                "UPDATE species_cache SET alternative_names_zh = %s WHERE taxon_id = %s",
                (new_alt, taxon_id),
            )
            recleaned += 1
    if recleaned:
        print(f'Re-cleaned {recleaned} rows with updated filter rules')

    # Find rows missing alternative_names_zh (species-level only)
    cur.execute("""
        SELECT taxon_id, scientific_name, common_name_zh
        FROM species_cache
        WHERE alternative_names_zh IS NULL
          AND taxon_rank IN ('SPECIES', 'SUBSPECIES', 'VARIETY')
        ORDER BY taxon_id
    """)
    rows = cur.fetchall()
    print(f'Found {len(rows)} species-level rows missing alternative_names_zh')

    updated = 0
    skipped = 0
    for i, (taxon_id, scientific_name, common_name_zh) in enumerate(rows):
        alt = fetch_alternative_names(scientific_name, taxon_id)

        # 清理：去重、移除屬名、移除非中文
        from app.services.gbif import clean_alt_names
        alt = clean_alt_names(alt, common_name_zh)

        if alt:
            display = f'{common_name_zh or scientific_name} → 俗名: {alt}'
            print(f'  [{i+1}/{len(rows)}] taxon_id={taxon_id} {display}')
            if not args.dry_run:
                cur.execute(
                    "UPDATE species_cache SET alternative_names_zh = %s WHERE taxon_id = %s",
                    (alt, taxon_id),
                )
            updated += 1
        else:
            skipped += 1

        # Rate limit: avoid hammering external APIs
        if (i + 1) % 10 == 0:
            time.sleep(1)

    if not args.dry_run:
        conn.commit()
        print(f'\nDone: {updated} updated, {skipped} skipped (no alternative names found)')
    else:
        conn.rollback()
        print(f'\n[DRY RUN] Would update: {updated}, skip: {skipped}')

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
