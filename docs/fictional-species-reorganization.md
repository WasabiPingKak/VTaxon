# 虛構物種分類重整對應表

> 日期：2026-03-09
> 目的：在 sub_origin 與 species 之間新增「類型」層，增加樹的深度
> 規則：category_path 類型段使用中文，前端 buildFictionalTree 以 segment 文字作為顯示名

## 符號說明

- `→` 表示 category_path 變更（舊→新）
- `(新增)` 表示全新物種
- 維持 3 段的分類不在此表中列出（路徑不變）

---

## 一、東方神話 → 日本神話（19 種 → 4 群）

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 妖狐 | Kitsune | `東方神話\|日本神話\|Kitsune` | `東方神話\|日本神話\|妖獸\|Kitsune` |
| 2 | 狸貓 | Tanuki | `東方神話\|日本神話\|Tanuki` | `東方神話\|日本神話\|妖獸\|Tanuki` |
| 3 | 貓又 | Nekomata | `東方神話\|日本神話\|Nekomata` | `東方神話\|日本神話\|妖獸\|Nekomata` |
| 4 | 化貓 | Bakeneko | `東方神話\|日本神話\|Bakeneko` | `東方神話\|日本神話\|妖獸\|Bakeneko` |
| 5 | 絡新婦 | Jorogumo | `東方神話\|日本神話\|Jorogumo` | `東方神話\|日本神話\|妖獸\|Jorogumo` |
| 6 | 鎌鼬 | Kamaitachi | `東方神話\|日本神話\|Kamaitachi` | `東方神話\|日本神話\|妖獸\|Kamaitachi` |
| 7 | 犬神 | Inugami | `東方神話\|日本神話\|Inugami` | `東方神話\|日本神話\|妖獸\|Inugami` |
| 8 | 八咫烏 | Yatagarasu | `東方神話\|日本神話\|Yatagarasu` | `東方神話\|日本神話\|妖獸\|Yatagarasu` |
| 9 | 鵺 | Nue | `東方神話\|日本神話\|Nue` | `東方神話\|日本神話\|妖獸\|Nue` |
| 10 | 鬼 | Oni | `東方神話\|日本神話\|Oni` | `東方神話\|日本神話\|鬼怪\|Oni` |
| 11 | 河童 | Kappa | `東方神話\|日本神話\|Kappa` | `東方神話\|日本神話\|鬼怪\|Kappa` |
| 12 | 雪女 | Yuki-onna | `東方神話\|日本神話\|Yuki-onna` | `東方神話\|日本神話\|鬼怪\|Yuki-onna` |
| 13 | 天狗 | Tengu | `東方神話\|日本神話\|Tengu` | `東方神話\|日本神話\|鬼怪\|Tengu` |
| 14 | 式神 | Shikigami | `東方神話\|日本神話\|Shikigami` | `東方神話\|日本神話\|靈體\|Shikigami` |
| 15 | 座敷童子 | Zashiki-warashi | `東方神話\|日本神話\|Zashiki-warashi` | `東方神話\|日本神話\|靈體\|Zashiki-warashi` |
| 16 | 付喪神 | Tsukumogami | `東方神話\|日本神話\|Tsukumogami` | `東方神話\|日本神話\|靈體\|Tsukumogami` |
| 17 | 天女 | Tennyo | `東方神話\|日本神話\|Tennyo` | `東方神話\|日本神話\|靈體\|Tennyo` |
| 18 | 東方龍 | Dragon (Eastern) | `東方神話\|日本神話\|Dragon` | `東方神話\|日本神話\|神獸\|Dragon (Eastern)` |
| 19 | 八岐大蛇 | Yamata no Orochi | `東方神話\|日本神話\|Yamata no Orochi` | `東方神話\|日本神話\|神獸\|Yamata no Orochi` |

---

