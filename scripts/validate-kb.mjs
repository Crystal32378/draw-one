// scripts/validate-kb.mjs
// Oracle Knowledge Base v1 validator.
// Zero dependencies (node:fs / node:path only). Run: node scripts/validate-kb.mjs
//
// Responsibilities:
//   1. Schema validation per entity (required fields, enums)
//   2. Referential integrity (slip/source/attestation/claim cross-refs)
//   3. Divergence detection: same slip, distinct normalized texts, no variant_group -> error
//   4. Status derivation (slip / attestation) + structural enforcement of claim statuses
//      - verified text_authenticity requires >=2 independent sources w/ identical normalized
//        text AND >=1 first-hand source AND verbatim_confirmed (v1 evidence policy)
//   5. Quarantine enforcement (ai_generated_or_summarized / license=no -> claim must be quarantine)
//   6. License gate for draw-pool candidates (verified + license=ok + reference designated)
//   7. Emits draw-pool.preview.json when --emit is passed (NOT wired to frontend)
//
// v1 evidence policy note: the >=2 independent sources bar is Draw One KB v1 policy,
// not a permanent philological truth. Amendments must go through the spec, not silent loosening.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const KB_DIR = join(ROOT, "data", "oracle-knowledge-base");
const EMIT = process.argv.includes("--emit");

const FILES = ["sets", "sources", "slips", "attestations", "variant_groups", "claims", "interpretations", "reference_editions"];

const ENUMS = {
  set_status: ["draft", "active", "retired"],
  media_type: ["printed_edition", "temple_pamphlet", "scan", "photo", "website", "scholarly_work", "manuscript", "other"],
  content_class: ["traditional_text", "modern_interpretation", "translation", "ai_generated_or_summarized", "unknown"],
  license_status: ["ok", "unsure", "no"],
  transcription_method: ["manual", "ocr", "copied_from_repo"],
  text_status: ["verbatim_confirmed", "partial", "uncertain"],
  relationship: ["identical_text", "orthographic_only", "substantive_divergence", "unresolved_relationship"],
  resolution_status: ["none", "documented", "reference_designated"],
  target_type: ["slip", "attestation", "source", "variant_group"],
  claim_type: ["text_authenticity", "numbering", "title", "fortune_grade", "allusion_story", "license", "version_identity", "lineage"],
  checked_by: ["human", "domain_expert", "agent_review"],
  claim_status: ["verified", "probable", "unresolved", "quarantine"],
  interpretation_kind: ["meaning", "advice", "modern_rewrite", "story_note"],
  interpretation_status: ["draft", "reviewed", "approved"],
};

const REQUIRED = {
  sets: ["set_id", "display_name", "deity", "tradition_family", "numbering_system", "status"],
  sources: ["source_id", "title", "media_type", "content_class", "license_status"],
  slips: ["slip_id", "set_id", "slip_number"],
  attestations: ["attestation_id", "slip_id", "source_id", "source_text", "text_status"],
  variant_groups: ["variant_group_id", "slip_id", "attestation_ids", "relationship"],
  claims: ["claim_id", "target_type", "target_id", "claim_type", "evidence_summary", "checked_by", "checked_at", "status"],
  interpretations: ["interpretation_id", "slip_id", "kind", "text", "based_on_attestation_ids", "author", "status"],
  reference_editions: ["reference_id", "set_id", "source_id", "decided_by", "decided_at"],
};

const FIRST_HAND = new Set(["printed_edition", "temple_pamphlet", "scan", "photo"]);
const QUARANTINE_CLASS = "ai_generated_or_summarized";

function load() {
  const db = {};
  for (const f of FILES) {
    const path = join(KB_DIR, f + ".jsonl");
    if (!existsSync(path)) throw new Error(`missing file: ${f}.jsonl`);
    const lines = readFileSync(path, "utf8").split("\n").filter((l) => l.trim() !== "");
    db[f] = lines.map((l, i) => {
      try {
        return JSON.parse(l);
      } catch (e) {
        throw new Error(`${f}.jsonl line ${i + 1}: invalid JSON — ${e.message}`);
      }
    });
  }
  return db;
}

