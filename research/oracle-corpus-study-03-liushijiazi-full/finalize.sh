#!/bin/bash
# Finalize chain: run after BG OCR 60/60 complete
set -e
cd "$(dirname "$0")"
PKG="$HOME/.openclaw-autoclaw/workspace/draw-one-liushijiazi-full"
TMP="$HOME/.openclaw-autoclaw/workspace/.openclaw/tmp/study03"

# wait for BG OCR 60/60
while [ "$(ls "$TMP"/ocr/[0-9]*.txt 2>/dev/null | wc -l)" -lt 60 ]; do sleep 30; done

echo "[1/6] copy schema into package (self-contained)"
cp "$HOME/.openclaw-autoclaw/workspace/draw-one-oracle-framework-v01/Oracle-Database-Schema-v0.1.json" "$PKG/"

echo "[1b/6] 新港 full 60 OCR"
python3 "/Users/crystalchang/.openclaw-autoclaw/workspace/.openclaw/tmp/study03/hsk_ocr.py"

echo "[2/6] comparison base (60)"
cd "$TMP" && python3 compare_lsjz.py | head -6

echo "[3/6] final comparison JSON"
cd "$PKG" && python3 build_comparison.py

echo "[4/6] generate ingest package"
python3 generate_ingest.py

echo "[5/6] validator"
python3 validate_full60.py | tail -3

echo "[6/6] eligibility report"
python3 eligibility_report.py

echo "[7/7] focused review OCR (flagged slips)"
python3 review_ocr.py || true

echo "[8/8] package to Claw Deck + SHA"
DEST="$HOME/Desktop/Claw Deck/Draw One/Oracle Corpus Study 03 - Liushijiazi Full"
mkdir -p "$DEST"
for f in Mazu-Oracle-Corpus-Identity-Dossier-v0.1.md Mazu-Oracle-Temple-Adoption-Map-v0.1.json Liushijiazi-Source-Map-v0.1.json Liushijiazi-Corpus-Comparison-v0.1.json Oracle-Framework-Stress-Notes-03.md Production-Eligibility-Report-v0.1.json Oracle-Database-Schema-v0.1.json validate_full60.py generate_ingest.py eligibility_report.py build_comparison.py review_ocr.py README.md Liushijiazi-Full-Corpus-Report.html; do
  cp "$PKG/$f" "$DEST/" 2>/dev/null || true
done
cp -r "$PKG/data" "$DEST/data"
cd "$DEST" && shasum -a 256 *.* data/*.jsonl > SHA256SUMS.txt
cd "$PKG" && shasum -a 256 *.* data/*.jsonl > SHA256SUMS.txt
echo "Claw Deck package + SHA done"

echo "=== DONE ==="