## 二、東方神話 → 中國神話（22 種 → 6 群）

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 青龍 | Azure Dragon | `東方神話\|中國神話\|Azure Dragon` | `東方神話\|中國神話\|四聖獸\|Azure Dragon` |
| 2 | 白虎 | White Tiger | `東方神話\|中國神話\|White Tiger` | `東方神話\|中國神話\|四聖獸\|White Tiger` |
| 3 | 朱雀 | Vermilion Bird | `東方神話\|中國神話\|Vermilion Bird` | `東方神話\|中國神話\|四聖獸\|Vermilion Bird` |
| 4 | 玄武 | Black Tortoise | `東方神話\|中國神話\|Black Tortoise` | `東方神話\|中國神話\|四聖獸\|Black Tortoise` |
| 5 | 中國龍 | Dragon (Chinese) | `東方神話\|中國神話\|Dragon` | `東方神話\|中國神話\|龍族\|Dragon (Chinese)` |
| 6 | 螭龍 | Chi Dragon | `東方神話\|中國神話\|Chi Dragon` | `東方神話\|中國神話\|龍族\|Chi Dragon` |
| 7 | 蛟 | Jiao Dragon | `東方神話\|中國神話\|Jiao Dragon` | `東方神話\|中國神話\|龍族\|Jiao Dragon` |
| 8 | 龍龜 | Dragon Turtle | `東方神話\|中國神話\|Dragon Turtle` | `東方神話\|中國神話\|龍族\|Dragon Turtle` |
| 9 | 麒麟 | Qilin | `東方神話\|中國神話\|Qilin` | `東方神話\|中國神話\|瑞獸\|Qilin` |
| 10 | 貔貅 | Pixiu | `東方神話\|中國神話\|Pixiu` | `東方神話\|中國神話\|瑞獸\|Pixiu` |
| 11 | 白澤 | Bai Ze | `東方神話\|中國神話\|Bai Ze` | `東方神話\|中國神話\|瑞獸\|Bai Ze` |
| 12 | 鳳凰 | Phoenix (Fenghuang) | `東方神話\|中國神話\|Phoenix` | `東方神話\|中國神話\|瑞獸\|Phoenix (Fenghuang)` |
| 13 | 饕餮 | Taotie | `東方神話\|中國神話\|Taotie` | `東方神話\|中國神話\|凶獸\|Taotie` |
| 14 | 窮奇 | Qiongqi | `東方神話\|中國神話\|Qiongqi` | `東方神話\|中國神話\|凶獸\|Qiongqi` |
| 15 | 混沌 | Hundun | `東方神話\|中國神話\|Hundun` | `東方神話\|中國神話\|凶獸\|Hundun` |
| 16 | 檮杌 | Taowu | `東方神話\|中國神話\|Taowu` | `東方神話\|中國神話\|凶獸\|Taowu` |
| 17 | 年獸 | Nian | `東方神話\|中國神話\|Nian` | `東方神話\|中國神話\|凶獸\|Nian` |
| 18 | 九尾狐 | Nine-tailed Fox | `東方神話\|中國神話\|Nine-tailed Fox` | `東方神話\|中國神話\|妖異\|Nine-tailed Fox` |
| 19 | 殭屍 | Jiangshi | `東方神話\|中國神話\|Jiangshi` | `東方神話\|中國神話\|妖異\|Jiangshi` |
| 20 | 盤古 | Pangu | `東方神話\|中國神話\|Pangu` | `東方神話\|中國神話\|神靈\|Pangu` |
| 21 | 陸吾 | Lu Wu | `東方神話\|中國神話\|Lu Wu` | `東方神話\|中國神話\|神靈\|Lu Wu` |
| 22 | 夜叉 | Yaksha | `東方神話\|中國神話\|Yaksha` | `東方神話\|中國神話\|神靈\|Yaksha` |

---

## 三、東方神話 → 台灣民間傳說（7 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 虎爺 | Tiger Lord | `東方神話\|台灣民間傳說\|Tiger Lord` |
| 2 | 魔神仔 | Mo-sin-a | `東方神話\|台灣民間傳說\|Mo-sin-a` |
| 3 | 風獅爺 | Wind Lion Lord | `東方神話\|台灣民間傳說\|Wind Lion Lord` |
| 4 | 紅衣小女孩 | Girl in Red | `東方神話\|台灣民間傳說\|Girl in Red` |
| 5 | 水鬼 | Water Ghost | `東方神話\|台灣民間傳說\|Water Ghost` |
| 6 | 七爺八爺 | Generals Qi and Ba | `東方神話\|台灣民間傳說\|Generals Qi and Ba` |
| 7 | 鯉魚精 | Carp Spirit | `東方神話\|台灣民間傳說\|Carp Spirit` |

