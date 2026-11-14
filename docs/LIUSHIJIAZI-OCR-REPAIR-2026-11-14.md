# 六十甲子籤 #10／#28 OCR 詩文修復

日期：2026-11-14 Asia/Taipei。獨立分支 `fix/liushijiazi-010-028-ocr`，基底 GitHub origin/main `7ae87f6e45526a7dc8ef6f47c24c16d50a444a8d`。只做本機修復與測試，沒有部署、合併 main 或清除使用者資料。本次不是全量逐字核對，不能斷言只有兩支有錯。

## 逐句核圖與來源版本

直接下載並以影像檢視工具讀取北港朝天宮兩張官方原圖，依右上詩文直書由右至左逐句核對；圖下頁碼分別 10／28，干支乙未／戊午。保留原圖字形「爾」「陽」，不拿其他 carrier 的「汝」「洋」替換。

| 籤 | 第一句 | 第二句 | 第三句 | 第四句 |
|---|---|---|---|---|
| 10 乙未 | 花開結子一半枯 | 可惜今年爾虛度 | 漸漸日落西山去 | 勸君不用向前途 |
| 28 戊午 | 於今莫作此當時 | 虎落平陽被犬欺 | 世間凡事何難定 | 千山萬水也遲疑 |

- [北港官方第 10 圖](https://www.matsu.org.tw/upload_files/web/uploadfile/2024080515/original/240805152108670080.jpg)：SHA-256 `000fc7f956b242f456b68bd220c8e3c646cd3544d7d5b80e64d877555e28acfc`。
- [北港官方第 28 圖](https://www.matsu.org.tw/upload_files/web/uploadfile/2024080515/original/240805152118799412.jpg)：SHA-256 `65f2c11da401006caea1168cb987e85ccaf94d23c4ba41abe8657eaf977f0a0f`。

兩張的本次下載 SHA-256 均等於 Study 03 concrete_item 在 2026-08-15 的存檔 checksum，URL 同屬 2024-08-05 批次；這次是同一數位影像版本修復，不是換版本。核圖者是 agent，不冒稱 Crystal／人類逐字確認，不升級既有研究、授權或確認狀態。

## 錯誤與生成鏈

兩筆北港 `att-bg-010`／`att-bg-028` 的 source_text 分別以「右上角籤首資料」「右上籤號與卦象」開頭，接著是原詩前三句，漏掉第四句。不是原詩第一句遺失。

確定的傳播鏈：Study 03 `data/attestation.jsonl` → `build_corpus_package.py` → `attestations.json`／`slips.json` → 身分轉錄 JSON／CSV／review XLSX → `build-draw-pool.mjs` → 公開頁用的 `assets/oracles.draw-pool.js`。`build_liushijiazi_layer.py` 也把 reference_text 複製到 `source_texts.json.poem`，故一併重建。

Study 03 comparison 原本已含兩支正確四句，與 attestation 不一致。舊 fallback parser 只認七字 CJK，無法辨識七字 OCR 欄位標題，測試可重現它將標題＋前三句當四句的弱點；但當年完整 acquisition/OCR temp inputs 未在這個 checkout，不宣稱已還原當年整條執行路徑。現有 align 路徑不應被說成必然失敗。

修復保留舊錯文於 `poem-corrections.json.before`，將已核四句寫入 source attestation，再由生成流程重建。`generate_ingest.py` 加入同一 evidence-backed correction hook；未知新讀法中止待核，不自動猜字。原始 OCR evidence 不改；註解其他欄位、其他 carrier 與其餘 58 籤不在本次核圖範圍。

新增 `build-liushijiazi-texts.py`，把 reference 詩文同步到既有身分 JSON、CSV、Excel；edition／干支／transcription status 不改。Excel 語意差異只有 E11、E29。CSV 保留原 CRLF；`git -c core.whitespace=cr-at-eol diff --check` 通過。

## 舊籤簿相容性

260 個 entry ID 與 schema 全部保留；只有 `liushijiazi-010`／`liushijiazi-028` 的 historical_text 改變。content_version 隨內容更新為 `9433062177a366ccd13b3708955704c73d035929e65a0eca3f9a8798d3f03527`。

公開頁舊籤簿以 entryId／question／note／ts 保存，bindings v2 以 entry_id 綁首次結果，沒有以 pool content_version 作儲存鍵。離線 VM 使用兩筆虛構舊紀錄，執行實際 DRAW_POLICY 和 showSlip 邏輯，確認相同正規化問題跨殿不重抽、同 ID 取得修正後詩文、日期與私人筆記可恢復，storage 零寫入。沒有改儲存 key、來源、schema 或任何 UI 邏輯。

因此未來部署後，既有 #10／#28 以目前資料重新打開時會看到修正詩文，仍是原支籤、原問題、日期及筆記；已匯出的舊圖片或文字不會被追溯更新。VM 與 renderer 測試不是正式站真人瀏覽器驗收；正式站重開、快取行為、ChatGPT 私人 app bundle 均未在本輪實測或更新。

## 可重跑測試結果

| 測試 | 結果 |
|---|---|
| scoped source／correction／export regression | PASS：兩筆同版修復；其他 records／statuses 不變；JSON／CSV／XLSX 對齊；未知讀法、缺／重複 targets 中止 |
| 已知錯文回灌 mutation | PASS：兩種七字標題分別使 production build 失敗，舊 pool 檔移除（僅隔離 temp fixture） |
| 舊籤簿／筆記／跨殿 bindings offline VM | PASS：260 IDs 穩定、兩筆假資料恢復、無重抽／無 storage writes |
| corpus validator | 517 PASS / 0 FAIL |
| Study 03 validator | 2204 PASS / 0 FAIL |
| Study 03 semantic regression | 211 PASS / 0 FAIL |
| historical layer validator | A1／A1b／A2／A3／A4／A5／A6／A7 全通過 |
| draw-pool regression | 60 PASS / 0 FAIL |
| slip-render regression | 14 PASS / 0 FAIL |
| arrival regression | 36 PASS / 0 FAIL |
| interpretation pool regression | 29 PASS / 0 FAIL |
| 重跑已提交資料生成鏈兩次 | 受影響衍生檔 byte-identical，含 XLSX |

修復專屬測試與重建指令見 `data/corpora/liushijiazi/README.md`；一般測試：

```bash
python3 data/corpora/liushijiazi/validate_corpus_package.py
python3 research/oracle-corpus-study-03-liushijiazi-full/validate_full60.py
python3 research/oracle-corpus-study-03-liushijiazi-full/semantic_regression.py
python3 data/corpora/liushijiazi/validate_liushijiazi_layer.py
node scripts/test-draw-pool.mjs
node scripts/test-slip-render.mjs
node scripts/test-arrival.mjs
node scripts/test-interpretation-pool.mjs
```

未測：完整外部 acquisition → ingest 重跑（缺當年 inputs）；正式站與 ChatGPT 真人使用／快取；其餘 58 籤原圖逐字核對。沒有未解測試失敗。既有未確認註解／異文、license 狀態照舊，不能用此次通過宣稱全部文字正確或可公開再製。

## 交付／部署範圍

此修復提交只供審查：來源 correction journal、兩筆 attestation、產生的 corpus／exports／draw pool、窄防護與測試文件。公開執行時真正需要換的資料是 draw pool；沒有 runtime UI、CSP、網域、localStorage 遷移或刪除程式。私人 ChatGPT 另有 bundle 的話，必須另外核對其來源與重建流程，不能假定此 repo 改完就已更新。正式服務、main 及使用者紀錄完全未動。
