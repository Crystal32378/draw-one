#!/usr/bin/env python3
"""Regression for the adjudicated Guandi poem corrections (2026-11-15).

Checks, against the pre-change main commit (a7b0dc5):
  - only the ledger's `applied` slips changed, and only poem_text + notes;
  - every `pending` slip is byte-identical to main (nothing decided for the user);
  - no status moved: all 100 remain PROBABLE (a checked character is not a verified poem);
  - JSON / CSV / review XLSX agree;
  - the apply script is idempotent and fails closed on an unexpected reading.
Needs git history containing a7b0dc5 and openpyxl. Run: python3 scripts/test-guandi-poem-corrections.py
"""
import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "data/corpora/guandi"
BASE = "a7b0dc5"


def main():
    ledger = json.loads((CORPUS / "poem_corrections.json").read_text(encoding="utf-8"))
    now = json.loads((CORPUS / "slip_texts.json").read_text(encoding="utf-8"))
    old = json.loads(subprocess.check_output(
        ["git", "show", f"{BASE}:data/corpora/guandi/slip_texts.json"], cwd=ROOT, encoding="utf-8"))
    applied = {}
    for row in ledger["applied"]:
        applied.setdefault(row["slip_number"], []).append(row)
    pending = {row["slip_number"]: row for row in ledger["pending"]}
    assert not ({(r["slip_number"], r["before"]) for r in ledger["applied"]}
                & {(r["slip_number"], r["before"]) for r in ledger["pending"]}), "an edit is both applied and pending"
    assert {k: v for k, v in now.items() if k != "slips"} == {k: v for k, v in old.items() if k != "slips"}
    assert len(now["slips"]) == len(old["slips"]) == 100

    for was, row in zip(old["slips"], now["slips"]):
        n = row["slip_number"]
        assert n == was["slip_number"]
        assert row["transcription_status"] == was["transcription_status"] == "PROBABLE", f"#{n} status moved"
        changed = sorted(k for k in set(was) | set(row) if was.get(k) != row.get(k))
        if n in applied:
            assert changed == ["notes", "poem_text"], f"#{n} changed {changed}"
            assert was["poem_text"] == applied[n][0]["poem_before"], f"#{n} before"
            assert row["poem_text"] == applied[n][0]["poem_after"], f"#{n} after"
            assert "維持 PROBABLE" in row["notes"] and "poem_corrections.json" in row["notes"]
            for r in applied[n]:
                assert r["before"] not in row["poem_text"] and r["after"] in row["poem_text"]
                assert r["adjudicated_by"] == "Crystal" and r["scan_pages"], f"#{n} lacks adjudication evidence"
        else:
            assert changed == [], f"#{n} changed {changed} but is not an applied correction"
        if n in pending:
            assert row["poem_text"].count(pending[n]["before"]) == 1, f"#{n} pending character moved"
            assert pending[n]["proposed"] not in row["poem_text"], f"#{n} pending edit was applied"
            assert pending[n]["open_question"], f"#{n} pending without a stated question"

    poems = {row["slip_number"]: row["poem_text"].replace("\n", "；") for row in now["slips"]}
    with (CORPUS / "slip_texts.csv").open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert {int(r["slip_number"]): r["poem_text"] for r in rows} == poems, "CSV out of step"
    assert all(r["transcription_status"] == "PROBABLE" for r in rows)
    sheet = load_workbook(CORPUS / "slip_texts_review.xlsx")["slip_texts"]
    cols = {cell.value: cell.column for cell in sheet[1]}
    book = {int(sheet.cell(i, cols["slip_number"]).value): sheet.cell(i, cols["poem_text"]).value
            for i in range(2, sheet.max_row + 1)}
    assert book == poems, "review workbook out of step"

    # Crystal's 2026-11-15 choice is only three scan-form spellings, not another review batch.
    prior = json.loads(subprocess.check_output(
        ["git", "show", "4d4acf2:data/corpora/guandi/slip_texts.json"], cwd=ROOT, encoding="utf-8"))
    chosen = {48: ("懼", "懽"), 58: ("隱", "隲"), 94: ("綠", "縁")}
    for was, row in zip(prior["slips"], now["slips"]):
        n = row["slip_number"]
        if n in chosen:
            before, after = chosen[n]
            assert row["poem_text"] == was["poem_text"].replace(before, after)
            assert {k: v for k,v in was.items() if k not in ("poem_text", "notes")} == {k: v for k,v in row.items() if k not in ("poem_text", "notes")}
        else:
            assert row == was, f"#{n} changed outside the three scan-form decisions"
    assert set(pending) == {59, 62, 65, 87, 89}

    # Idempotence + fail-closed, on an isolated copy.
    script = ROOT / "scripts/apply-guandi-poem-corrections.py"
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / "guandi"
        shutil.copytree(CORPUS, work)
        env = {**os.environ, "GUANDI_CORPUS_DIR": str(work)}
        snapshot = {p.name: p.read_bytes() for p in work.iterdir() if p.suffix in (".json", ".csv")}
        subprocess.check_output([sys.executable, str(script)], env=env)
        assert snapshot == {p.name: p.read_bytes() for p in work.iterdir() if p.suffix in (".json", ".csv")}, "not idempotent"
        data = json.loads((work / "slip_texts.json").read_text(encoding="utf-8"))
        target = next(s for s in data["slips"] if s["slip_number"] == 74)
        target["poem_text"] = target["poem_text"].replace("嵬", "巍", 1)  # an unknown third reading
        (work / "slip_texts.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        tampered = (work / "slip_texts.json").read_bytes()
        result = subprocess.run([sys.executable, str(script)], env=env, capture_output=True, text=True)
        assert result.returncode != 0 and "review required" in result.stderr, "unknown reading must abort"
        assert (work / "slip_texts.json").read_bytes() == tampered, "aborted run must not write"

    places = sum(r["occurrences"] for r in ledger["applied"])
    print(f"PASS: {len(applied)} slips / {places} character places corrected from human image adjudication; "
          f"{len(pending)} pending character edits left exactly as on main; {100 - len(applied)} other poems byte-identical to {BASE}; all 100 still PROBABLE; "
          f"JSON/CSV/XLSX agree; apply script idempotent and fails closed on an unknown reading")


if __name__ == "__main__":
    main()
