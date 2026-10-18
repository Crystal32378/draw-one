// Guard the current public tree against reintroducing private producer inputs.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const privatePaths = [
  "data/corpora/guanyin/ENTITY-CLEANUP-REPORT.md",
  "data/corpora/guanyin/INTERPRETATION-LAYER.md",
  "data/corpora/guanyin/build_per_slip_page_jie.py",
  "data/corpora/guanyin/entity-cleanup-audit.json",
  "data/corpora/guanyin/hyakusen_baseline_e1387.json",
  "data/corpora/guanyin/interpretation_layer.json",
  "data/corpora/guanyin/manual_confirmation_ledger.json",
  "data/corpora/guanyin/per_slip_page_jie.json",
  "data/corpora/guanyin/slip_pages_recheck.jsonl",
  "data/corpora/guanyin/source_three_way.json",
  "data/corpora/guanyin/validate_interpretation_layer.py",
  "data/corpora/liushijiazi/INTERPRETATION-LAYER.md",
  "data/corpora/liushijiazi/QA_SUMMARY.md",
  "data/corpora/liushijiazi/attestations.json",
  "data/corpora/liushijiazi/build_liushijiazi_layer.py",
  "data/corpora/liushijiazi/hostile_test_liushijiazi.py",
  "data/corpora/liushijiazi/interpretation_layer.json",
  "data/corpora/liushijiazi/ocr_bg_2026-08-27.jsonl",
  "data/corpora/liushijiazi/slips.json",
  "data/corpora/liushijiazi/source_texts.json",
  "data/corpora/liushijiazi/validate_liushijiazi_layer.py",
  "data/corpora/guanyin/jieyue_custody.json",
  "scripts/build-interpretation-pool.mjs",
  "data/production/interpretation-pool.report.json",
  ".github/workflows/guanyin-validator.yml"
];
const present = privatePaths.filter(path => existsSync(join(ROOT, path)));
if (present.length) {
  console.error('Private research must not be in the public release tree:', present);
  process.exit(1);
}
console.log(`${privatePaths.length} private source/tooling paths absent; public release remains independently verifiable.`);
