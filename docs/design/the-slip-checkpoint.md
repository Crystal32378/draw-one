# The Slip — V2A Design Checkpoint（freeze 文件）

**Status:** PR #22 review 中 → merge 後 FROZEN
**North star:** 一張真的會有人拿在手上的籤。不是東方風 card，不是 museum/editorial object。
**Freeze 規則:** 本檢查點 merge 後，非 functional issue 不再改動籤紙本體。

## 元件

| 檔案 | 內容 |
|---|---|
| `assets/slip.css` | 籤紙全部樣式（design tokens、版框、欄、簽條、版記、印、settle 動畫） |
| `assets/slip-render.js` | 渲染器：`mountSlip(container, entry)`；斷句、簽條文字、版的瑕疵、版記/印 |
| `paper/slip-specimen.html` | 檢查點頁：固定六張真籤（每套 corpus 兩張），可重現、可 review |

## 紙的解剖（右 → 左）

1. **簽條（slip-tab）** — 突出紙上緣的實體簽。六十甲子＝干支（甲子）；觀音/關帝＝中文數字（第三十九籤）。承北港頂籤形制，取其位不取其形。
2. **題名欄（s-title）** — 籤本名（北港朝天宮六十甲子籤…），欄間細直線分隔。
3. **詩文欄（s-poem）** — 每句一欄、字起於頂、40px 實物比例——詩是紙的主體。斷句支援 `\n`、`／`、半形/全形空格、道藏本句讀（保留標點），連寫規則詩句等分 fallback。
4. **版記欄（s-colo）** — 貼左緣，落款欄式兩行：「據○○本」＋「抽一謹錄　已對勘/待複核」。狀態翻譯誠實：VERIFIED＝已對勘、PROBABLE＝待複核，永不升級。
5. **印（slip-seal）** — 朱文印「抽一」，微轉 2.1°、multiply、墨色不均（漏白斑）。

## 活的印刷（不是 antique 濾鏡）

- **「版」的概念**：以籤 id 為種子的 deterministic 瑕疵——字位微顫（±0.55px）、字重（620±55）、墨色濃淡。同一支籤永遠印出同一套，像同一塊版。
- 雙線版框過 turbulence 濾鏡（`#slip-rough`）；一道硃砂**套印殘影**（偏移 0.7px、14% opacity）。
- 紙面極輕煙燻斑漬（multiply、4–7%），是時間摩擦力，不是泛黃。

## Truth rules（與 production truth layer 的契約）

紙上的文字分三類，各有明確的來源與保證，不得混同：

1. **歷史詩文（逐字保證）** — 詩文欄逐字取自 `DRAW_POOL` entry 的 `historical_text.poem_text`，
   不增刪一字（斷句是排版，不是改寫）。簽條的干支直接取 `original_slip_label`；
   「第○籤」為 `slip_number` 的中文數字導出形式。
2. **來源與狀態（provenance 導出，程式保證）** — 版記首行「據○○本」與狀態詞為固定的
   產品措辭，與 pool 的 `provenance` 一一對應。此對應由 `slip-render.js` 的
   **colophon registry 強制執行**：registry 記錄每套 corpus 的預期 `edition_title`，
   entry 的 provenance 與 registry 不吻合（或 corpus 未知、status 不在誠實詞彙表內）
   即拒絕排版（fail-closed）——上游換版本時，渲染會停住，直到 registry 被有意識地更新。
   狀態翻譯誠實且不可升級：VERIFIED＝已對勘、PROBABLE＝待複核。
3. **產品印記（明示品牌）** — 「抽一謹錄」落款與「抽一」朱印是 Draw One 的印記，
   不是歷史文本——如同實物籤紙上的刊印者落款。印記永遠只出現在版記欄，不進詩文欄。

其餘規則：

- 上述三類以外的產品文案永遠不穿紙的形式（不上紙）。
- 歷史形式只配**經來源治理的歷史文本**——即通過 production gate 的 corpus 條目
  （VERIFIED 與 PROBABLE 皆屬之，狀態在版記誠實標示）。未來的歷史解/聖意屬新增文本層，
  須先過 corpus provenance（蝦蝦研究線）取得自己的 status，才有資格上紙。
- 吉凶一視同仁：所有籤共用同一塊「版」的語言，不對吉籤/凶籤給不同視覺獎勵。

## Typography（已定案，隨本檢查點 freeze）

**Noto Serif TC ＝ The Slip 的 production typeface。V2A 不做老明體 webfont A/B。**
骨架是現代的、乾淨的；人間味由印刷系統承擔（字位微顫、字重、墨色、版框、固定 seed）——
「乾淨的字模＋不完美的印刷」，這是實物籤紙質感的真實來源；用字型模仿年代感反而低一級。
好處：中文可讀性、跨裝置可靠、零外部 webfont dependency。
除非遇到缺字、字形錯誤或可讀性問題，不再開這題。（Crystal ratified, 2026-08-19）

## 明確不在 #22 scope

首頁/入口、deity selection/presentation、問問題流程、歷史解/解籤、corpus 與 production truth 邏輯（各屬 #23 The Arrival 與蝦蝦研究線）。
