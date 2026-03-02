#!/usr/bin/env python3
"""Fetch breed data from Wikidata SPARQL and generate SQL seed file.

Queries three species: dog, cat, horse.
Resolves Taiwan-specific Chinese names via zh.wikipedia variant conversion.
Outputs INSERT ... ON CONFLICT DO UPDATE SQL to backend/seeds/breeds.sql.

Name resolution pipeline:
  1. Wikidata SPARQL → en label + zh-tw label + zh label + QID
  2. Wikidata API (wbgetentities) → zhwiki sitelink (batched, 50/request)
  3. zh.wikipedia parse API → variant=zh-tw displaytitle (batched, 50/request)
  4. Fallback chain: Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh

Usage:
    python scripts/fetch_breeds_wikidata.py
"""

import json
import re
import sys
import time
from pathlib import Path

import requests
from opencc import OpenCC

_s2twp = OpenCC('s2twp')

WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql'
WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
ZHWIKI_API = 'https://zh.wikipedia.org/w/api.php'
UA = 'VTaxon/1.0 (breed seed generator)'

# Species config
SPECIES = [
    {
        'label': '家犬',
        'qid': 'Q39367',       # dog breed
        'taxon_id': 5219174,   # Canis lupus familiaris
        'scientific_name': 'Canis lupus familiaris',
        'common_name_zh': '家犬',
        'taxon_rank': 'SUBSPECIES',
        'taxon_path': 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus',
        'kingdom': 'Animalia', 'phylum': 'Chordata', 'class': 'Mammalia',
        'order': 'Carnivora', 'family': 'Canidae', 'genus': 'Canis',
    },
    {
        'label': '家貓',
        'qid': 'Q43577',       # cat breed
        'taxon_id': 2435099,   # Felis catus
        'scientific_name': 'Felis catus',
        'common_name_zh': '家貓',
        'taxon_rank': 'SPECIES',
        'taxon_path': 'Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus',
        'kingdom': 'Animalia', 'phylum': 'Chordata', 'class': 'Mammalia',
        'order': 'Carnivora', 'family': 'Felidae', 'genus': 'Felis',
    },
    {
        'label': '家馬',
        'qid': 'Q1160573',     # horse breed
        'taxon_id': 2440886,   # Equus caballus
        'scientific_name': 'Equus caballus Linnaeus, 1758',
        'common_name_zh': '家馬',
        'taxon_rank': 'SPECIES',
        'taxon_path': 'Animalia|Chordata|Mammalia|Perissodactyla|Equidae|Equus|Equus caballus',
        'kingdom': 'Animalia', 'phylum': 'Chordata', 'class': 'Mammalia',
        'order': 'Perissodactyla', 'family': 'Equidae', 'genus': 'Equus',
    },
]

# SPARQL query template
SPARQL_TEMPLATE = """
SELECT ?item ?itemLabel ?itemLabel_zhtw ?itemLabel_zh WHERE {{
  ?item wdt:P31 wd:{qid} .
  ?item rdfs:label ?itemLabel .
  FILTER(LANG(?itemLabel) = "en")
  OPTIONAL {{
    ?item rdfs:label ?itemLabel_zhtw .
    FILTER(LANG(?itemLabel_zhtw) = "zh-tw")
  }}
  OPTIONAL {{
    ?item rdfs:label ?itemLabel_zh .
    FILTER(LANG(?itemLabel_zh) = "zh")
  }}
}}
ORDER BY ?itemLabel
"""


