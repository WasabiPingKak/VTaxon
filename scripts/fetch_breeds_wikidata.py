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
    {
        'label': '家兔',
        'qid': 'Q12045584',    # rabbit breed
        'taxon_id': 2436940,   # Oryctolagus cuniculus
        'scientific_name': 'Oryctolagus cuniculus (Linnaeus, 1758)',
        'common_name_zh': '穴兔',
        'taxon_rank': 'SPECIES',
        'taxon_path': 'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Oryctolagus|Oryctolagus cuniculus',
        'kingdom': 'Animalia', 'phylum': 'Chordata', 'class': 'Mammalia',
        'order': 'Lagomorpha', 'family': 'Leporidae', 'genus': 'Oryctolagus',
    },
    {
        'label': '天竺鼠',
        'qid': 'Q110529959',   # cavy breed
        'taxon_id': 5219702,   # Cavia porcellus
        'scientific_name': 'Cavia porcellus (Linnaeus, 1758)',
        'common_name_zh': '天竺鼠',
        'taxon_rank': 'SPECIES',
        'taxon_path': 'Animalia|Chordata|Mammalia|Rodentia|Caviidae|Cavia|Cavia porcellus',
        'kingdom': 'Animalia', 'phylum': 'Chordata', 'class': 'Mammalia',
        'order': 'Rodentia', 'family': 'Caviidae', 'genus': 'Cavia',
    },
]

