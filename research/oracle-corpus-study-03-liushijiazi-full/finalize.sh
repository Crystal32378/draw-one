#!/bin/bash
# Finalize chain: comparison → ingest → validator → regression → eligibility → (optional) packaging
# Repo-safe（2026-08-16 portability repair）：
#   - 所有路徑以 script 所在目錄（repo package root）為基準相對解析；無任何本機絕對路徑
#   - OCR/acquisition 產物（北港 ocr/NN.txt、新港 ocr/hsk_NN.txt、fs60_full.json 等）以環境變數
#     STUDY03_TMP 注入；未注入或無效 → 明確 fail（不默默 fallback）
#   - agent 環境專屬步驟（新港 OCR、複核 OCR、Claw Deck 打包）以環境變數注入路徑；
#     未設定 → 明確 SKIP 並印出原因；設定但檔案不存在 → fail
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PKG="$SCRIPT_DIR"

# ---------- 依賴注入（必備） ----------
TMP="${STUDY03_TMP:-}"
if [ -z "$TMP" ]; then
  echo "ERROR: STUDY03_TMP 未設定。此 pipeline 需要 OCR/acquisition 產物目錄（含 ocr/ 子目錄與 fs60_full.json 等），請以環境變數注入，例如：STUDY03_TMP=/path/to/study03 bash finalize.sh" >&2
  exit 1
fi
if [ ! -d "$TMP/ocr" ]; then
  echo "ERROR: STUDY03_TMP/ocr 不存在（$TMP/ocr）。依賴缺失，明確失敗。" >&2
  exit 1
fi
for f in beigang_slip_urls.json fs60_full.json hsinkang_details.json; do
  if [ ! -f "$TMP/$f" ]; then
    echo "ERROR: 依賴缺失：$TMP/$f。請確認 STUDY03_TMP 指向完整 acquisition 產物目錄。" >&2
    exit 1
  fi
done

# ---------- 北港 OCR 完整性檢查（60/60，缺檔即 fail） ----------
MISSING=""
for n in $(seq -w 1 60); do
  [ -f "$TMP/ocr/$n.txt" ] || MISSING="$MISSING $n"
done
if [ -n "$MISSING" ]; then
  echo "ERROR: 北港 OCR 缺 ${MISSING}（需 60/60 才可繼續）。" >&2
  exit 1
fi

echo "[1/5] comparison (60-vs-60)"
cd "$PKG" && python3 build_comparison.py | head -8

echo "[2/5] generate ingest package"
python3 generate_ingest.py

echo "[3/5] validator"
python3 validate_full60.py | tail -3

echo "[4/5] semantic regression"
python3 semantic_regression.py | tail -2

echo "[5/5] eligibility report"
python3 eligibility_report.py

# ---------- agent 環境專屬（可選，env 注入） ----------
if [ -n "${HSK_OCR_PY:-}" ]; then
  if [ -f "$HSK_OCR_PY" ]; then
    echo "[opt] 新港 full 60 OCR（agent 工具，需 autoglm token service）"
    python3 "$HSK_OCR_PY"
  else
    echo "ERROR: HSK_OCR_PY 指向的檔案不存在（$HSK_OCR_PY）。" >&2
    exit 1
  fi
else
  echo "[opt] SKIP 新港 OCR：HSK_OCR_PY 未設定（agent 環境專屬，需要 autoglm token service）"
fi

if [ -n "${CLAW_DECK_DEST:-}" ]; then
  DEST="$CLAW_DECK_DEST"
  mkdir -p "$DEST"
  echo "[opt] package to $DEST + SHA"
  for f in Mazu-Oracle-Corpus-Identity-Dossier-v0.1.md Mazu-Oracle-Temple-Adoption-Map-v0.1.json Liushijiazi-Source-Map-v0.1.json Liushijiazi-Corpus-Comparison-v0.1.json Oracle-Framework-Stress-Notes-03.md Production-Eligibility-Report-v0.1.json Oracle-Database-Schema-v0.1.json validate_full60.py semantic_regression.py generate_ingest.py eligibility_report.py build_comparison.py review_ocr.py README.md Liushijiazi-Full-Corpus-Report.html; do
    cp "$PKG/$f" "$DEST/" 2>/dev/null || echo "WARN: 缺少 $f"
  done
  cp -r "$PKG/data" "$DEST/data"
  cd "$DEST" && shasum -a 256 *.* data/*.jsonl > SHA256SUMS.txt
  echo "package + SHA done: $DEST"
else
  echo "[opt] SKIP Claw Deck 打包：CLAW_DECK_DEST 未設定"
fi

echo "=== DONE ==="
