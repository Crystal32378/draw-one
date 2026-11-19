#!/usr/bin/env python3
"""Apply the adjudicated Guandi poem corrections to the curated identity table.

Source of truth for *what* changes: data/corpora/guandi/poem_corrections.json
(`applied` only — `pending` rows are never written). Writes slip_texts.json,
slip_texts.csv and slip_texts_review.xlsx together so the three stay in step.

Fail-closed: a slip whose current text is neither the recorded `poem_before`
nor the recorded `poem_after` aborts the whole run with nothing written.
transcription_status is never touched (corrected slips stay PROBABLE).
Idempotent: a second run changes nothing.

Run, then rebuild the pool:
    python3 scripts/apply-guandi-poem-corrections.py
    node scripts/build-draw-pool.mjs
"""
import csv
import io
import json
import os
import sys
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
CORPUS = Path(os.environ.get("GUANDI_CORPUS_DIR") or ROOT / "data/corpora/guandi")  # override is for the regression test only
NOTE_PREFIX = "字級修正"


def note_for(rows):
    pairs = "、".join(f"{r['before']}→{r['after']}" for r in rows)
    pages = "、".join(f"p.{p}" for p in sorted({p for r in rows for p in r["scan_pages"]}))
    decision = "Crystal 2026-11-15 指定保留掃描異體字形；" if any(r.get("orthography_decision") for r in rows) else ""
    return (f"{NOTE_PREFIX}：{pairs}（Crystal 2026-09-08 人眼核圖裁定，NLC《道藏》第 4379 冊 {pages}；"
            f"見 poem_corrections.json）。{decision}只核了差異字，全詩未逐字對影像——維持 PROBABLE。")


def main():
    ledger = json.loads((CORPUS / "poem_corrections.json").read_text(encoding="utf-8"))
    by_slip = {}
    for row in ledger["applied"]:
        by_slip.setdefault(row["slip_number"], []).append(row)
    pending_slips = {row["slip_number"]: row for row in ledger["pending"]}

    identity_path = CORPUS / "slip_texts.json"
    identity_source = identity_path.read_text(encoding="utf-8")
    identity = json.loads(identity_source)
    slips = {row["slip_number"]: row for row in identity["slips"]}
    if len(slips) != 100:
        raise SystemExit("Expected 100 Guandi slips")

    changed = 0
    for number, rows in sorted(by_slip.items()):
        slip = slips[number]
        before, after = rows[0]["poem_before"], rows[0]["poem_after"]
        if any(r["poem_before"] != before or r["poem_after"] != after for r in rows):
            raise SystemExit(f"#{number}: ledger rows disagree about the poem")
        expected = before
        for r in rows:
            if expected.count(r["before"]) != r["occurrences"]:
                raise SystemExit(f"#{number}: 「{r['before']}」 expected {r['occurrences']}×, review required")
            expected = expected.replace(r["before"], r["after"])
        if expected != after:
            raise SystemExit(f"#{number}: ledger poem_after does not follow from its own edits")
        if slip["poem_text"] == after:
            pass  # already applied
        elif slip["poem_text"] == before or slip["poem_text"] in rows[0].get("accepted_previous_poems", []):
            slip["poem_text"] = after
            changed += 1
        else:
            raise SystemExit(f"#{number}: current text matches neither before nor after — stop, review required")
        if slip["transcription_status"] != "PROBABLE":
            raise SystemExit(f"#{number}: status is {slip['transcription_status']}; this script never changes status")
        slip["notes"] = note_for(rows)

    # A pending row must still read as it did when it was left pending.
    for number, row in pending_slips.items():
        if slips[number]["poem_text"].count(row["before"]) != 1:
            raise SystemExit(f"#{number}: pending character 「{row['before']}」 no longer found once — review required")

    poems = {n: s["poem_text"] for n, s in slips.items()}
    notes = {n: s.get("notes", "") for n, s in slips.items()}

    csv_path = CORPUS / "slip_texts.csv"
    with csv_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fields, csv_rows = reader.fieldnames, list(reader)
    if len(csv_rows) != 100 or {int(r["slip_number"]) for r in csv_rows} != set(poems):
        raise SystemExit("CSV identity mismatch")
    for r in csv_rows:
        n = int(r["slip_number"])
        r["poem_text"] = poems[n].replace("\n", "；")
        r["notes"] = notes[n]

    workbook_path = CORPUS / "slip_texts_review.xlsx"
    workbook = load_workbook(workbook_path)
    sheet = workbook["slip_texts"]
    columns = {cell.value: cell.column for cell in sheet[1]}
    if sheet.max_row != 101:
        raise SystemExit("Review workbook record count mismatch")
    book_changed, seen = False, set()
    for index in range(2, sheet.max_row + 1):
        n = int(sheet.cell(index, columns["slip_number"]).value)
        seen.add(n)
        for column, value in (("poem_text", poems[n].replace("\n", "；")), ("notes", notes[n] or None)):
            cell = sheet.cell(index, columns[column])
            if cell.value != value:
                cell.value = value
                book_changed = True
    if seen != set(poems):
        raise SystemExit("Review workbook identity mismatch")

    identity_path.write_text(
        json.dumps(identity, ensure_ascii=False, indent=2) + ("\n" if identity_source.endswith("\n") else ""),
        encoding="utf-8")
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    writer.writerows(csv_rows)
    csv_path.write_bytes(output.getvalue().encode("utf-8"))
    if book_changed:
        workbook.save(workbook_path)
    places = sum(r["occurrences"] for rows in by_slip.values() for r in rows)
    print(f"Guandi poem corrections: {len(by_slip)} slips / {places} character places in the ledger; "
          f"{changed} slip(s) rewritten this run; {len(pending_slips)} pending slip(s) left as they were; statuses untouched")


if __name__ == "__main__":
    sys.exit(main())
