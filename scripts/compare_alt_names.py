#!/usr/bin/env python3
"""Compare alternative_names_zh between staging and prod schemas."""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
import psycopg2

conn = psycopg2.connect(os.environ['DATABASE_URL'])
cur = conn.cursor()
results = {}

for schema, label in [('staging', 'STAGING'), ('public', 'PROD')]:
    cur.execute(f'SET search_path TO {schema}, public')
    cur.execute('SELECT COUNT(*) FROM species_cache')
    total = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM species_cache WHERE alternative_names_zh IS NOT NULL')
    with_alt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM species_cache WHERE alternative_names_zh IS NULL AND taxon_rank IN ('SPECIES','SUBSPECIES','VARIETY')")
    missing = cur.fetchone()[0]
    print(f'=== {label} ===')
    print(f'  Total: {total}, With alt: {with_alt}, Missing alt: {missing}')
    cur.execute('SELECT taxon_id, common_name_zh, alternative_names_zh FROM species_cache WHERE alternative_names_zh IS NOT NULL ORDER BY taxon_id')
    results[label] = {r[0]: (r[1], r[2]) for r in cur.fetchall()}

s = results['STAGING']
p = results['PROD']
only_s = sorted(set(s) - set(p))
only_p = sorted(set(p) - set(s))
both = set(s) & set(p)
diffs = [(t, s[t], p[t]) for t in sorted(both) if s[t][1] != p[t][1]]

print(f'\n=== COMPARISON ===')
print(f'Both have alt: {len(both)}, Only staging: {len(only_s)}, Only prod: {len(only_p)}, Value diff: {len(diffs)}')

if only_s:
    print(f'\n[Staging only]')
    for t in only_s:
        print(f'  {t} {s[t][0]} -> {s[t][1]}')

if only_p:
    print(f'\n[Prod only]')
    for t in only_p:
        print(f'  {t} {p[t][0]} -> {p[t][1]}')

if diffs:
    print(f'\n[Different values]')
    for t, sv, pv in diffs:
        print(f'  {t} {sv[0]}:')
        print(f'    staging: {sv[1]}')
        print(f'    prod:    {pv[1]}')

if not only_s and not only_p and not diffs:
    print('\nAll matching - staging and prod are consistent.')

cur.close()
conn.close()