---

## 四、西方神話 → 希臘神話（14 種 → 4 群）

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 不死鳥 | Phoenix (Western) | `西方神話\|希臘神話\|Phoenix` | `西方神話\|希臘神話\|神獸\|Phoenix (Western)` |
| 2 | 飛馬 | Pegasus | `西方神話\|希臘神話\|Pegasus` | `西方神話\|希臘神話\|神獸\|Pegasus` |
| 3 | 地獄犬 | Cerberus | `西方神話\|希臘神話\|Cerberus` | `西方神話\|希臘神話\|神獸\|Cerberus` |
| 4 | 半人馬 | Centaur | `西方神話\|希臘神話\|Centaur` | `西方神話\|希臘神話\|複合獸\|Centaur` |
| 5 | 牛頭人 | Minotaur | `西方神話\|希臘神話\|Minotaur` | `西方神話\|希臘神話\|複合獸\|Minotaur` |
| 6 | 奇美拉 | Chimera | `西方神話\|希臘神話\|Chimera` | `西方神話\|希臘神話\|複合獸\|Chimera` |
| 7 | 鷹身女妖 | Harpy | `西方神話\|希臘神話\|Harpy` | `西方神話\|希臘神話\|複合獸\|Harpy` |
| 8 | 海妖 | Siren | `西方神話\|希臘神話\|Siren` | `西方神話\|希臘神話\|妖魔\|Siren` |
| 9 | 梅杜莎 | Medusa | `西方神話\|希臘神話\|Medusa` | `西方神話\|希臘神話\|妖魔\|Medusa` |
| 10 | 獨眼巨人 | Cyclops | `西方神話\|希臘神話\|Cyclops` | `西方神話\|希臘神話\|妖魔\|Cyclops` |
| 11 | 泰坦 | Titan | `西方神話\|希臘神話\|Titan` | `西方神話\|希臘神話\|神族\|Titan` |
| 12 | 半神 | Demigod | `西方神話\|希臘神話\|Demigod` | `西方神話\|希臘神話\|神族\|Demigod` |
| 13 | 卡戎 | Charon | `西方神話\|希臘神話\|Charon` | `西方神話\|希臘神話\|神族\|Charon` |
| 14 | 樹精 | Dryad | `西方神話\|希臘神話\|Dryad` | `西方神話\|希臘神話\|神族\|Dryad` |

---

## 五、西方神話 → 北歐神話（4 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 北歐龍 | Dragon (Norse) | `西方神話\|北歐神話\|Dragon (Norse)` |
| 2 | 矮人 | Dwarf (Norse) | `西方神話\|北歐神話\|Dwarf (Norse)` |
| 3 | 芬里爾 | Fenrir | `西方神話\|北歐神話\|Fenrir` |
| 4 | 女武神 | Valkyrie | `西方神話\|北歐神話\|Valkyrie` |

---

## 六、西方神話 → 歐洲民間傳說（15 種 → 5 群 + 西方龍特殊處理）

