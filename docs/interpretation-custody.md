# Public Jieyue release and private research custody

The existing 94-entry Guanyin 解曰 layer remains public. It is a collapsed footnote
under the original slip, with the same text, edition/version guard, and interaction.
This migration changes custody and verification, not the public feature.

## Public consumer contract

The public repository retains:

- `assets/interpretation-pool.guanyin.js`: the accepted 94-entry release;
- `assets/jieyue-guard.js`: the unchanged edition/version display guard;
- `data/production/interpretation-release.manifest.json`: release fingerprints;
- `scripts/test-interpretation-pool.mjs`: release and UI-wiring checks;
- `scripts/test-interpretation-boundary.mjs`: research-custody regression.

Run both checks with Node. They require no private repository, research sources,
API keys, package installation, or network access. `truth-layer` CI runs them along
with the existing draw-pool regression and deterministic draw-pool rebuild.

The draw-pool `interpretation: null` contract remains unchanged. The separate 解曰
footnote is preserved; this is not an AI interpretation or a new release of research.

## Private producer contract

The interpretation-layer package’s source files, source-validation evidence, per-source custody inputs,
the interpretation producer, and its mutation/rebuild tests belong in the private
`Crystal32378/draw-one-research` repository. Source tests continue there; they have
not been discarded to make public CI pass. The private package retains a pinned
copy of this accepted public artifact so it can prove a byte-identical rebuild.

For a future content revision, validate private sources and hostile cases first,
then propose the resulting public artifact, consumer version guard, and public
release manifest together in a separate reviewed PR. Never regenerate source
custody silently. Passing public fingerprints alone does not validate new sources.

## Merge order and historical limits

Merge the corresponding private preservation PR and verify its saved files before
merging this public removal PR. The latest source documentation and producer
dependencies are included in the private supplement; the original snapshot remains
in the private Git history.

Removing files from the current public tree does not erase earlier public commits,
branches, forks, or caches. Other research directories and production corpus inputs are outside this PR.
This change does not rewrite history, delete old
branches, or claim that previously published material has become confidential.
