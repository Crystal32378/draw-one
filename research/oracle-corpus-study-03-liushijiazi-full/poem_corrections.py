"""Evidence-backed poem repairs; original OCR stays in the correction journal.

This is agent image review, not human approval or authenticity/license upgrade.
Only the named Beigang attestations are corrected; other carriers stay intact.
"""
import json
from pathlib import Path

CORRECTIONS = json.loads(Path(__file__).with_name("poem-corrections.json").read_text(encoding="utf-8"))["corrections"]


def apply_corrections(rows):
    for correction in CORRECTIONS:
        matches = [r for r in rows if r["attestation_id"] == correction["attestation_id"]]
        if len(matches) != 1:
            raise ValueError(f"Missing/duplicate correction target: {correction['attestation_id']}")
        row = matches[0]
        if row["numbering_in_source"] != correction["ganzhi"]:
            raise ValueError("Correction target edition/numbering mismatch")
        if row["source_text"] not in (correction["before"], correction["after"]):
            raise ValueError(f"Unexpected transcription; review before overriding {row['attestation_id']}")
        row["source_text"] = correction["after"]
        note = (f"2026-11-14 agent 目視核對同版官方原圖，僅修正詩文四句；"
                f"非 human confirmation，其他欄位與狀態未升級；"
                f"原 OCR／逐句修復與影像 SHA-256 見 poem-corrections.json#{row['attestation_id']}")
        row["notes"] = ("原始 2026-08-15 註記（歷史轉錄聲明，非本次核驗結論）：「"
                        + correction["legacy_notes"] + "」；" + note)
    return rows


def validate_corrections(rows):
    for correction in CORRECTIONS:
        matches = [r for r in rows if r["attestation_id"] == correction["attestation_id"]]
        if len(matches) != 1 or matches[0]["source_text"] != correction["after"]:
            raise ValueError(f"Stale/unreviewed poem: {correction['attestation_id']}; apply poem-corrections.json first")


if __name__ == "__main__":
    path = Path(__file__).parent / "data/attestation.jsonl"
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    apply_corrections(rows)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")