function normalizeText(t) {
  // Minimal normalization for *comparison only*: remove whitespace and fold common
  // traditional/simplified & variant glyphs used in this corpus. Derived key — never displayed.
  return String(t || "")
    .replace(/[\s\u3000]/g, "")
    .replace(/啣/g, "銜")
    .replace(/卸/g, "銜")
    .replace(/疊/g, "叠")
    .replace(/壘/g, "垒")
    .replace(/坭/g, "泥")
    .replace(/飼/g, "饲")
    .replace(/於菟/g, "于菟")
    .replace(/須/g, "须")
    .replace(/還/g, "还")
    .replace(/歸/g, "归")
    .replace(/復/g, "复")
    .replace(/圓/g, "圆")
    .replace(/門閭/g, "门闾")
    .replace(/門/g, "门")
    .replace(/閭/g, "闾")
    .replace(/與/g, "与")
    .replace(/無/g, "无")
    .replace(/巖/g, "岩")
    .replace(/難/g, "难")
    .replace(/捨/g, "舍")
    .replace(/後/g, "后")
    .replace(/來/g, "来")
    .replace(/見/g, "见")
    .replace(/萬/g, "万")
    .replace(/當/g, "当")
    .replace(/時/g, "时")
    .replace(/會/g, "会")
    .replace(/長/g, "长")
    .replace(/衝/g, "冲")
    .replace(/風/g, "风")
    .replace(/勞/g, "劳")
    .replace(/兒/g, "儿")
    .replace(/頭/g, "头")
    .replace(/壞/g, "坏")
    .replace(/臨/g, "临")
    .replace(/鄉/g, "乡")
    .replace(/鵰/g, "雕")
    .replace(/鳥/g, "鸟")
    .replace(/營/g, "营")
    .replace(/謀/g, "谋")
    .replace(/誰/g, "谁")
    .replace(/鏡/g, "镜")
    .replace(/換/g, "换")
    .replace(/祿/g, "禄")
    .replace(/孫/g, "孙")
    .replace(/鋤/g, "锄")
    .replace(/錐/g, "锥")
    .replace(/攜/g, "携");
}

