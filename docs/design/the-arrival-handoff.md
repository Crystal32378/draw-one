# Draw One｜The Arrival Handoff Note

**日期：** 2026-08-21　**作者：** 飛寶（Claude Fable 5）
**用途：** 新的 Fable context 直接接手 V2B Round 3（Architectural Silhouette Pass）。
**狀態：** mechanics 修正完畢，**Awaiting final Space / Interaction Gate revalidation（福）**。不要假設已 PASS。

---

## A. Repository / branch state

- **Repo：** `Crystal32378/draw-one`（本機 clone `/tmp/draw-one`——注意 /tmp 可能被清，接手先 `git clone` 或確認 clone 存在）
- **Branch：** `fable/v2b-the-arrival`，**latest commit `06ba1a9`**（已 push）
- Working tree clean，無 untracked。**未 merge、未 deploy、未開 PR**（PR 號 #23 已被蝦蝦的關帝解讀層佔用；The Arrival 開 PR 時將是 #24+）
- 主要檔案：`paper/arrival.html`（埕＋殿＋抽籤流程，單檔）、`scripts/test-arrival.mjs`（27 checks）
- main 上已 merge：#20 Production Truth（60/60）、#21 corpus 修復、#22 The Slip freeze（14/14）
- 蝦蝦分支 `autoclaw/guandi-interpretation-layer`（PR #23，關帝解曰＋聖意 200 筆 historical/PROBABLE/verbatim，未 merge）

## B. Current product state（interaction contract 全文）

- **埕是基本空間單位。** App 開啟：初訪見山門（三行規矩：一事一籤不重問／紙上只有考證過的文本／諸神同尊殿序依沿革）→ 入內落在埕；之後每次 boot **一律落在埕、面向中軸空段（void）**。
- **中軸空段（void station）**＝連續遠側牆上的刻字（日期・節氣）＋「本廟沿革」碑（點開：本廟無主祀，諸神同尊；殿序依落成——三殿 2026-08-18 同期落成）。
- **轉身**：水平拖動＝轉頭，籤枝跟手、鬆手軟性 settle 到最近站（有慣性半站）；無 dots/箭頭/頁碼。有限弧（端點 rubber band），非無限輪播。
- **站列（左→右）**：`[月老(僅?halls=4)] [天上聖母] [void] [觀世音] [關帝]`。左右交替＝**Draw One 自己的 geometry hypothesis**（code 註解明示，非文化依據；「昭穆」一詞已依 Crystal 指示棄用）。
- **側殿兩段式**：點非正對的殿＝只轉正（提示「正對　○○殿——點門內，進殿」）；再點＝進殿。左右完全對稱。
- **進殿**：門洞放大轉場（400ms，reduced-motion 立即）。殿內＝聖號大牌位（觀世音／天上聖母／關帝，provenance 已確認）＋副標（籤系・宮廟：觀世音靈籤・艋舺龍山寺／六十甲子籤・北港朝天宮／護國嘉濟江東王靈籤・道藏本）＋所問之事回顯＋籤筒。
- **抽**：按住籤枝往上拖（動作門檻 130px，非時間門檻；中途一次輕 haptic；`?devdraw=1` 單擊快抽）→ 籤枝顯籤號 → 點「取籤詩」→ The Slip（frozen 元件）＋筆記欄 → 「收進籤簿・回埕」。
- **一事一籤**：同一問題（normalize 後 verbatim 比對）永遠回同一張籤，跨殿不可重抽；埕的案上會浮現「這個問題已有一支籤——案上放著，點看」。空問題綁 browser session。
- **記憶**：籤簿（drawone.book.v1：日期/問題/籤/筆記，可重開）＋上次到訪（LASTHALL_KEY，只作牌匾旁的路標事實）＋session 內回埕保留朝向。**reload 一律回 void。**
- **`?halls=4`**：月老站＝虛線放樣＋「增建中」；進入見「本殿尚未落成」，無籤筒、無任何 draw 路徑（corpusId null＋renderHall 前置 guard）。
- **視覺層**（parallax）：遠 0.35x（天光/遠簷影）／中 1x（連續牆＋殿量體：出簷、簷下影、凸出殿身側影、門洞、台階落地）／地 0.9x（鋪面縫；正對殿時淡引路浮現）／近 1.55x（柱，settle 時在畫框外、轉身時掃過）。

## C. Frozen contracts（福 PASS 後不得隨意動）

1. **App boot / reload → void。** 朝向只活在 session 記憶體（`sessionFacing`），永不持久化。
2. **無主位／諸神同尊**：中軸不供任何一位；三殿正對時 scale/光/anatomy/interaction 完全相等（透視非位階）。
3. **側殿兩段式**（先轉正、再進殿）；系統永不替使用者走最後幾步（含：不自動落在任何殿前）。
4. **一事一籤**＋`peekBinding` 唯讀契約（不建立/不改變/不消耗 binding；peek 後正式流程回原籤——「乙丑 lock」）。
5. **`?halls=4` fail-closed**：無 corpus 的殿無任何 draw 路徑。
6. **空間公共、記憶私人**：殿不因使用者行為變前/變大/變亮；無常拜殿標籤、無問題→神明 routing、無推薦。
7. **The Slip 已 freeze**（#22）：紙的一切不動；truth 三分類（歷史詩文 verbatim／provenance 導出／「抽一」產品印記限版記欄）。
8. Production Truth 已封箱（#20）：fail-closed build gate、encoding gate、260 首、collision-safe policy。

