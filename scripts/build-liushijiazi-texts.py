#!/usr/bin/env python3
"""Sync reference poems into the curated identity export, CSV and review workbook.

Preserves identity/edition/status metadata. Requires openpyxl for the existing
review workbook; no runtime/browser storage is accessed. Run after corpus build.
"""
import csv
import io
import json
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "data/corpora/liushijiazi"


def main():
    refs = json.loads((CORPUS / "slips.json").read_text(encoding="utf-8"))
    identity_path = CORPUS / "slip_texts.json"
    identity_source = identity_path.read_text(encoding="utf-8")
    identity = json.loads(identity_source)
    by_number = {row["slip_number"]: row for row in refs}
    if len(by_number) != 60 or len(identity["slips"]) != 60:
        raise ValueError("Expected 60 unique reference and identity records")
    for row in identity["slips"]:
        ref = by_number[row["slip_number"]]
        if row["edition_id"] != ref["reference_edition_id"] or row["original_slip_label"] != ref["ganzhi"]["beigang_official_list"]:
            raise ValueError("Reference identity changed; review required")
        row["poem_text"] = ref["reference_text"]

    csv_path = CORPUS / "slip_texts.csv"
    with csv_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        fields, csv_rows = reader.fieldnames, list(reader)
    poems = {row["slip_number"]: row["poem_text"] for row in identity["slips"]}
    if len(csv_rows) != 60 or {int(row["slip_number"]) for row in csv_rows} != set(poems):
        raise ValueError("CSV identity mismatch")
    for row in csv_rows:
        row["poem_text"] = poems[int(row["slip_number"])].replace("\n", "；")

    workbook_path = CORPUS / "slip_texts_review.xlsx"
    workbook = load_workbook(workbook_path)
    sheet = workbook["slip_texts"]
    columns = {cell.value: cell.column for cell in sheet[1]}
    if sheet.max_row != 61:
        raise ValueError("Review workbook record count mismatch")
    changed = False
    seen = set()
    for index in range(2, sheet.max_row + 1):
        number = int(sheet.cell(index, columns["slip_number"]).value)
        seen.add(number)
        cell = sheet.cell(index, columns["poem_text"])
        value = poems[number].replace("\n", "；")
        if cell.value != value:
            cell.value = value
            changed = True
    if seen != set(poems):
        raise ValueError("Review workbook identity mismatch")

    identity_path.write_text(json.dumps(identity, ensure_ascii=False, indent=2) + ("\n" if identity_source.endswith("\n") else ""), encoding="utf-8")
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    writer.writerows(csv_rows)
    csv_path.write_bytes(output.getvalue().encode("utf-8"))
    if changed:
        workbook.save(workbook_path)
    print("Synced 60 reference poems into JSON/CSV/XLSX; identity/status metadata preserved")


if __name__ == "__main__":
    main()
