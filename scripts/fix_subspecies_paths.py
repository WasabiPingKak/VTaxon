#!/usr/bin/env python3
"""修復 species_cache 中亞種（SUBSPECIES/VARIETY/FORM）的 taxon_path 和 path_zh。

問題：舊版 _build_taxon_path() 只建 7 段路徑（至 SPECIES），亞種與母種共用相同路徑。
修正：為亞種追加第 8 段（三名法），並重建 path_zh 包含母種中文名。

Usage:
    python scripts/fix_subspecies_paths.py --target staging
    python scripts/fix_subspecies_paths.py --target prod
    python scripts/fix_subspecies_paths.py --target staging --dry-run
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

import psycopg2

# 專案根目錄
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / 'backend'))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / 'backend' / '.env')


def get_db_url():
    url = os.environ.get('DATABASE_URL', '')
    if not url:
        print('ERROR: DATABASE_URL not set in backend/.env')
        sys.exit(1)
    return url


def get_schema(target):
    return 'staging' if target == 'staging' else 'public'


def strip_author(name):
    """Strip author citation from scientific name."""
    if not name:
        return name
    return re.sub(
        r'\s+\(?[A-Z][\w.\s,\'\'-]*,\s*\d{4}\)?$', '', name
    ).strip()


def main():
    parser = argparse.ArgumentParser(description='Fix subspecies taxon_path to 8 segments')
    parser.add_argument('--target', required=True, choices=['staging', 'prod'])
    parser.add_argument('--dry-run', action='store_true', help='Print changes without writing')
    args = parser.parse_args()

    schema = get_schema(args.target)
    db_url = get_db_url()

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    # Set search_path
    cur.execute(f"SET search_path TO {schema}")

    # Find all subspecies-level entries
    cur.execute("""
        SELECT taxon_id, scientific_name, taxon_rank, taxon_path, path_zh,
               kingdom, phylum, class, order_, family, genus
        FROM species_cache
        WHERE taxon_rank IN ('SUBSPECIES', 'VARIETY', 'FORM')
    """)

    rows = cur.fetchall()
    print(f"Found {len(rows)} subspecies-level entries in {schema} schema")

    fixed = 0
    for row in rows:
        taxon_id, sci_name, rank, path, path_zh, kingdom, phylum, cls, order, family, genus = row
        if not path or not sci_name:
            continue

        parts = path.split('|')
        canonical = strip_author(sci_name)

        # Check if already has 8 segments (trinomial as last segment)
        if len(parts) > 7 and parts[-1] == canonical:
            continue

        # Build the parent binomial (first 2 words)
        words = canonical.split()
        parent_binomial = ' '.join(words[:2]) if len(words) >= 2 else canonical

        # If path has 7 segments and last one is the trinomial, we need to insert parent
        if len(parts) == 7 and parts[6] == canonical:
            # Replace: put parent binomial at [6], append trinomial
            new_parts = parts[:6] + [parent_binomial, canonical]
        elif len(parts) == 7 and parts[6] == parent_binomial:
            # Already has parent at [6], just append trinomial
            new_parts = parts + [canonical]
        elif len(parts) < 7:
            # Pad to 7 with the proper rank fields, then append
            rank_fields = [kingdom or '', phylum or '', cls or '', order or '', family or '', genus or '']
            new_parts = rank_fields[:6] + [parent_binomial, canonical]
        else:
            # Already > 7 segments but last != canonical — overwrite
            new_parts = parts[:7] + [canonical]

        new_path = '|'.join(new_parts)

        # Rebuild path_zh to include species zh
        new_path_zh = path_zh if isinstance(path_zh, dict) else {}
        if not new_path_zh:
            new_path_zh = {}

        # Look up parent species Chinese name
        if parent_binomial:
            cur.execute("""
                SELECT taxon_id, common_name_zh FROM species_cache
                WHERE scientific_name ILIKE %s AND taxon_rank = 'SPECIES'
                LIMIT 1
            """, (parent_binomial + '%',))
            parent_row = cur.fetchone()
            if parent_row and parent_row[1]:
                new_path_zh['species'] = parent_row[1]

        if args.dry_run:
            print(f"  [{taxon_id}] {sci_name}")
            print(f"    OLD path: {path}")
            print(f"    NEW path: {new_path}")
            if new_path_zh != path_zh:
                print(f"    NEW path_zh: {json.dumps(new_path_zh, ensure_ascii=False)}")
        else:
            cur.execute("""
                UPDATE species_cache
                SET taxon_path = %s, path_zh = %s
                WHERE taxon_id = %s
            """, (new_path, json.dumps(new_path_zh, ensure_ascii=False), taxon_id))

        fixed += 1

    if not args.dry_run and fixed > 0:
        conn.commit()
        print(f"Updated {fixed} entries")
    elif args.dry_run:
        print(f"[DRY RUN] Would update {fixed} entries")
    else:
        print("No entries needed fixing")

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