# Static Taiwan Traditional Chinese names for rabbit breeds.
# Priority: these override Wikidata/Wikipedia names which often use mainland terms.
# Sources: 台灣愛兔協會, 道格兔, 優荳寵物兔舍, zh.wikipedia zh-tw variant.
# Key = English breed name (must match Wikidata label exactly).
RABBIT_ZH_TW = {
    # --- ARBA 認可品種 (52+) ---
    'American rabbit': '美國兔',
    'American Fuzzy Lop': '美國費斯垂耳兔',
    'American Sable': '美洲黑貂兔',
    'English Angora': '英國安哥拉兔',
    'English Angora rabbit': '英國安哥拉兔',
    'French Angora': '法國安哥拉兔',
    'French Angora rabbit': '法國安哥拉兔',
    'Giant Angora': '巨型安哥拉兔',
    'Giant Angora rabbit': '巨型安哥拉兔',
    'Satin Angora': '緞毛安哥拉兔',
    'Satin Angora rabbit': '緞毛安哥拉兔',
    'Angora rabbit': '安哥拉兔',
    'Belgian Hare': '比利時野兔',
    'Beveren': '貝弗倫兔',
    'Beveren rabbit': '貝弗倫兔',
    'Blanc de Hotot': '海棠兔',
    'Britannia Petite': '不列塔尼亞小兔',
    'Californian rabbit': '加州兔',
    'Champagne d\'Argent': '香檳銀兔',
    'Checkered Giant': '格紋巨兔',
    'Checkered Giant rabbit': '格紋巨兔',
    'American Chinchilla rabbit': '美國金吉拉兔',
    'American Chinchilla': '美國金吉拉兔',
    'Giant Chinchilla rabbit': '巨型金吉拉兔',
    'Giant Chinchilla': '巨型金吉拉兔',
    'Standard Chinchilla rabbit': '標準金吉拉兔',
    'Standard Chinchilla': '標準金吉拉兔',
    'Chinchilla rabbit': '金吉拉兔',
    'Cinnamon rabbit': '肉桂兔',
    'Crème d\'Argent': '奶油銀兔',
    'Creme d\'Argent': '奶油銀兔',
    'Dutch rabbit': '道奇兔',
    'Dwarf Hotot': '侏儒海棠兔',
    'English Lop': '英國垂耳兔',
    'English Spot': '英國斑點兔',
    'English Spot rabbit': '英國斑點兔',
    'Flemish Giant': '佛萊明巨兔',
    'Flemish Giant rabbit': '佛萊明巨兔',
    'Florida White': '佛羅里達白兔',
    'Florida White rabbit': '佛羅里達白兔',
    'French Lop': '法國垂耳兔',
    'Harlequin rabbit': '丑角兔',
    'Havana rabbit': '哈瓦那兔',
    'Himalayan rabbit': '喜馬拉雅兔',
    'Holland Lop': '荷蘭垂耳兔',
    'Jersey Wooly': '澤西長毛兔',
    'Lilac rabbit': '丁香兔',
    'Lionhead rabbit': '獅子兔',
    'Mini Lop': '迷你垂耳兔',
    'Mini Rex': '迷你力克斯兔',
    'Mini Satin': '迷你緞毛兔',
    'Mini Satin rabbit': '迷你緞毛兔',
    'Netherland Dwarf': '荷蘭侏儒兔',
    'Netherland Dwarf rabbit': '荷蘭侏儒兔',
    'New Zealand rabbit': '紐西蘭兔',
    'New Zealand white rabbit': '紐西蘭白兔',
    'Palomino rabbit': '帕洛米諾兔',
    'Polish rabbit': '波蘭兔',
    'Rex rabbit': '力克斯兔',
    'Rhinelander rabbit': '萊茵蘭兔',
    'Satin rabbit': '緞毛兔',
    'Silver rabbit': '銀兔',
    'Silver Fox rabbit': '銀狐兔',
    'Silver Marten': '銀貂兔',
    'Silver Marten rabbit': '銀貂兔',
    'Tan rabbit': '棕褐兔',
    'Thrianta': '崔安塔兔',
    'Thrianta rabbit': '崔安塔兔',
    'Argente Brun': '棕銀兔',
    'Blue Holicer': '藍色霍利瑟兔',
    'Czech Frosty': '捷克霜兔',
    'Dwarf Papillon': '侏儒蝴蝶兔',
    # --- BRC / 歐洲常見品種 ---
    'German Lop': '德國垂耳兔',
    'Cashmere Lop': '喀什米爾垂耳兔',
    'Continental Giant rabbit': '大陸巨兔',
    'British Giant': '英國巨兔',
    'Lion Lop': '獅子垂耳兔',
    'Mini Lion Lop': '迷你獅子垂耳兔',
    'Dwarf Lop': '侏儒垂耳兔',
    'Plush Lop': '絨毛垂耳兔',
    'Swiss Fox rabbit': '瑞士狐兔',
    'Vienna rabbit': '維也納兔',
    'Papillon rabbit': '蝴蝶兔',
    'Giant Papillon': '巨型蝴蝶兔',
    # --- 其他常見品種 ---
    'Lop rabbit': '垂耳兔',
    'Alaska rabbit': '阿拉斯加兔',
    'Blanc de Bouscat': '布斯卡白兔',
    'Blanc de Termonde': '泰爾蒙德白兔',
    'Argente de Champagne': '香檳銀兔',
    'Argente Bleu': '藍銀兔',
    'Argente Crème': '奶油銀兔',
    'Argente Noir': '黑銀兔',
    'Argente St Hubert': '聖休伯特銀兔',
    'Deilenaar': '戴勒納兔',
    'Enderby Island rabbit': '恩德比島兔',
    'Fauve de Bourgogne': '勃艮第黃褐兔',
    'German Angora': '德國安哥拉兔',
    'German Giant': '德國巨兔',
    'Gotland rabbit': '哥特蘭兔',
    'Hulstlander': '胡斯特蘭德兔',
    'Meissner Lop': '麥森垂耳兔',
    'New Zealand red rabbit': '紐西蘭紅兔',
    'New Zealand black rabbit': '紐西蘭黑兔',
    'Sallander rabbit': '薩蘭德兔',
    'Smoke Pearl rabbit': '煙珠兔',
    'Squirrel rabbit': '松鼠兔',
    'Sussex rabbit': '薩塞克斯兔',
    'Perlfee': '珍珠灰兔',
    # --- Wikidata 名稱變體（無 "rabbit" 後綴）---
    'Havana': '哈瓦那兔',
    'Sallander': '薩蘭德兔',
    'Satin': '緞毛兔',
    'Swiss Fox': '瑞士狐兔',
    'Dalmatian': '達爾馬提亞兔',
    'Enderby Island Rabbit': '恩德比島兔',
    'British Giant rabbit': '英國巨兔',
    # --- 補充歐洲 / 其他品種 ---
    'Thuringer': '圖林根兔',
    'Siamese Sable rabbit': '暹羅貂色兔',
    'Fox (rabbit)': '狐兔',
    'Fee de Marbourg': '馬爾堡灰兔',
    'Dwarf Angora': '侏儒安哥拉兔',
    'Dwarf checkered rabbit': '侏儒格紋兔',
    'Miniature Checkered rabbit': '迷你格紋兔',
    'Czech Red': '捷克紅兔',
    'Czech Spotted Rabbit': '捷克斑點兔',
    'Czech Black Guard Haired Rabbit': '捷克黑護毛兔',
    'Swedish Hare': '瑞典野兔',
    'Stone rabbit': '石兔',
    'Carmagnola Grey': '卡馬尼奧拉灰兔',
    'Sachsengold': '薩克森金兔',
    'Grey Pearl of Halle': '哈勒灰珍珠兔',
    'Golden Glavcot': '金色格拉夫科特兔',
    'Graue Wiener': '灰色維也納兔',
    'Weisser Wiener': '白色維也納兔',
    'Brown Chestnut of Lorraine': '洛林棕栗兔',
    'Bourbonnais Grey': '布邦內灰兔',
    'Tri Coloured Dutch': '三色道奇兔',
    'Velveteen Lop': '絲絨垂耳兔',
    'Rhönkaninchen': '勒恩兔',
    'Mecklenburger Schecke': '梅克倫堡花斑兔',
}

