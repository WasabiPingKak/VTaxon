/**
 * Generate AI classification prompt from fictional species list.
 * Shared between FictionalSpeciesPicker and SettingsRealSpecies.
 */

const ORIGIN_ORDER = [
  '東方神話', '西方神話', '奇幻文學',
  '人造生命', '非物質生命', '現代虛構',
];
const SUB_ORIGIN_ORDER = {
  '東方神話': ['中國神話', '日本神話', '台灣民間傳說'],
  '西方神話': ['希臘神話', '北歐神話', '歐洲民間傳說', '埃及神話'],
  '奇幻文學': ['通用'],
  '人造生命': ['機械生命', '生物合成'],
  '非物質生命': ['能量態生命', '意識態生命', '資訊態生命'],
  '現代虛構': ['克蘇魯神話', '都市傳說', '科幻'],
};

function sortByOrder(keys, order) {
  const rank = new Map(order.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}

function buildFictionalTree(speciesList) {
  const grouped = {};
  for (const sp of speciesList) {
    const origin = sp.origin || '其他';
    const sub = sp.sub_origin || '（未分類）';
    if (!grouped[origin]) grouped[origin] = {};
    if (!grouped[origin][sub]) grouped[origin][sub] = [];
    const label = sp.name_zh
      ? `${sp.name_zh}（${sp.name}）`
      : sp.name;
    grouped[origin][sub].push(label);
  }

  let body = '';
  for (const origin of sortByOrder(Object.keys(grouped), ORIGIN_ORDER)) {
    body += `### ${origin}\n`;
    const subs = grouped[origin];
    for (const sub of sortByOrder(Object.keys(subs), SUB_ORIGIN_ORDER[origin] || [])) {
      body += `- ${sub}：${subs[sub].join('、')}\n`;
    }
    body += '\n';
  }
  return body;
}


export function generateClassifyPrompt(fictionalSpeciesList) {
  const tree = buildFictionalTree(fictionalSpeciesList);

  return `我正在使用 VTaxon（Vtuber 生物分類系統）為我的 Vtuber 角色標註物種特徵。

請根據我的角色描述，幫我判斷適合的分類。

---

## 系統說明

VTaxon 將 Vtuber 角色對應到生物分類體系。
一個角色可以同時登記多個物種——只要覺得自己是、或者角色具有該物種的特徵，就可以加上去。
例如一個「狐耳機械少女」可以同時標註「赤狐」+「妖狐」+「機器人」。

系統有兩種分類，**不一定都要選**，看角色設定而定：

### 一、真實物種（使用 GBIF 生物分類資料庫）

系統使用**拉丁學名**搜尋，中文名或俗名經常查不到。
請務必提供拉丁學名，讓我可以直接複製貼上搜尋。

- 可選階層：目(Order) → 科(Family) → 屬(Genus) → 種(Species) → 亞種(Subspecies)
- 不接受界(Kingdom)、門(Phylum)、綱(Class)，太寬泛
- 建議精確到「種」或「屬」

#### 品種系統

部分常見物種支援品種（Breed）選擇，選定物種後可進一步指定品種：
- **家犬** Canis lupus familiaris — 約 900 品種（柴犬、哈士奇、柯基…）
- **家貓** Felis catus — 約 130 品種（布偶貓、英國短毛、曼赤肯…）
- **家馬** Equus caballus — 約 670 品種（阿拉伯馬、純血馬…）
- **家兔** Oryctolagus cuniculus — 約 130 品種（荷蘭垂耳兔、侏儒兔…）
- **天竺鼠** Cavia porcellus — 約 24 品種（阿比西尼亞、秘魯天竺鼠…）

如果你的角色有特定品種特徵（例如「藍色眼睛的暹羅貓」），請一併標註品種名稱。

**常見對應範例：**
| 角色特徵 | 建議搜尋 |
|---------|---------|
| 貓耳、貓娘 | Felis catus（家貓）→ 可選品種如 Ragdoll（布偶貓） |
| 犬系、狼系 | Canis lupus familiaris（家犬）→ 可選品種如 Shiba Inu（柴犬） |
| 狐耳 | Vulpes vulpes（赤狐） |
| 兔耳 | Oryctolagus cuniculus（穴兔）→ 可選品種如 Holland Lop（荷蘭垂耳兔） |
| 鹿角 | Cervus（鹿屬） |
| 龍蝦、蝦 | Homarus（龍蝦屬）或 Decapoda（十足目） |
| 鯊魚 | Selachimorpha 或具體如 Carcharodon carcharias（大白鯊） |
| 蛇 | Serpentes（蛇亞目）或具體種 |
| 鷹、猛禽 | Accipitridae（鷹科）或具體種 |
| 蝴蝶 | Lepidoptera（鱗翅目）或具體種 |
| 馬、馬娘 | Equus caballus（家馬）→ 可選品種如 Thoroughbred（純血馬） |
| 天竺鼠 | Cavia porcellus（天竺鼠）→ 可選品種如 Abyssinian（阿比西尼亞） |

### 二、虛構物種（VTaxon 專屬分類，非必選）

如果角色帶有神話、奇幻、超自然元素，可以從以下列表中選擇對應的虛構物種。
純現實動物形象的角色**不需要**選虛構物種。

以下是系統中所有可選的虛構物種：

${tree}---

## 我的角色描述

[請在這裡描述你的角色外觀、設定、靈感來源]

---

## 請你回答

### 真實物種（如適用）
- 提供拉丁學名（我需要直接複製到系統搜尋）
- 格式：\`學名\` — 中文說明（階層）
- 範例：\`Vulpes vulpes\` — 赤狐（Species）
- 如果該物種有品種系統，請額外推薦品種
- 品種格式：\`品種英文名\` — 中文名
- 範例：\`Ragdoll\` — 布偶貓

### 虛構物種（如適用）
- 只在角色有神話/奇幻/超自然元素時才需要
- 從上方列表中選擇（可多個）
- 格式：大分類 → 子分類 → 物種名
- 如果列表中沒有適合的，直接說「無適合的虛構物種」即可，不需要硬選

### 綜合建議
- 建議的完整標註組合
- 簡述理由`;
}