**特殊處理**：Dragon (Western) 西方龍的 category_path 從 `西方神話|歐洲民間傳說|Dragon` 縮為 `西方神話|歐洲民間傳說|西方龍`，成為類型節點（3 段）。已選西方龍的使用者留在此層級。

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 西方龍 | Dragon (Western) | `西方神話\|歐洲民間傳說\|Dragon` | `西方神話\|歐洲民間傳說\|西方龍` ⚠️ 變為類型節點 |
| 2 | 四足飛龍 | Dragon (Four-legged) | *(null，新增)* | `西方神話\|歐洲民間傳說\|西方龍\|Dragon (Four-legged)` |
| 3 | 雙足飛龍 | Wyvern | `西方神話\|歐洲民間傳說\|Wyvern` | `西方神話\|歐洲民間傳說\|西方龍\|Wyvern` |
| 4 | 吸血鬼 | Vampire | `西方神話\|歐洲民間傳說\|Vampire` | `西方神話\|歐洲民間傳說\|不死族\|Vampire` |
| 5 | 狼人 | Werewolf | `西方神話\|歐洲民間傳說\|Werewolf` | `西方神話\|歐洲民間傳說\|不死族\|Werewolf` |
| 6 | 死神 | Grim Reaper | `西方神話\|歐洲民間傳說\|Grim Reaper` | `西方神話\|歐洲民間傳說\|不死族\|Grim Reaper` |
| 7 | 獨角獸 | Unicorn | `西方神話\|歐洲民間傳說\|Unicorn` | `西方神話\|歐洲民間傳說\|神獸幻獸\|Unicorn` |
| 8 | 獅鷲 | Griffin | `西方神話\|歐洲民間傳說\|Griffin` | `西方神話\|歐洲民間傳說\|神獸幻獸\|Griffin` |
| 9 | 蠍尾獅 | Manticore | `西方神話\|歐洲民間傳說\|Manticore` | `西方神話\|歐洲民間傳說\|神獸幻獸\|Manticore` |
| 10 | 鹿角翼兔 | Wolpertinger | `西方神話\|歐洲民間傳說\|Wolpertinger` | `西方神話\|歐洲民間傳說\|神獸幻獸\|Wolpertinger` |
| 11 | 石像鬼 | Gargoyle | `西方神話\|歐洲民間傳說\|Gargoyle` | `西方神話\|歐洲民間傳說\|魔物\|Gargoyle` |
| 12 | 地精 | Kobold | `西方神話\|歐洲民間傳說\|Kobold` | `西方神話\|歐洲民間傳說\|魔物\|Kobold` |
| 13 | 巨魔 | Troll | `西方神話\|歐洲民間傳說\|Troll` | `西方神話\|歐洲民間傳說\|魔物\|Troll` |
| 14 | 巴風特 | Baphomet | `西方神話\|歐洲民間傳說\|Baphomet` | `西方神話\|歐洲民間傳說\|魔物\|Baphomet` |
| 15 | 所羅門魔神 | Goetic Demon | `西方神話\|歐洲民間傳說\|Goetic Demon` | `西方神話\|歐洲民間傳說\|魔物\|Goetic Demon` |
| 16 | 妖精 | Fairy | `西方神話\|歐洲民間傳說\|Fairy` | `西方神話\|歐洲民間傳說\|精靈仙族\|Fairy` |

---

## 七、西方神話 → 凱爾特神話（1 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 費伊 | Fey | `西方神話\|凱爾特神話\|Fey` |

---

## 八、西方神話 → 埃及神話（20 種 → 5 群）

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 斯芬克斯 | Sphinx (Egyptian) | `西方神話\|埃及神話\|Sphinx` | `西方神話\|埃及神話\|神獸\|Sphinx (Egyptian)` |
| 2 | 阿米特 | Ammit | `西方神話\|埃及神話\|Ammit` | `西方神話\|埃及神話\|神獸\|Ammit` |
| 3 | 羊頭斯芬克斯 | Criosphinx | `西方神話\|埃及神話\|Criosphinx` | `西方神話\|埃及神話\|神獸\|Criosphinx` |
| 4 | 鷹頭斯芬克斯 | Hieracosphinx | `西方神話\|埃及神話\|Hieracosphinx` | `西方神話\|埃及神話\|神獸\|Hieracosphinx` |
| 5 | 蛇頸豹 | Serpopard | `西方神話\|埃及神話\|Serpopard` | `西方神話\|埃及神話\|神獸\|Serpopard` |
| 6 | 賽特神獸 | Sha | `西方神話\|埃及神話\|Sha` | `西方神話\|埃及神話\|神獸\|Sha` |
| 7 | 阿佩普 | Apep | `西方神話\|埃及神話\|Apep` | `西方神話\|埃及神話\|蛇類\|Apep` |
| 8 | 烏拉尤斯聖蛇 | Uraeus | `西方神話\|埃及神話\|Uraeus` | `西方神話\|埃及神話\|蛇類\|Uraeus` |
| 9 | 有翼蛇 | Winged Serpent | `西方神話\|埃及神話\|Winged Serpent` | `西方神話\|埃及神話\|蛇類\|Winged Serpent` |
| 10 | 貝努鳥 | Bennu | `西方神話\|埃及神話\|Bennu` | `西方神話\|埃及神話\|鳥類\|Bennu` |
| 11 | 巴鳥 | Ba Bird | `西方神話\|埃及神話\|Ba Bird` | `西方神話\|埃及神話\|鳥類\|Ba Bird` |
| 12 | 阿努比斯 | Anubis | `西方神話\|埃及神話\|Anubis` | `西方神話\|埃及神話\|神靈\|Anubis` |
| 13 | 巴斯特聖貓 | Bastet Cat | `西方神話\|埃及神話\|Bastet Cat` | `西方神話\|埃及神話\|神靈\|Bastet Cat` |
| 14 | 荷魯斯之鷹 | Horus Falcon | `西方神話\|埃及神話\|Horus Falcon` | `西方神話\|埃及神話\|神靈\|Horus Falcon` |
| 15 | 托特聖䴉 | Thoth Ibis | `西方神話\|埃及神話\|Thoth Ibis` | `西方神話\|埃及神話\|神靈\|Thoth Ibis` |
| 16 | 索貝克聖鱷 | Sobek Crocodile | `西方神話\|埃及神話\|Sobek Crocodile` | `西方神話\|埃及神話\|神靈\|Sobek Crocodile` |
| 17 | 塞赫邁特獅 | Sekhmet Lioness | `西方神話\|埃及神話\|Sekhmet Lioness` | `西方神話\|埃及神話\|神靈\|Sekhmet Lioness` |
| 18 | 木乃伊 | Mummy (Egyptian) | `西方神話\|埃及神話\|Mummy` | `西方神話\|埃及神話\|亡靈\|Mummy (Egyptian)` |
| 19 | 聖甲蟲 | Sacred Scarab | `西方神話\|埃及神話\|Sacred Scarab` | `西方神話\|埃及神話\|神獸\|Sacred Scarab` |
| 20 | 梅傑德 | Medjed | `西方神話\|埃及神話\|Medjed` | `西方神話\|埃及神話\|神靈\|Medjed` |

