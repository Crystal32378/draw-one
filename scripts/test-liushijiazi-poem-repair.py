#!/usr/bin/env python3
"""Scoped regression: corrected witness, exports, unchanged records, fail-closed."""
import copy
import ast
import csv
import io
import json
import re
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
BASE = "7ae87f6e45526a7dc8ef6f47c24c16d50a444a8d"
STUDY = ROOT / "research/oracle-corpus-study-03-liushijiazi-full"
sys.path.insert(0, str(STUDY))
from poem_corrections import CORRECTIONS, apply_corrections, validate_corrections


def original(path):
    return subprocess.check_output(["git", "show", f"{BASE}:{path}"], cwd=ROOT)


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def rejects(fn):
    try:
        fn()
    except ValueError:
        return
    raise AssertionError("Expected fail-closed rejection")


corrections = {row["slip_number"]: row for row in CORRECTIONS}
targets = {10, 28}
assert set(corrections) == targets
# Reproduce the seven-CJK-heading trap in the legacy fallback parser without
# importing/running acquisition code or inventing missing historical inputs.
tree = ast.parse((STUDY / "generate_ingest.py").read_text())
functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in {"cjk_only", "poem_lines"}]
parser_scope = {"re": re}
exec(compile(ast.Module(body=functions, type_ignores=[]), "legacy-parser", "exec"), parser_scope)
for correction in CORRECTIONS:
    sample = correction["before"].splitlines()[0] + "\n" + correction["after"]
    assert parser_scope["poem_lines"](sample) == correction["before"].splitlines()
assert "apply_corrections(attestation)" in (STUDY / "generate_ingest.py").read_text()
for n, row in corrections.items():
    assert len(row["after"].splitlines()) == 4
    assert all(len(line) == 7 for line in row["after"].splitlines())
    assert row["before"].splitlines()[1:] == row["after"].splitlines()[:3]
    assert row["human_confirmation"] is False
items = [json.loads(line) for line in (STUDY / "data/concrete_item.jsonl").read_text().splitlines()]
comparison = {row["slip_number"]: row for row in load(str(STUDY.relative_to(ROOT) / "Liushijiazi-Corpus-Comparison-v0.1.json"))["slips"]}
for n, row in corrections.items():
    item = next(item for item in items if item["item_id"] == f"item-bg-{n:03}")
    assert item["url"] == row["source_url"] and item["digital_checksum"] == row["source_sha256"]
    assert comparison[n]["poem_beigang_aligned"] == row["after"].splitlines()

att_path = "research/oracle-corpus-study-03-liushijiazi-full/data/attestation.jsonl"
before = [json.loads(line) for line in original(att_path).decode().splitlines()]
after = [json.loads(line) for line in (ROOT / att_path).read_text().splitlines()]
validate_corrections(after)
assert apply_corrections(copy.deepcopy(before)) == after
assert apply_corrections(copy.deepcopy(after)) == after
rejects(lambda: validate_corrections(before))
unexpected = copy.deepcopy(before)
next(row for row in unexpected if row["attestation_id"] == "att-bg-010")["source_text"] = "unexpected upstream change"
rejects(lambda: apply_corrections(unexpected))
rejects(lambda: apply_corrections(after + [after[9]]))
rejects(lambda: apply_corrections([row for row in after if row["attestation_id"] != "att-bg-010"]))
for old, new in zip(before, after):
    allowed = {"source_text", "notes"} if old["attestation_id"] in {"att-bg-010", "att-bg-028"} else set()
    assert {key for key in old if old[key] != new[key]} <= allowed

for filename, key, field in [("slips.json", "slip_number", "reference_text"),
                              ("attestations.json", "attestation_id", "text")]:
    path = "data/corpora/liushijiazi/" + filename
    old_rows = json.loads(original(path))
    new_rows = load(path)
    assert len(old_rows) == len(new_rows)
    for old, new in zip(old_rows, new_rows):
        affected = old[key] in (targets if key == "slip_number" else {"att-bg-010", "att-bg-028"})
        if affected:
            assert new[field] == corrections[new["slip_number"]]["after"]
            assert {k for k in old if old[k] != new[k]} <= {field, "notes"}
        else:
            assert old == new

path = "data/corpora/liushijiazi/slip_texts.json"
old_identity, new_identity = json.loads(original(path)), load(path)
for old, new in zip(old_identity["slips"], new_identity["slips"]):
    n = old["slip_number"]
    if n in targets:
        assert new["poem_text"] == corrections[n]["after"]
        assert {key for key in old if old[key] != new[key]} == {"poem_text"}
    else:
        assert old == new
for n in targets:
    assert load("data/corpora/liushijiazi/source_texts.json")[str(n)]["poem"] == corrections[n]["after"]

csv_path = "data/corpora/liushijiazi/slip_texts.csv"
csv_before = list(csv.DictReader(io.StringIO(original(csv_path).decode())))
csv_after = list(csv.DictReader((ROOT / csv_path).open(encoding="utf-8", newline="")))
for old, new in zip(csv_before, csv_after):
    n = int(new["slip_number"])
    assert {key for key in old if old[key] != new[key]} == ({"poem_text"} if n in targets else set())
    if n in targets:
        assert new["poem_text"] == corrections[n]["after"].replace("\n", "；")
xlsx_path = "data/corpora/liushijiazi/slip_texts_review.xlsx"
wb_old = load_workbook(io.BytesIO(original(xlsx_path)))
wb_new = load_workbook(ROOT / xlsx_path)
changed_cells = []
for old_row, new_row in zip(wb_old.active, wb_new.active):
    for old, new in zip(old_row, new_row):
        if old.value != new.value:
            changed_cells.append(new.coordinate)
assert changed_cells == ["E11", "E29"], changed_cells

# Actual builder regression: a known seven-character OCR heading must fail and
# remove an old pool, not quietly pass the four-lines/seven-characters checks.
with tempfile.TemporaryDirectory(prefix="draw-one-ocr-gate-") as temporary:
    sandbox = Path(temporary)
    (sandbox / "scripts").mkdir()
    shutil.copy(ROOT / "scripts/build-draw-pool.mjs", sandbox / "scripts")
    for corpus in ["guanyin", "guandi", "liushijiazi"]:
        destination = sandbox / "data/corpora" / corpus
        destination.mkdir(parents=True)
        shutil.copy(ROOT / "data/corpora" / corpus / "slip_texts.json", destination)
    for n in targets:
        source = sandbox / path
        dirty = copy.deepcopy(new_identity)
        dirty["slips"][n - 1]["poem_text"] = corrections[n]["before"]
        source.write_text(json.dumps(dirty, ensure_ascii=False))
        (sandbox / "assets").mkdir(exist_ok=True)
        pool = sandbox / "assets/oracles.draw-pool.js"
        pool.write_text("stale artifact")
        result = subprocess.run(["node", str(sandbox / "scripts/build-draw-pool.mjs")], capture_output=True, text=True)
        assert result.returncode == 1 and "no-ocr-heading" in result.stderr
        assert not pool.exists()

print("PASS: two same-edition source repairs; non-target records/statuses unchanged; JSON/CSV/XLSX agree; stale/unknown transcriptions rejected; both OCR-heading mutations fail closed")
