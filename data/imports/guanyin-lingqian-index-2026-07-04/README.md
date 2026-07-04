# Guanyin Lingqian Public Index Package

This package is a public-safe index for Draw One importer design. It does not include raw HTML or oracle text.

## Contents

- `manifest.csv`: one row per available talisman number, with provenance/review fields.
- `batches/`: the manifest split into 20-record batches.
- `package-summary.json`: package-level summary.
- `batch-summary.json`: batch counts and file names.

## Status

- Selected unique entries: 99
- Missing talisman numbers: 007
- Default license status: `unsure`
- Raw HTML included: no

## Rules

- Do not treat unknown internet text as usable.
- Do not import `license_status = unsure` into production.
- Use this package to build dry-run, batching, resume, duplicate detection, and review gates.
- Raw source files remain local until source/license review is complete.