# Static Taiwan Traditional Chinese names for guinea pig breeds.
# Sources: 台灣天竺鼠飼養社群, ARBA 品種標準, zh.wikipedia.
# Key = English breed name (must match Wikidata label or manual list).
GUINEA_PIG_ZH_TW = {
    # --- ARBA 認可品種 (13) ---
    'Abyssinian guinea pig': '阿比西尼亞天竺鼠',
    'Abyssinian': '阿比西尼亞天竺鼠',
    'Abyssinian Satin guinea pig': '緞毛阿比西尼亞天竺鼠',
    'Abyssinian Satin': '緞毛阿比西尼亞天竺鼠',
    'American guinea pig': '美國短毛天竺鼠',
    'American': '美國短毛天竺鼠',
    'American Satin guinea pig': '緞毛美國短毛天竺鼠',
    'American Satin': '緞毛美國短毛天竺鼠',
    'Coronet guinea pig': '冠毛天竺鼠',
    'Coronet': '冠毛天竺鼠',
    'Peruvian guinea pig': '秘魯天竺鼠',
    'Peruvian': '秘魯天竺鼠',
    'Peruvian Satin guinea pig': '緞毛秘魯天竺鼠',
    'Peruvian Satin': '緞毛秘魯天竺鼠',
    'Silkie guinea pig': '喜樂蒂天竺鼠',
    'Silkie': '喜樂蒂天竺鼠',
    'Silkie Satin guinea pig': '緞毛喜樂蒂天竺鼠',
    'Silkie Satin': '緞毛喜樂蒂天竺鼠',
    'Teddy guinea pig': '泰迪天竺鼠',
    'Teddy': '泰迪天竺鼠',
    'Teddy Satin guinea pig': '緞毛泰迪天竺鼠',
    'Teddy Satin': '緞毛泰迪天竺鼠',
    'Texel guinea pig': '德塞爾天竺鼠',
    'Texel': '德塞爾天竺鼠',
    'White Crested guinea pig': '白冠毛天竺鼠',
    'White Crested': '白冠毛天竺鼠',
    # --- 常見非 ARBA 品種 (7) ---
    'Skinny guinea pig': '無毛天竺鼠',
    'Skinny pig': '無毛天竺鼠',
    'Skinny': '無毛天竺鼠',
    'Baldwin guinea pig': '鮑德溫天竺鼠',
    'Baldwin': '鮑德溫天竺鼠',
    'Lunkarya guinea pig': '倫卡瑞亞天竺鼠',
    'Lunkarya': '倫卡瑞亞天竺鼠',
    'Sheba guinea pig': '席巴天竺鼠',
    'Sheba': '席巴天竺鼠',
    'Sheba Mini Yak': '席巴天竺鼠',
    'Alpaca guinea pig': '羊駝天竺鼠',
    'Alpaca': '羊駝天竺鼠',
    'Merino guinea pig': '美利諾天竺鼠',
    'Merino': '美利諾天竺鼠',
    'Rex guinea pig': '雷克斯天竺鼠',
    'Rex': '雷克斯天竺鼠',
}

