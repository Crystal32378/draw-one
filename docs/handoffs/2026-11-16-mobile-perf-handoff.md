# Draw One 手機／LINE 效能調整 — 交接（2026-11-16，Opus）

分支：`opus/mobile-perf-1116`（從 production `a98991a` 開出；第一個 commit 是 Murphy 候選版 `ca4b5c7` 的兩個檔案）。
**未合併 main、未部署正式站。** 預覽請 Murphy 部署（這邊的 Vercel 權限不能開新專案）。

## 找到的原因

卡頓主要不是 JS，是「每一幀重畫水墨濾鏡」：

- 殿面、樹、地面的筆觸用 SVG `feTurbulence` + `feDisplacementMap`（`#ink-edge` `#ink-rough` `#ink-wash` `#ink-line`）。
- 同一個 SVG 裡只要有東西在動（燈籠搖、爐火明暗、樹擺），或整個場景在縮放（進殿 scale 1.5），瀏覽器就把整塊濾鏡重算一次。
- iPhone／LINE 內建瀏覽器（WebKit）在主執行緒做這件事，所以轉身、進殿特別卡；Chrome 桌機會分到背景執行緒＋快取，桌機量不出來。
- 次要：拖曳時每幀讀 `clientWidth`／`scrollLeft`（強迫重排）、每幀重寫沒變的 style。

## 改了什麼（美術沒有刪）

1. **水墨「定稿」（INK_BAKE）**：進埕後，用同一個濾鏡、同樣解析度把每個筆觸先畫一次成圖片，之後動畫只是移動圖片，不再重算濾鏡。
   - 畫風一致：與即時濾鏡逐像素比對，平均差 0.14／255，只有 0.5% 像素（筆觸邊緣）有差；乾筆飛白保留。
   - 三殿共用同一張（同模板），總量約 6.7MP（解碼後約 27MB）。
   - 一次烘一張、張與張之間讓出主執行緒，首次進埕時的轉身／點門不會被卡住。
   - 任何一張失敗就留原本的即時濾鏡。麻雀（有翅膀動畫）維持即時。
   - 關閉方式：網址加 `?inkbake=0`。**只關烘圖**，其他效能調整（拖曳瘦身、will-change 等）仍在，不等於正式版。
   - 保護（第二輪補上）：
     - 快取總上限 12MP（約 48MB 解碼）；到上限的筆觸留即時濾鏡。
     - 清理：畫面已不再引用的圖會 revoke 並移出快取；轉螢幕／改尺寸不會越積越多（實測 6 次切換：6.7→1.5→6.8→7.9→6.8→1.5→6.8MP）。
     - 逾時：單張 SVG→canvas→PNG 超過 5 秒即放棄；連續失敗 3 次或逾時 2 次，本次造訪停止烘圖，全留即時濾鏡。
     - 使用者正在按、拖、點時不烘：最後一次輸入後靜 700ms、瀏覽器空閒才烘下一張。
   - 同一份程式，手機與桌機走同一條路，不是兩個版本。
2. **拖曳每幀瘦身**：尺寸改為事件時量一次並快取；位置／透明度只在有變時才寫；不在畫面內的殿和樹暫停燈籠／爐火／樹擺動畫（`.far`）。
3. **進殿縮放**：只在縮放那 0.x 秒對 court 加 `will-change`，結束即移除。
4. Murphy 候選版的內容全部保留（pointermove 合併到 rAF、resize debounce、`numOctaves=1`、遠樹 blur 移除）。

沒採用的牛牛方向：「手機拿掉 SVG 筆觸濾鏡」「blur 降級」— 這兩項等於刪美術，未獲同意，改用定稿達到同樣效果。「手機聲音預設關」— 與 #40 鳥聲特赦衝突，未做。

## 數字（Chromium、390×844、DPR 3、CPU 降速 6 倍，量「畫／點陣化」時間）

| | 靜置 3 秒 | 拖曳轉身 | 進殿 |
|---|---|---|---|
| production a98991a | 174ms | 1738ms | 1481ms |
| 這個分支 | 0ms | 約 1050–1105ms | 約 240–526ms |

拖曳的腳本時間 2700 → 約 1270ms；主執行緒已無 >40ms 的長任務。剩下的掉幀是沙盒沒有 GPU、合成走軟體造成，不代表手機。

## #40–44

- #40 鳥聲：維持特赦，未動。
- #41 麻雀：Murphy 版已完成（三隻不同節奏、經過會飛、落定、reduced-motion），e2e 通過。
- #42 匾額：抽枝時匾完整、讀詩時匾收起且頂列顯示聖號 — 通過。
  剛進殿自動捲到籤筒時匾會被頂列蓋住一截：Crystal 選 (b)，頂列名牌出現時下緣拉長成淡墨漸層（-38px），切口不再是硬邊。
- #43 收進籤簿：601／700／844 高度、含再進殿路徑，按鈕都在首屏內可點 — 通過（之前探針「在摺線下」是量太早）。
- #44 空白問題：設計如此 — 沒寫問題也是合法的「一事一籤」綁定鍵；回埕再進同殿看到同一支、不重抽、不重複入簿。已加 e2e 檢查。

## 測試

- test-ink-bake 26/26（新）：定稿成功、只剩麻雀即時、`?inkbake=0`、canvas 卡住逾時回退、回空值回退、連續失敗停烘、轉螢幕 6 輪快取上限與清理
- test-arrival-ink-e2e 237–238（依轉身次數，全過；含新的 #44）
- test-arrival 52/52、test-sound 68/68、test-court-performance PASS
- test-interpretation-e2e 45/45、test-draw-pool 60/60、test-slip-render 14/14、test-interpretation-pool 85/85
- test-shengyi-pool、test-review-root-routes、test-corpus-review、test-public-corpus-review、test-liushijiazi-book-compat、test-guandi-poem-corrections、test-liushijiazi-poem-repair：PASS
- test-sound-e2e 49/51：兩項失敗在 production a98991a 上一樣失敗（file:// 載 Google 字型被 CORS 擋，沙盒環境問題），不是這次造成。
  先前偶發「剛進埕就快點門、只轉身沒開門」（約 1/4）；改成操作中不烘之後連跑 5 次都與正式版相同。

## 手機／LINE 待驗證（這邊做不到）

1. 真 iPhone + LINE 內建瀏覽器：轉身、進殿是否明顯順。
2. Android（Chrome 與 LINE）。
3. 首次進埕的烘圖時間：慢手機上 58 張烘完要多久、期間是否感覺頓。
4. 記憶體：約 27MB 圖片，舊 iPhone 會不會被 LINE 回收頁面。
5. WebKit 對 `<image>` 疊在 SVG 裡的縮放清晰度（DPR 3 應該夠）。
6. 對照：同一支手機開 `?inkbake=0`，可直接比較前後。