---

## 九、奇幻文學 → 通用（19 種 → 20 種，6 群，含 2 筆新增）

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 惡魔 | Demon (Fantasy) | `奇幻文學\|通用\|Demon` | `奇幻文學\|通用\|魔族\|Demon (Fantasy)` |
| 2 | 魅魔 | Succubus | `奇幻文學\|通用\|Succubus` | `奇幻文學\|通用\|魔族\|Succubus` |
| 3 | 夢魔 | Incubus | `奇幻文學\|通用\|Incubus` | `奇幻文學\|通用\|魔族\|Incubus` |
| 4 | 魔王 | Demon Lord | `奇幻文學\|通用\|Demon Lord` | `奇幻文學\|通用\|魔族\|Demon Lord` |
| 5 | 精靈 | Elf (Fantasy) | `奇幻文學\|通用\|Elf` | `奇幻文學\|通用\|精靈族\|Elf (Fantasy)` |
| 6 | 光精靈 | Light Elf | `奇幻文學\|通用\|Light Elf` | `奇幻文學\|通用\|精靈族\|Light Elf` |
| 7 | 暗精靈 | Dark Elf | `奇幻文學\|通用\|Dark Elf` | `奇幻文學\|通用\|精靈族\|Dark Elf` |
| 8 | 半精靈 | Half-elven | `奇幻文學\|通用\|Half-elven` | `奇幻文學\|通用\|精靈族\|Half-elven` |
| 9 | 巫妖 | Lich | `奇幻文學\|通用\|Lich` | `奇幻文學\|通用\|不死族\|Lich` |
| 10 | 骷髏人 | Skeleton | `奇幻文學\|通用\|Skeleton` | `奇幻文學\|通用\|不死族\|Skeleton` |
| 11 | 天使 | Angel | `奇幻文學\|通用\|Angel` | `奇幻文學\|通用\|天界\|Angel` |
| 12 | 墮天使 | Fallen Angel | *(null，新增)* | `奇幻文學\|通用\|天界\|Fallen Angel` |
| 13 | 哥布林 | Goblin | `奇幻文學\|通用\|Goblin` | `奇幻文學\|通用\|亞人種\|Goblin` |
| 14 | 半獸人 | Orc | `奇幻文學\|通用\|Orc` | `奇幻文學\|通用\|亞人種\|Orc` |
| 15 | 人魚 | Mermaid | `奇幻文學\|通用\|Mermaid` | `奇幻文學\|通用\|亞人種\|Mermaid` |
| 16 | 史萊姆 | Slime | `奇幻文學\|通用\|Slime` | `奇幻文學\|通用\|魔法生物\|Slime` |
| 17 | 魔像 | Golem | `奇幻文學\|通用\|Golem` | `奇幻文學\|通用\|魔法生物\|Golem` |
| 18 | 寶箱怪 | Mimic | `奇幻文學\|通用\|Mimic` | `奇幻文學\|通用\|魔法生物\|Mimic` |
| 19 | 曼德拉草 | Mandrake | `奇幻文學\|通用\|Mandrake` | `奇幻文學\|通用\|魔法生物\|Mandrake` |
| 20 | 樹人 | Ent | `奇幻文學\|通用\|Ent` | `奇幻文學\|通用\|魔法生物\|Ent` |