# Manual guinea pig breeds not captured by Wikidata SPARQL.
# Wikidata coverage for guinea pig breeds is extremely poor.
GUINEA_PIG_MANUAL_BREEDS = [
    {'name_en': 'American guinea pig', 'name_zh': '美國短毛天竺鼠', 'wikidata_id': 'Q4744656'},
    {'name_en': 'Abyssinian guinea pig', 'name_zh': '阿比西尼亞天竺鼠', 'wikidata_id': 'Q4669703'},
    {'name_en': 'Peruvian guinea pig', 'name_zh': '秘魯天竺鼠', 'wikidata_id': 'Q7170924'},
    {'name_en': 'Silkie guinea pig', 'name_zh': '喜樂蒂天竺鼠', 'wikidata_id': 'Q7515450'},
    {'name_en': 'Teddy guinea pig', 'name_zh': '泰迪天竺鼠', 'wikidata_id': 'Q7694658'},
    {'name_en': 'Texel guinea pig', 'name_zh': '德塞爾天竺鼠', 'wikidata_id': 'Q7707786'},
    {'name_en': 'Coronet guinea pig', 'name_zh': '冠毛天竺鼠', 'wikidata_id': 'Q5172755'},
    {'name_en': 'White Crested guinea pig', 'name_zh': '白冠毛天竺鼠', 'wikidata_id': 'Q8003637'},
    {'name_en': 'American Satin guinea pig', 'name_zh': '緞毛美國短毛天竺鼠', 'wikidata_id': None},
    {'name_en': 'Abyssinian Satin guinea pig', 'name_zh': '緞毛阿比西尼亞天竺鼠', 'wikidata_id': None},
    {'name_en': 'Peruvian Satin guinea pig', 'name_zh': '緞毛秘魯天竺鼠', 'wikidata_id': None},
    {'name_en': 'Silkie Satin guinea pig', 'name_zh': '緞毛喜樂蒂天竺鼠', 'wikidata_id': None},
    {'name_en': 'Teddy Satin guinea pig', 'name_zh': '緞毛泰迪天竺鼠', 'wikidata_id': None},
    {'name_en': 'Skinny pig', 'name_zh': '無毛天竺鼠', 'wikidata_id': 'Q2292658'},
    {'name_en': 'Baldwin guinea pig', 'name_zh': '鮑德溫天竺鼠', 'wikidata_id': None},
    {'name_en': 'Lunkarya guinea pig', 'name_zh': '倫卡瑞亞天竺鼠', 'wikidata_id': 'Q1876543'},
    {'name_en': 'Sheba guinea pig', 'name_zh': '席巴天竺鼠', 'wikidata_id': None},
    {'name_en': 'Alpaca guinea pig', 'name_zh': '羊駝天竺鼠', 'wikidata_id': None},
    {'name_en': 'Merino guinea pig', 'name_zh': '美利諾天竺鼠', 'wikidata_id': None},
    {'name_en': 'Rex guinea pig', 'name_zh': '雷克斯天竺鼠', 'wikidata_id': None},
]