function main() {
  let db;
  try {
    db = load();
  } catch (e) {
    console.error(`KB load error: ${e.message}`);
    process.exit(1);
  }

  const errors = [];
  const byId = (f) => new Map(db[f].map((o) => [o[f === "sets" ? "set_id" : f === "sources" ? "source_id" : f === "slips" ? "slip_id" : f === "attestations" ? "attestation_id" : f === "variant_groups" ? "variant_group_id" : f === "claims" ? "claim_id" : f === "interpretations" ? "interpretation_id" : "reference_id"], o]));

  const idMaps = {
    sets: byId("sets"), sources: byId("sources"), slips: byId("slips"),
    attestations: byId("attestations"), variant_groups: byId("variant_groups"),
    claims: byId("claims"), interpretations: byId("interpretations"),
    reference_editions: byId("reference_editions"),
  };

  // ---- 1. schema ----
  for (const f of FILES) {
    const seen = new Set();
    db[f].forEach((o, i) => {
      const row = `${f}.jsonl #${i + 1}`;
      for (const k of REQUIRED[f]) {
        const v = o[k];
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
          errors.push(`${row}: required field "${k}" missing/empty`);
        }
      }
      const idKey = f === "sets" ? "set_id" : f === "sources" ? "source_id" : f === "slips" ? "slip_id" : f === "attestations" ? "attestation_id" : f === "variant_groups" ? "variant_group_id" : f === "claims" ? "claim_id" : f === "interpretations" ? "interpretation_id" : "reference_id";
      if (o[idKey] && seen.has(o[idKey])) errors.push(`${row}: duplicate id "${o[idKey]}"`);
      if (o[idKey]) seen.add(o[idKey]);
    });
  }

  const enumCheck = (o, row, key, allowed) => {
    if (o[key] !== undefined && !allowed.includes(o[key])) {
      errors.push(`${row}: bad ${key} "${o[key]}" (allowed: ${allowed.join("/")})`);
    }
  };
  db.sets.forEach((o, i) => enumCheck(o, `sets #${i + 1}`, "status", ENUMS.set_status));
  db.sources.forEach((o, i) => {
    const row = `sources #${i + 1}`;
    enumCheck(o, row, "media_type", ENUMS.media_type);
    enumCheck(o, row, "content_class", ENUMS.content_class);
    enumCheck(o, row, "license_status", ENUMS.license_status);
  });
  db.attestations.forEach((o, i) => {
    const row = `attestations #${i + 1}`;
    enumCheck(o, row, "transcription_method", ENUMS.transcription_method);
    enumCheck(o, row, "text_status", ENUMS.text_status);
    if (o.text_normalized !== undefined && o.text_normalized !== normalizeText(o.source_text)) {
      errors.push(`${row}: text_normalized does not match derived normalization of source_text`);
    }
  });
  db.variant_groups.forEach((o, i) => {
    const row = `variant_groups #${i + 1}`;
    enumCheck(o, row, "relationship", ENUMS.relationship);
    enumCheck(o, row, "resolution_status", ENUMS.resolution_status);
  });
  db.claims.forEach((o, i) => {
    const row = `claims #${i + 1}`;
    enumCheck(o, row, "target_type", ENUMS.target_type);
    enumCheck(o, row, "claim_type", ENUMS.claim_type);
    enumCheck(o, row, "checked_by", ENUMS.checked_by);
    enumCheck(o, row, "status", ENUMS.claim_status);
  });
  db.interpretations.forEach((o, i) => {
    const row = `interpretations #${i + 1}`;
    enumCheck(o, row, "kind", ENUMS.interpretation_kind);
    enumCheck(o, row, "status", ENUMS.interpretation_status);
  });

  // ---- 2. referential integrity ----
  db.slips.forEach((o, i) => {
    const row = `slips #${i + 1}`;
    if (!idMaps.sets.has(o.set_id)) errors.push(`${row}: set_id "${o.set_id}" not found in sets`);
  });
  db.attestations.forEach((o, i) => {
    const row = `attestations #${i + 1}`;
    if (!idMaps.slips.has(o.slip_id)) errors.push(`${row}: slip_id "${o.slip_id}" not found in slips`);
    if (!idMaps.sources.has(o.source_id)) errors.push(`${row}: source_id "${o.source_id}" not found in sources`);
    if (typeof o.source_text !== "string" || o.source_text.trim() === "") errors.push(`${row}: source_text must be non-empty verbatim text`);
  });
  db.variant_groups.forEach((o, i) => {
    const row = `variant_groups #${i + 1}`;
    if (!idMaps.slips.has(o.slip_id)) errors.push(`${row}: slip_id not found`);
    for (const aid of o.attestation_ids) {
      if (!idMaps.attestations.has(aid)) errors.push(`${row}: attestation_id "${aid}" not found`);
      else if (idMaps.attestations.get(aid).slip_id !== o.slip_id) errors.push(`${row}: attestation "${aid}" does not belong to slip "${o.slip_id}"`);
    }
  });
  db.claims.forEach((o, i) => {
    const row = `claims #${i + 1}`;
    const map = idMaps[o.target_type + "s"];
    if (!map || !map.has(o.target_id)) errors.push(`${row}: target ${o.target_type} "${o.target_id}" not found`);
    for (const sid of o.source_ids || []) {
      if (!idMaps.sources.has(sid)) errors.push(`${row}: source_ids "${sid}" not found`);
    }
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(o.checked_at))) errors.push(`${row}: checked_at must be ISO date (YYYY-MM-DD...)`);
  });
  db.interpretations.forEach((o, i) => {
    const row = `interpretations #${i + 1}`;
    if (!idMaps.slips.has(o.slip_id)) errors.push(`${row}: slip_id not found`);
    for (const aid of o.based_on_attestation_ids) {
      if (!idMaps.attestations.has(aid)) errors.push(`${row}: based_on_attestation_ids "${aid}" not found`);
    }
  });
  db.reference_editions.forEach((o, i) => {
    const row = `reference_editions #${i + 1}`;
    if (!idMaps.sets.has(o.set_id)) errors.push(`${row}: set_id not found`);
    if (!idMaps.sources.has(o.source_id)) errors.push(`${row}: source_id "${o.source_id}" not found in sources`);
    if (o.attestation_id !== undefined && o.attestation_id !== null && o.attestation_id !== "") {
      if (!idMaps.attestations.has(o.attestation_id)) errors.push(`${row}: attestation_id "${o.attestation_id}" not found`);
      else {
        const a = idMaps.attestations.get(o.attestation_id);
        const s = idMaps.slips.get(a.slip_id);
        if (s.set_id !== o.set_id) errors.push(`${row}: attestation override belongs to set "${s.set_id}", not "${o.set_id}"`);
      }
    }
  });

  // ---- 3. divergence detection ----
  const attestBySlip = new Map();
  for (const a of db.attestations) {
    if (!attestBySlip.has(a.slip_id)) attestBySlip.set(a.slip_id, []);
    attestBySlip.get(a.slip_id).push(a);
  }
  const vgBySlip = new Map();
  for (const vg of db.variant_groups) {
    if (!vgBySlip.has(vg.slip_id)) vgBySlip.set(vg.slip_id, []);
    vgBySlip.get(vg.slip_id).push(vg);
  }
  const vgMemberBySlip = new Map();
  for (const [slip, vgs] of vgBySlip) {
    const members = new Set();
    for (const vg of vgs) for (const aid of vg.attestation_ids) members.add(aid);
    vgMemberBySlip.set(slip, members);
  }

  for (const [slipId, atts] of attestBySlip) {
    const distinct = new Set(atts.map((a) => normalizeText(a.source_text)));
    if (distinct.size > 1) {
      const members = vgMemberBySlip.get(slipId) || new Set();
      const uncovered = atts.filter((a) => !members.has(a.attestation_id));
      if (uncovered.length > 0) {
        errors.push(`slip ${slipId}: ${distinct.size} distinct normalized texts but attestation(s) not covered by any variant_group: ${uncovered.map((a) => a.attestation_id).join(", ")}`);
      }
    }
  }

  // ---- 4. status derivation & structural enforcement ----
  // For each text_authenticity claim on a slip, check structural support.
  const sourceById = idMaps.sources;
  for (const c of db.claims) {
    if (c.claim_type !== "text_authenticity" || c.target_type !== "slip") continue;
    const slipId = c.target_id;
    const atts = attestBySlip.get(slipId) || [];
    const attsById = new Map(atts.map((a) => [a.attestation_id, a]));
    const groups = db.attestations.filter((a) => a.slip_id === slipId);

    const normGroups = new Map();
    for (const a of groups) {
      const key = normalizeText(a.source_text);
      if (!normGroups.has(key)) normGroups.set(key, []);
      normGroups.get(key).push(a);
    }
    // canonical (largest) group
    let canon = [];
    for (const g of normGroups.values()) if (g.length > canon.length) canon = g;

    const independent = canon.filter((a) => {
      const src = sourceById.get(a.source_id);
      if (!src) return false;
      const others = canon.filter((b) => b.source_id !== a.source_id).map((b) => sourceById.get(b.source_id));
      return others.some((os) => os && os.edition_family !== src.edition_family && os.temple !== src.temple);
    });
    const firstHand = canon.filter((a) => FIRST_HAND.has(sourceById.get(a.source_id)?.media_type));
    const verbatim = canon.filter((a) => a.text_status === "verbatim_confirmed");
    const structuralVerified = canon.length >= 2 && independent.length >= 2 && firstHand.length >= 1 && verbatim.length === canon.length;
    // probable: >=1 first-hand verbatim, OR the largest identical-text family is attested by >=2 distinct sources.
    // (A slip may legitimately carry multiple documented text families; divergence is handled by variant_groups.)
    const canonSources = new Set(canon.map((a) => a.source_id));
    const structuralProbable = (firstHand.length >= 1 && verbatim.length >= 1) || (canon.length >= 2 && canonSources.size >= 2);

    // quarantine source check on any claim of this slip
    const anyQuarantineSource = groups.some((a) => {
      const src = sourceById.get(a.source_id);
      return src && (src.content_class === QUARANTINE_CLASS || src.license_status === "no");
    });

    if (c.status === "verified" && anyQuarantineSource) {
      errors.push(`claim ${c.claim_id}: slip ${slipId} has a quarantine-class source; verified is impossible`);
    }
    if (c.status === "verified" && !structuralVerified) {
      errors.push(`claim ${c.claim_id}: slip ${slipId} claims verified but v1 evidence policy not met (need >=2 independent sources with identical normalized text, >=1 first-hand, all verbatim_confirmed; got canon=${canon.length} independent=${independent.length} firstHand=${firstHand.length} verbatim=${verbatim.length})`);
    }
    if (c.status === "probable" && !structuralProbable && !structuralVerified) {
      errors.push(`claim ${c.claim_id}: slip ${slipId} claims probable but no structural support (need >=1 first-hand verbatim, or >=2 consistent sources)`);
    }
    // open substantive divergence blocks verified
    if (c.status === "verified") {
      const openDiv = (vgBySlip.get(slipId) || []).some((vg) => vg.relationship === "substantive_divergence" && vg.resolution_status === "none");
      if (openDiv) errors.push(`claim ${c.claim_id}: slip ${slipId} has open substantive divergence; verified blocked`);
    }
  }

  // ---- 5. quarantine enforcement (per claim) ----
  for (const c of db.claims) {
    if (c.target_type === "attestation") {
      const a = idMaps.attestations.get(c.target_id);
      if (a) {
        const src = sourceById.get(a.source_id);
        if (src && (src.content_class === QUARANTINE_CLASS || src.license_status === "no") && c.status !== "quarantine") {
          errors.push(`claim ${c.claim_id}: attestation ${c.target_id} has quarantine-class source; claim status must be quarantine`);
        }
      }
    }
  }

  // ---- derived statuses ----
  const slipStatus = new Map();
  for (const slip of db.slips) {
    const atts = attestBySlip.get(slip.slip_id) || [];
    const claims = db.claims.filter((c) => c.target_type === "slip" && c.target_id === slip.slip_id && c.claim_type === "text_authenticity");
    const hasQuarantine = atts.some((a) => {
      const src = sourceById.get(a.source_id);
      return src && (src.content_class === QUARANTINE_CLASS || src.license_status === "no");
    }) || claims.some((c) => c.status === "quarantine");
    const openDiv = (vgBySlip.get(slip.slip_id) || []).some((vg) => vg.relationship === "substantive_divergence" && vg.resolution_status === "none");
    let status;
    if (hasQuarantine) status = "quarantine";
    else if (claims.some((c) => c.status === "verified") && !openDiv) status = "verified";
    else if (claims.some((c) => c.status === "probable")) status = "probable";
    else if (atts.length > 0) status = "unresolved";
    else status = "no_evidence";
    slipStatus.set(slip.slip_id, { status, atts: atts.length });
  }

  // ---- 6. license gate / draw pool candidates ----
  const refsBySet = new Map();
  for (const r of db.reference_editions) {
    if (!refsBySet.has(r.set_id)) refsBySet.set(r.set_id, []);
    refsBySet.get(r.set_id).push(r);
  }
  const drawPool = [];
  for (const slip of db.slips) {
    const st = slipStatus.get(slip.slip_id);
    if (!st || st.status !== "verified") continue;
    const refs = refsBySet.get(slip.set_id) || [];
    const setRef = refs.find((r) => r.attestation_id === undefined || r.attestation_id === null || r.attestation_id === "");
    const override = refs.find((r) => r.attestation_id !== undefined && r.attestation_id !== null && r.attestation_id !== "" && idMaps.attestations.get(r.attestation_id)?.slip_id === slip.slip_id);
    const ref = override || setRef;
    if (!ref) {
      errors.push(`slip ${slip.slip_id}: verified but set ${slip.set_id} has no reference edition designated`);
      continue;
    }
    const refSource = sourceById.get(ref.source_id);
    if (!refSource) {
      errors.push(`slip ${slip.slip_id}: reference source_id missing`);
      continue;
    }
    if (refSource.license_status !== "ok") {
      errors.push(`slip ${slip.slip_id}: verified but reference source "${ref.source_id}" license is ${refSource.license_status} (needs ok for draw pool)`);
      continue;
    }
    const refAtt = override ? idMaps.attestations.get(override.attestation_id) : canonAttestationFor(slip.slip_id, attestBySlip, sourceById);
    drawPool.push({ slip_id: slip.slip_id, set_id: slip.set_id, slip_number: slip.slip_number, traditional_title: slip.traditional_title || null, reference_source: ref.source_id, text: refAtt ? refAtt.source_text : null });
  }

  // ---- report ----
  const counts = { sets: db.sets.length, sources: db.sources.length, slips: db.slips.length, attestations: db.attestations.length, variant_groups: db.variant_groups.length, claims: db.claims.length, interpretations: db.interpretations.length, reference_editions: db.reference_editions.length };
  const statusCounts = { verified: 0, probable: 0, unresolved: 0, quarantine: 0, no_evidence: 0 };
  for (const s of slipStatus.values()) statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;

  console.log("=== Oracle Knowledge Base v1 — audit report ===");
  console.log(`sets:              ${counts.sets}`);
  console.log(`sources:           ${counts.sources}`);
  console.log(`slips:             ${counts.slips}`);
  console.log(`attestations:      ${counts.attestations}`);
  console.log(`variant_groups:    ${counts.variant_groups}`);
  console.log(`claims:            ${counts.claims}`);
  console.log(`interpretations:   ${counts.interpretations}`);
  console.log(`reference_editions:${counts.reference_editions}`);
  console.log("--- slip status (derived) ---");
  for (const [k, v] of Object.entries(statusCounts)) console.log(`  ${k.padEnd(12)} ${v}`);
  console.log(`draw_pool_candidates: ${drawPool.length} (verified + license ok + reference designated)`);
  for (const d of drawPool) console.log(`  - ${d.slip_id} (ref: ${d.reference_source})`);

  if (errors.length) {
    console.error(`\n${errors.length} validation error(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error("\nNo output written.");
    process.exit(1);
  }

  if (EMIT) {
    const out = {
      generated_at: new Date().toISOString(),
      kb_version: "v1",
      note: "PREVIEW ONLY — not wired to the frontend. Draw pool = verified slips with license=ok reference. Provenance intentionally omitted from end-user surface.",
      sets: {},
    };
    for (const slip of db.slips) {
      const st = slipStatus.get(slip.slip_id);
      if (!st || st.status !== "verified") continue;
      const refs = refsBySet.get(slip.set_id) || [];
      const override = refs.find((r) => r.attestation_id !== undefined && r.attestation_id !== null && r.attestation_id !== "" && idMaps.attestations.get(r.attestation_id)?.slip_id === slip.slip_id);
      const ref = override || refs.find((r) => r.attestation_id === undefined || r.attestation_id === null || r.attestation_id === "");
      const refAtt = override ? idMaps.attestations.get(override.attestation_id) : canonAttestationFor(slip.slip_id, attestBySlip, sourceById);
      if (!ref || !refAtt) continue;
      const set = idMaps.sets.get(slip.set_id);
      if (!out.sets[slip.set_id]) out.sets[slip.set_id] = { display_name: set.display_name, deity: set.deity, oracle: [] };
      out.sets[slip.set_id].oracle.push({
        entry_id: slip.slip_id,
        slip_number: slip.slip_number,
        title: slip.traditional_title ? `${slip.slip_number} · ${slip.traditional_title}` : String(slip.slip_number),
        poem: refAtt.source_text,
      });
    }
    const outPath = join(KB_DIR, "draw-pool.preview.json");
    writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
    console.log(`wrote ${outPath}`);
  }

  console.log("OK: KB validates.");
}

function canonAttestationFor(slipId, attestBySlip, sourceById) {
  const atts = attestBySlip.get(slipId) || [];
  if (atts.length === 0) return null;
  const normGroups = new Map();
  for (const a of atts) {
    const key = normalizeText(a.source_text);
    if (!normGroups.has(key)) normGroups.set(key, []);
    normGroups.get(key).push(a);
  }
  let canon = [];
  for (const g of normGroups.values()) if (g.length > canon.length) canon = g;
  // prefer verbatim_confirmed first-hand
  const firstHand = canon.filter((a) => FIRST_HAND.has(sourceById.get(a.source_id)?.media_type) && a.text_status === "verbatim_confirmed");
  return (firstHand[0] || canon[0] || null);
}

main();
