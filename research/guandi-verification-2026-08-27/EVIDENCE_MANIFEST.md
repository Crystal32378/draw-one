# 關帝百籤 — External Evidence Manifest

## Production Witness

- **PDF**：`File:NLC892-411999005947-9653 道藏 第4379冊.pdf`（中國國圖藏《道藏》第4379冊）
- **URL**：https://commons.wikimedia.org/wiki/File:NLC892-411999005947-9653_%E9%81%93%E8%97%8F_%E7%AC%AC4379%E5%86%8A.pdf
- **下載**：`curl -L -o daozang_4379.pdf '<Special:FilePath 直鏈>'`（17MB，94 頁）
- **內容**：《護國嘉濟江東王靈籤》全本（宋濂碑文 p2–11＋籤詩 p12–94）；頁碼對應 100 籤見 `slip_page_map.json`

## OCR 重跑方式

1. 頁面 PNG：`python3 -c "import fitz; ...get_pixmap(dpi=200)"`（PyMuPDF）
2. OCR-B：`pdf-ocr`（autoclaw-pdf-ocr skill）`--pages 12-60` 與 `61-94`，輸出 combined.txt
3. OCR-C：`autoglm image-recognition`（prompt 見 verify script 說明），upload-mix 上傳頁面 PNG 後辨識
4. 比對：`python3 verify_guandi_daozang.py <repo_root>`（page-scoped，cand_pages 限制）

## 本機檔案與 repo 的關係

- repo 只含 OCR 輸出（`ocr/` 下 combined.txt 與 jsonl）與工具；**不包含 PDF 本體與頁面 PNG**（17MB+，不入 repo）
- 重跑需先依本 manifest 下載 PDF；OCR 輸出已提交可稽核


## Slip-region segmentation 方法（v0.5）

`slip_regions.py` 逐行切分：marker=「第N」獨立行；marker 後內容歸該籤直至下一 marker；
頁首無主文字 excluded；編號衝突或缺 marker → fail closed（該頁對該籤不提供 evidence）。
verify 與 variant analyzer 共用此 boundary。hostile regression：`regression_test.py` 全 PASS。