# Manual rabbit breeds not captured by Wikidata SPARQL (P31≠Q12045584).
# These are important ARBA/BRC breeds that Wikidata classifies differently.
RABBIT_MANUAL_BREEDS = [
    {'name_en': 'Netherland Dwarf', 'name_zh': '荷蘭侏儒兔', 'wikidata_id': 'Q9677'},
    {'name_en': 'English Angora rabbit', 'name_zh': '英國安哥拉兔', 'wikidata_id': 'Q5379044'},
    {'name_en': 'Giant Angora rabbit', 'name_zh': '巨型安哥拉兔', 'wikidata_id': 'Q5558319'},
    {'name_en': 'Satin Angora rabbit', 'name_zh': '緞毛安哥拉兔', 'wikidata_id': 'Q7427082'},
    {'name_en': 'Britannia Petite', 'name_zh': '不列塔尼亞小兔', 'wikidata_id': 'Q4966684'},
    {'name_en': 'Champagne d\'Argent', 'name_zh': '香檳銀兔', 'wikidata_id': 'Q2957003'},
    {'name_en': 'Cinnamon rabbit', 'name_zh': '肉桂兔', 'wikidata_id': 'Q5120826'},
    {'name_en': 'Crème d\'Argent', 'name_zh': '奶油銀兔', 'wikidata_id': 'Q3002879'},
    {'name_en': 'English Lop', 'name_zh': '英國垂耳兔', 'wikidata_id': 'Q3055775'},
    {'name_en': 'Florida White rabbit', 'name_zh': '佛羅里達白兔', 'wikidata_id': 'Q5462709'},
    {'name_en': 'French Lop', 'name_zh': '法國垂耳兔', 'wikidata_id': 'Q3089451'},
    {'name_en': 'Lilac rabbit', 'name_zh': '丁香兔', 'wikidata_id': 'Q6547912'},
    {'name_en': 'Mini Satin rabbit', 'name_zh': '迷你緞毛兔', 'wikidata_id': 'Q6864210'},
    {'name_en': 'Palomino rabbit', 'name_zh': '帕洛米諾兔', 'wikidata_id': 'Q7128584'},
    {'name_en': 'Silver rabbit', 'name_zh': '銀兔', 'wikidata_id': 'Q7515897'},
    {'name_en': 'Silver Fox rabbit', 'name_zh': '銀狐兔', 'wikidata_id': 'Q7515868'},
    {'name_en': 'Silver Marten rabbit', 'name_zh': '銀貂兔', 'wikidata_id': 'Q7515875'},
    {'name_en': 'Tan rabbit', 'name_zh': '棕褐兔', 'wikidata_id': 'Q3514456'},
    {'name_en': 'Thrianta rabbit', 'name_zh': '崔安塔兔', 'wikidata_id': 'Q3530698'},
    {'name_en': 'German Lop', 'name_zh': '德國垂耳兔', 'wikidata_id': 'Q1512483'},
    {'name_en': 'Cashmere Lop', 'name_zh': '喀什米爾垂耳兔', 'wikidata_id': 'Q5049148'},
    {'name_en': 'Continental Giant rabbit', 'name_zh': '大陸巨兔', 'wikidata_id': 'Q5164645'},
    {'name_en': 'Lion Lop', 'name_zh': '獅子垂耳兔', 'wikidata_id': 'Q6554942'},
    {'name_en': 'Mini Lion Lop', 'name_zh': '迷你獅子垂耳兔', 'wikidata_id': 'Q6864146'},
    {'name_en': 'Dwarf Lop', 'name_zh': '侏儒垂耳兔', 'wikidata_id': 'Q3040700'},
]

# Species-specific static name config: taxon_id → (zh_dict, suffixes_to_strip_or_add)
_SPECIES_STATIC_CONFIG = {
    2436940: (RABBIT_ZH_TW, ['rabbit', 'Rabbit']),
    5219702: (GUINEA_PIG_ZH_TW, ['guinea pig', 'Guinea pig', 'cavy']),
}