def fetch_breeds(species_config):
    """Fetch breeds for a species from Wikidata SPARQL."""
    qid = species_config['qid']
    query = SPARQL_TEMPLATE.format(qid=qid)

    print(f"  Querying Wikidata for {species_config['label']} (wd:{qid})...",
          file=sys.stderr)

    resp = requests.get(WIKIDATA_SPARQL, params={
        'query': query,
        'format': 'json',
    }, headers={
        'User-Agent': UA,
        'Accept': 'application/sparql-results+json',
    }, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    breeds = []
    seen = set()
    for binding in data.get('results', {}).get('bindings', []):
        item_uri = binding.get('item', {}).get('value', '')
        wikidata_id = item_uri.split('/')[-1] if item_uri else None

        name_en = binding.get('itemLabel', {}).get('value', '').strip()
        # Wikidata labels: zh-tw first, then zh (may be mainland usage)
        # All values pass through OpenCC s2twp to guarantee Traditional Chinese
        raw_zhtw = binding.get('itemLabel_zhtw', {}).get('value', '').strip()
        raw_zh = binding.get('itemLabel_zh', {}).get('value', '').strip()
        wikidata_zhtw = _s2twp.convert(raw_zhtw) if raw_zhtw else None
        wikidata_zh = _s2twp.convert(raw_zh) if raw_zh else None

        if not name_en or name_en in seen:
            continue
        if name_en.startswith('Q') and name_en[1:].isdigit():
            continue
        seen.add(name_en)

        breeds.append({
            'taxon_id': species_config['taxon_id'],
            'name_en': name_en,
            'wikidata_zhtw': wikidata_zhtw,
            'wikidata_zh': wikidata_zh,
            'wikidata_id': wikidata_id,
            'wiki_tw': None,  # will be filled by resolve step
        })

    print(f"  Found {len(breeds)} breeds", file=sys.stderr)
    return breeds


def resolve_taiwan_names(breeds):
    """Resolve Taiwan-specific Chinese names via Wikipedia variant conversion.

    Pipeline for each breed:
      1. Use Wikidata API to find zhwiki sitelink (batched)
      2. Use zh.wikipedia parse API with variant=zh-tw to get display title (batched)
    """
    # Build QID → breed index
    qid_to_breeds = {}
    for b in breeds:
        qid = b.get('wikidata_id')
        if qid:
            qid_to_breeds.setdefault(qid, []).append(b)

    all_qids = list(qid_to_breeds.keys())
    print(f"  Resolving zhwiki sitelinks for {len(all_qids)} QIDs...",
          file=sys.stderr)

    # Step 1: Batch fetch zhwiki sitelinks from Wikidata API (50 per request)
    qid_to_zhwiki = {}
    for i in range(0, len(all_qids), 50):
        batch = all_qids[i:i+50]
        try:
            resp = requests.get(WIKIDATA_API, params={
                'action': 'wbgetentities',
                'ids': '|'.join(batch),
                'props': 'sitelinks',
                'sitefilter': 'zhwiki',
                'format': 'json',
            }, headers={'User-Agent': UA}, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            for qid in batch:
                entity = data.get('entities', {}).get(qid, {})
                title = entity.get('sitelinks', {}).get('zhwiki', {}).get('title')
                if title:
                    qid_to_zhwiki[qid] = title
        except Exception as e:
            print(f"    WARN: sitelink batch failed: {e}", file=sys.stderr)
        if i + 50 < len(all_qids):
            time.sleep(0.5)

    print(f"  Found {len(qid_to_zhwiki)} zhwiki sitelinks", file=sys.stderr)

    # Step 2: Batch convert zhwiki titles to zh-tw via Wikipedia parse API
    # Wikipedia parse API only handles one page at a time, but we can use
    # the action=query with converttitles for batch title conversion
    zhwiki_titles = list(set(qid_to_zhwiki.values()))
    title_to_tw = {}

    print(f"  Converting {len(zhwiki_titles)} titles to zh-tw...",
          file=sys.stderr)

    for i in range(0, len(zhwiki_titles), 50):
        batch = zhwiki_titles[i:i+50]
        try:
            resp = requests.get(ZHWIKI_API, params={
                'action': 'query',
                'titles': '|'.join(batch),
                'prop': 'info',
                'variant': 'zh-tw',
                'redirects': 1,
                'format': 'json',
            }, headers={'User-Agent': UA}, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            # Build redirect/normalize mapping
            redirects = {r['from']: r['to']
                         for r in data.get('query', {}).get('redirects', [])}
            normalized = {n['from']: n['to']
                          for n in data.get('query', {}).get('normalized', [])}

            pages = data.get('query', {}).get('pages', {})
            for page in pages.values():
                tw_title = page.get('title', '')
                page_id = page.get('pageid')
                if not page_id or page_id < 0:
                    continue
                # Map back to original title(s)
                for orig_title in batch:
                    resolved = orig_title
                    if resolved in normalized:
                        resolved = normalized[resolved]
                    if resolved in redirects:
                        resolved = redirects[resolved]
                    # The query API returns converted titles directly
                    # We need to map from original → converted
                    title_to_tw[orig_title] = tw_title
        except Exception as e:
            print(f"    WARN: title conversion batch failed: {e}",
                  file=sys.stderr)
        if i + 50 < len(zhwiki_titles):
            time.sleep(0.5)

    # Actually, the action=query approach converts all titles.
    # Let me use a simpler per-title approach for accuracy
    title_to_tw = {}
    converted = 0
    for i, title in enumerate(zhwiki_titles):
        try:
            resp = requests.get(ZHWIKI_API, params={
                'action': 'parse',
                'page': title,
                'prop': 'displaytitle',
                'variant': 'zh-tw',
                'format': 'json',
                'redirects': 1,
            }, headers={'User-Agent': UA}, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            dt = data.get('parse', {}).get('displaytitle', '')
            tw = re.sub(r'<[^>]+>', '', dt).strip()
            if tw:
                title_to_tw[title] = tw
                converted += 1
        except Exception:
            pass
        # Rate limit: ~5 req/s
        if (i + 1) % 5 == 0:
            time.sleep(1)
        if (i + 1) % 100 == 0:
            print(f"    ... converted {i+1}/{len(zhwiki_titles)}",
                  file=sys.stderr)

    print(f"  Converted {converted} titles to zh-tw", file=sys.stderr)

    # Step 3: Apply resolved names to breeds
    applied = 0
    for qid, zhwiki_title in qid_to_zhwiki.items():
        tw_name = title_to_tw.get(zhwiki_title)
        if tw_name and qid in qid_to_breeds:
            for b in qid_to_breeds[qid]:
                b['wiki_tw'] = tw_name
                applied += 1

    print(f"  Applied zh-tw names to {applied} breeds", file=sys.stderr)


def pick_best_zh(breed):
    """Pick best Chinese name: Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh."""
    return breed.get('wiki_tw') or breed.get('wikidata_zhtw') or breed.get('wikidata_zh')


def escape_sql(value):
    """Escape a string for SQL single-quote literals."""
    if value is None:
        return 'NULL'
    return "'" + value.replace("'", "''") + "'"


def generate_sql(all_breeds):
    """Generate SQL INSERT statements."""
    lines = []
    lines.append('-- ============================================================')
    lines.append('-- VTaxon 品種種子資料（由 scripts/fetch_breeds_wikidata.py 自動生成）')
    lines.append('-- 中文名優先順序：Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh')
    lines.append('-- ============================================================')
    lines.append('')

    # Prerequisite: ensure parent species exist in species_cache
    lines.append('-- 前置：確保母物種存在於 species_cache')
    for sc in SPECIES:
        lines.append(
            f"INSERT INTO species_cache (taxon_id, scientific_name, common_name_zh, "
            f"taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus) VALUES "
            f"({sc['taxon_id']}, {escape_sql(sc['scientific_name'])}, "
            f"{escape_sql(sc['common_name_zh'])}, {escape_sql(sc['taxon_rank'])}, "
            f"{escape_sql(sc['taxon_path'])}, {escape_sql(sc['kingdom'])}, "
            f"{escape_sql(sc['phylum'])}, {escape_sql(sc['class'])}, "
            f"{escape_sql(sc['order'])}, {escape_sql(sc['family'])}, "
            f"{escape_sql(sc['genus'])})"
            f"\nON CONFLICT (taxon_id) DO NOTHING;"
        )
    lines.append('')

    for species_config in SPECIES:
        taxon_id = species_config['taxon_id']
        breeds = [b for b in all_breeds if b['taxon_id'] == taxon_id]
        if not breeds:
            continue

        zh_count = sum(1 for b in breeds if pick_best_zh(b))
        lines.append(f"-- {species_config['label']} (taxon_id={taxon_id}): "
                     f"{len(breeds)} 品種, {zh_count} 有中文名")

        for b in breeds:
            name_zh = pick_best_zh(b)
            lines.append(
                f"INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES "
                f"({b['taxon_id']}, {escape_sql(b['name_en'])}, {escape_sql(name_zh)}, "
                f"{escape_sql(b['wikidata_id'])}, 'wikidata')"
                f"\nON CONFLICT (taxon_id, name_en) DO UPDATE SET "
                f"wikidata_id = EXCLUDED.wikidata_id, "
                f"source = EXCLUDED.source, "
                f"name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);"
            )

        lines.append('')

    return '\n'.join(lines)


def main():
    all_breeds = []
    for species_config in SPECIES:
        try:
            breeds = fetch_breeds(species_config)
            all_breeds.extend(breeds)
        except Exception as e:
            print(f"  ERROR fetching {species_config['label']}: {e}",
                  file=sys.stderr)
        time.sleep(2)

    print(f"\nTotal: {len(all_breeds)} breeds", file=sys.stderr)

    # Resolve Taiwan-specific names via Wikipedia
    print(f"\n--- Resolving Taiwan Chinese names via Wikipedia ---",
          file=sys.stderr)
    resolve_taiwan_names(all_breeds)

    # Stats
    wiki_tw_count = sum(1 for b in all_breeds if b.get('wiki_tw'))
    wd_zhtw_count = sum(1 for b in all_breeds if b.get('wikidata_zhtw'))
    wd_zh_count = sum(1 for b in all_breeds if b.get('wikidata_zh'))
    best_count = sum(1 for b in all_breeds if pick_best_zh(b))
    print(f"\nName sources:", file=sys.stderr)
    print(f"  Wikipedia zh-tw:  {wiki_tw_count}", file=sys.stderr)
    print(f"  Wikidata zh-tw:   {wd_zhtw_count}", file=sys.stderr)
    print(f"  Wikidata zh:      {wd_zh_count}", file=sys.stderr)
    print(f"  Total with zh:    {best_count}", file=sys.stderr)

    sql = generate_sql(all_breeds)

    output_path = Path(__file__).parent.parent / 'backend' / 'seeds' / 'breeds.sql'
    output_path.write_text(sql, encoding='utf-8')
    print(f"\nWritten to {output_path}", file=sys.stderr)


if __name__ == '__main__':
    main()
