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


def fetch_alternative_names(scientific_name, taxon_id):
    """Resolve alternative names via TaiCOL → Wikidata aliases."""
    # TaiCOL
    try:
        from app.services.taicol import get_chinese_name as taicol_get
        _zh, alt = taicol_get(scientific_name)
        if alt:
            return alt
    except Exception:
        pass

    # Wikidata aliases
    try:
        from app.services.wikidata import get_aliases_by_gbif_id
        aliases = get_aliases_by_gbif_id(taxon_id)
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

    # Find rows missing alternative_names_zh
    cur.execute("""
        SELECT taxon_id, scientific_name, common_name_zh
        FROM species_cache
        WHERE alternative_names_zh IS NULL
        ORDER BY taxon_id
    """)
    rows = cur.fetchall()
    print(f'Found {len(rows)} species_cache rows missing alternative_names_zh')

    updated = 0
    skipped = 0
    for i, (taxon_id, scientific_name, common_name_zh) in enumerate(rows):
        alt = fetch_alternative_names(scientific_name, taxon_id)

        # 如果俗名跟正式名一樣就跳過
        if alt and alt == common_name_zh:
            alt = None

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