## D. Test / Gate state（2026-08-21 實測）

| Suite | 結果 |
|---|---|
| Production Truth（test-draw-pool.mjs） | 60/60 ✓ |
| The Slip（test-slip-render.mjs，含 260/260 registry 排版） | 14/14 ✓ |
| The Arrival（test-arrival.mjs，新增） | 27/27 ✓ |
| Manual：fresh→void；觀世音/天上聖母 進殿→reload→void；左右+右外側兩段式對稱；月老 fail-closed | 全過 ✓ |
| Console | 表現層無錯誤跡象；工具無法直讀 console（已如實標注）。桌面驗證於 ~500px 視窗；390×844 真機由 Crystal 手機驗 |
| **福 Space / Interaction Gate** | **Awaiting final revalidation**（上輪 verdict：FIX REQUIRED→已修） |

CI 注意：workflow 目前只跑 truth suite；slip/arrival suites 未接 CI（改 workflow 需動已封箱檔案，留待自然開箱時機）。

## E. Known history that matters

- **為何 facing 不能持久化**：曾實作「回到上次那間殿」→ Crystal 裁定 reload 正對某殿＝隱性預設神明，違反無主位。記得到訪（事實）≠ 替人定義信仰（詮釋）。
- **為何 void 是治理要求**：中軸留空是「神無尊卑」的空間化——不是美學選擇。任何 visual pass 不得把 void 變成誰的前廳。
- **為何殿不是 provider cards**：provider 感來自「同時並列可比較」；解法＝步行相遇（一次正對一殿）＋牌匾只有聖號（無描述/評分/CTA）。任何新視覺不得把三殿放回同一視野等人挑。
- **為何一事一籤不能被 visual pass 破壞**：它是傳統自帶的 anti-dependence 機制；重抽/換殿重問的入口一旦出現即違約。
- **已解過的 bug，勿重新引入**：①埕隱藏時 `clientWidth=0` 導致柱位錯算（fallback＋show 後補一幀）；②`setPointerCapture` 劫走 pointerup target（改在 pointerdown 抓 `downTarget`）；③瀏覽器 click 自動捲動 overflow:hidden 容器（每幀歸零 scrollLeft）；④draw-policy 的 djb2 只作 bucket、identity 逐字比對（collision）；⑤`in` 運算子吃原型鍵（用 `Object.hasOwn`）；⑥corpus HTML entities／U+FFFD mojibake（build gate 永久攔截）。
- **蝦蝦解讀層進度**：關帝 200 筆已成（PR #23 待福驗）；**觀音解讀層要多花時間——兩個版本文字差異大且亂序**，整理中。解讀層上紙的前提：過 corpus provenance、取得自身 status（freeze doc 規定）。

## F. Next phase｜V2B Round 3 — Architectural Silhouette Pass

唯一主題：**用廟的骨，不用廟的妝。**

不是在盒子上加龍鳳/燈籠/煙/剪黏/民俗 ornament，而是讓建築本體有台灣漢式宮廟的 structural DNA：起翹屋脊、出簷厚度、柱列與開間節奏、台基/階、門面前後退縮、側立面/屋身 profile。

核心判準：**不是把現在的盒子裝飾成廟，而是讓盒子本身不再是盒子。**

範圍限制：只動 silhouette/量體；mechanics（C 節全部）與 The Slip 不動；改動後三殿必須仍然全等（R4 regression 會抓）。

## G. Architectural reference

**王保原廟宇建築圖**（覺風佛教藝術文化基金會收藏/研究）：正立面、側立面、剖面、平面；前殿/中亭（太子亭）/後殿；屋頂、柱列、斗拱、堵面、台基。已見圖例：台南新營真武殿前殿・太子亭・後殿側面圖；佳里幽冥壇設計圖（正面圖/側面圖/剖面）；九龍楣和堵面圖；部口大方堵及排樓正面圖。（圖檔在 mirasim 附件暫存路徑，新 context 請向 Crystal 重新要圖。）

**學術限制（必須保留）**：這是王保原工班、南台灣、1960–70 年代特定案例的實證 reference，**不得宣稱代表所有台灣宮廟**。可學的是骨（屋脊曲線、出簷比例、開間節奏、台基層次），不是抄它的妝。

## H. Experience thesis（下一輪所有視覺決策的上位判準）

美術館是：**東西被帶到你面前，供你觀看。**
廟是：**你走到它面前，並參與其中。**

Draw One 不是「這裡有三個神，你選一個」，而是：
**你已經站在一個地方 → 辨方向 → 轉身 → 正對 → 靠近 → 進殿 → 問 → 抽。**

最終使用者應記得的是「**我剛剛走進去問了一件事**」，不是「我看了一個漂亮的廟 UI」。

---

## 接手 checklist（新 context 第一步）

1. 確認 clone 存在、checkout `fable/v2b-the-arrival` @ `06ba1a9`
2. 跑三套 suite（60/60、14/14、27/27）確認環境
3. 確認福的窄版 Space / Interaction Gate 結果——PASS 才動 Round 3
4. 向 Crystal 要王保原圖檔
5. Round 3 開工前重讀本文件 C、E、F、H