# Manual breeds config: breed class QID → manual breed list
_MANUAL_BREEDS_MAP = {
    'Q12045584': RABBIT_MANUAL_BREEDS,
    'Q110529959': GUINEA_PIG_MANUAL_BREEDS,
}

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

    # Merge manual breeds (not found in SPARQL due to P31 mismatch)
    manual_list = _MANUAL_BREEDS_MAP.get(qid, [])
    if manual_list:
        manual_added = 0
        for mb in manual_list:
            if mb['name_en'] not in seen:
                breeds.append({
                    'taxon_id': species_config['taxon_id'],
                    'name_en': mb['name_en'],
                    'wikidata_zhtw': None,
                    'wikidata_zh': None,
                    'wikidata_id': mb.get('wikidata_id'),
                    'wiki_tw': None,
                    'static_zh': mb.get('name_zh'),
                })
                seen.add(mb['name_en'])
                manual_added += 1
        if manual_added:
            print(f"  + {manual_added} manual breeds added", file=sys.stderr)

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


def _match_in_dict(name_en, zh_dict, suffixes):
    """Try to find name_en in zh_dict with flexible suffix matching.

    Tries: exact match → without suffix → with first suffix appended.
    """
    if name_en in zh_dict:
        return zh_dict[name_en]
    # Try removing known suffixes
    for suffix in suffixes:
        full_suffix = ' ' + suffix
        if name_en.endswith(full_suffix):
            base = name_en[:-len(full_suffix)]
            if base in zh_dict:
                return zh_dict[base]
    # Try adding first suffix
    if suffixes:
        with_suffix = name_en + ' ' + suffixes[0]
        if with_suffix in zh_dict:
            return zh_dict[with_suffix]
    return None


def _lookup_static_zh(name_en, taxon_id=None):
    """Look up static Chinese name with flexible matching.

    Only searches the species-specific dict for the given taxon_id.
    Names like 'Abyssinian' or 'Rex' have different meanings across species,
    so cross-species fallback is intentionally NOT done.
    """
    if taxon_id and taxon_id in _SPECIES_STATIC_CONFIG:
        zh_dict, suffixes = _SPECIES_STATIC_CONFIG[taxon_id]
        return _match_in_dict(name_en, zh_dict, suffixes)
    return None


def apply_static_overrides(all_breeds):
    """Apply static Taiwan Chinese name overrides for all species with static dicts."""
    applied = 0
    for b in all_breeds:
        name_en = b.get('name_en', '')
        zh = _lookup_static_zh(name_en, b.get('taxon_id'))
        if zh:
            b['static_zh'] = zh
            applied += 1
    if applied:
        print(f"  Applied {applied} static zh-tw overrides", file=sys.stderr)


def pick_best_zh(breed):
    """Pick best Chinese name.

    Priority: static override > Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh.
    """
    return (breed.get('static_zh')
            or breed.get('wiki_tw')
            or breed.get('wikidata_zhtw')
            or breed.get('wikidata_zh'))


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
    lines.append('-- 中文名優先順序：靜態台灣用語 > Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh')
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

    # Apply static overrides (highest priority, especially for rabbit breeds)
    print(f"\n--- Applying static Taiwan Chinese overrides ---",
          file=sys.stderr)
    apply_static_overrides(all_breeds)

    # Stats
    static_count = sum(1 for b in all_breeds if b.get('static_zh'))
    wiki_tw_count = sum(1 for b in all_breeds if b.get('wiki_tw'))
    wd_zhtw_count = sum(1 for b in all_breeds if b.get('wikidata_zhtw'))
    wd_zh_count = sum(1 for b in all_breeds if b.get('wikidata_zh'))
    best_count = sum(1 for b in all_breeds if pick_best_zh(b))
    print(f"\nName sources:", file=sys.stderr)
    print(f"  Static zh-tw:     {static_count}", file=sys.stderr)
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