---

## 十、現代虛構 → 克蘇魯神話（8 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 外神 | Outer God | `現代虛構\|克蘇魯神話\|Outer God` |
| 2 | 深潛者 | Deep One | `現代虛構\|克蘇魯神話\|Deep One` |
| 3 | 修格斯 | Shoggoth | `現代虛構\|克蘇魯神話\|Shoggoth` |
| 4 | 米戈 | Mi-go | `現代虛構\|克蘇魯神話\|Mi-go` |
| 5 | 古老者 | Elder Thing | `現代虛構\|克蘇魯神話\|Elder Thing` |
| 6 | 食屍鬼 | Ghoul (Lovecraftian) | `現代虛構\|克蘇魯神話\|Ghoul (Lovecraftian)` |
| 7 | 星之眷族 | Star-spawn | `現代虛構\|克蘇魯神話\|Star-spawn` |

**注意**：Outer God 在 batch1 migration 中新增，其餘 6 種在 expansion seed 中。

---

## 十一、現代虛構 → 都市傳說（7 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 天蛾人 | Mothman | `現代虛構\|都市傳說\|Mothman` |
| 2 | 卓柏卡布拉 | Chupacabra | `現代虛構\|都市傳說\|Chupacabra` |
| 3 | 影人 | Shadow People | `現代虛構\|都市傳說\|Shadow People` |
| 4 | 未確認生物 | Cryptid | `現代虛構\|都市傳說\|Cryptid` |
| 5 | 鹿角兔 | Jackalope | `現代虛構\|都市傳說\|Jackalope` |
| 6 | 飛棍 | Skyfish | `現代虛構\|都市傳說\|Skyfish` |
| 7 | 尼斯湖水怪 | Loch Ness Monster | `現代虛構\|都市傳說\|Loch Ness Monster` |

---

## 十二、現代虛構 → 科幻（2 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 外星人 | Alien | `現代虛構\|科幻\|Alien` |
| 2 | 外星生物 | Alien Creature | `現代虛構\|科幻\|Alien Creature` |

---

## 十三、非物質生命 → 能量態生命（12 種 → 3 群）

| # | 物種 | name | 舊 category_path | 新 category_path |
|---|------|------|-------------------|-------------------|
| 1 | 元素精靈 | Elemental Spirit | `非物質生命\|能量態生命\|Elemental Spirit` | `非物質生命\|能量態生命\|元素精靈\|Elemental Spirit` |
| 2 | 火元素精靈 | Fire Elemental | `非物質生命\|能量態生命\|Fire Elemental` | `非物質生命\|能量態生命\|元素精靈\|Fire Elemental` |
| 3 | 水元素精靈 | Water Elemental | `非物質生命\|能量態生命\|Water Elemental` | `非物質生命\|能量態生命\|元素精靈\|Water Elemental` |
| 4 | 風元素精靈 | Wind Elemental | `非物質生命\|能量態生命\|Wind Elemental` | `非物質生命\|能量態生命\|元素精靈\|Wind Elemental` |
| 5 | 土元素精靈 | Earth Elemental | `非物質生命\|能量態生命\|Earth Elemental` | `非物質生命\|能量態生命\|元素精靈\|Earth Elemental` |
| 6 | 雷電生命 | Lightning Being | `非物質生命\|能量態生命\|Lightning Being` | `非物質生命\|能量態生命\|能量存在\|Lightning Being` |
| 7 | 光靈 | Light Spirit | `非物質生命\|能量態生命\|Light Spirit` | `非物質生命\|能量態生命\|能量存在\|Light Spirit` |
| 8 | 暗影元素 | Shadow Elemental | `非物質生命\|能量態生命\|Shadow Elemental` | `非物質生命\|能量態生命\|能量存在\|Shadow Elemental` |
| 9 | 鬼火 | Will-o-the-Wisp | `非物質生命\|能量態生命\|Will-o-the-Wisp` | `非物質生命\|能量態生命\|能量存在\|Will-o-the-Wisp` |
| 10 | 星靈 | Star Spirit | `非物質生命\|能量態生命\|Star Spirit` | `非物質生命\|能量態生命\|能量存在\|Star Spirit` |
| 11 | 植物精靈 | Plant Spirit | `非物質生命\|能量態生命\|Plant Spirit` | `非物質生命\|能量態生命\|自然精靈\|Plant Spirit` |
| 12 | 時間精靈 | Chrono Spirit | `非物質生命\|能量態生命\|Chrono Spirit` | `非物質生命\|能量態生命\|自然精靈\|Chrono Spirit` |

---

## 十四、非物質生命 → 意識態生命（7 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 幽靈 | Ghost | `非物質生命\|意識態生命\|Ghost` |
| 2 | 騷靈 | Poltergeist | `非物質生命\|意識態生命\|Poltergeist` |
| 3 | 怨靈 | Wraith | `非物質生命\|意識態生命\|Wraith` |
| 4 | 夢境生物 | Dream Entity | `非物質生命\|意識態生命\|Dream Entity` |
| 5 | 集體意識體 | Collective Consciousness | `非物質生命\|意識態生命\|Collective Consciousness` |
| 6 | 夢魘 | Nightmare | `非物質生命\|意識態生命\|Nightmare` |
| 7 | 思念體 | Thought Form | `非物質生命\|意識態生命\|Thought Form` |

---

## 十五、非物質生命 → 資訊態生命（2 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 人工智慧 | AI | `非物質生命\|資訊態生命\|AI` |
| 2 | 電腦病毒 | Computer Virus | `非物質生命\|資訊態生命\|Computer Virus` |

---

## 十六、人造生命 → 機械生命（7 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 機器人 | Robot | `人造生命\|機械生命\|Robot` |
| 2 | 仿生人 | Android | `人造生命\|機械生命\|Android` |
| 3 | 改造人 | Cyborg | `人造生命\|機械生命\|Cyborg` |
| 4 | 自動機械 | Automaton | `人造生命\|機械生命\|Automaton` |
| 5 | 人偶 | Doll | `人造生命\|機械生命\|Doll` |
| 6 | 泰迪熊 | Teddy Bear | `人造生命\|機械生命\|Teddy Bear` |
| 7 | 機械鳥 | Mechanical Bird | `人造生命\|機械生命\|Mechanical Bird` |

---

## 十七、人造生命 → 生物合成（3 種，維持 3 段不變）

| # | 物種 | name | category_path（不變） |
|---|------|------|------------------------|
| 1 | 人造人 | Homunculus | `人造生命\|生物合成\|Homunculus` |
| 2 | 複製人 | Clone | `人造生命\|生物合成\|Clone` |
| 3 | 人造嵌合體 | Chimera (Artificial) | `人造生命\|生物合成\|Chimera (Artificial)` |

---

## 統計總覽

| 項目 | 數量 |
|------|------|
| 現有物種總數 | 118 種 |
| 需更新 category_path | 97 種 |
| 維持 3 段不變 | 57 種 |
| 新增物種 | 2 種（四足飛龍 Dragon (Four-legged)、墮天使 Fallen Angel） |
| 特殊處理 | 1 種（西方龍 Dragon (Western) → 類型節點，path 縮為 3 段） |
| 重整後物種總數 | 120 種 |

## 需要的程式修改

1. **DB Migration**：更新 97 筆 category_path + 新增 2 筆 + 西方龍特殊處理（public + staging）
2. **前端 `buildFictionalTree`**：i=2 的 nameZh 改為使用 segment 文字本身（中文類型名）
3. **Seed 檔案**：更新 4 個 seed SQL 以反映新路徑
