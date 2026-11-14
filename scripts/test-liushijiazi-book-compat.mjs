// Offline VM regression only: no browser profile or real localStorage touched.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(root + path, 'utf8');
function poolFrom(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.DRAW_POOL;
}
const before = poolFrom(execFileSync('git', ['show', '7ae87f6:assets/oracles.draw-pool.js'], {cwd: root, encoding: 'utf8'}));
const after = poolFrom(read('assets/oracles.draw-pool.js'));
assert.equal(before.schema, after.schema);
assert.notEqual(before.content_version, after.content_version);
assert.deepEqual(Array.from(before.entries, e => e.id), Array.from(after.entries, e => e.id));
for (const old of before.entries) {
  const entry = after.entries.find(e => e.id === old.id);
  const changes = Object.keys(old).filter(key => JSON.stringify(old[key]) !== JSON.stringify(entry[key]));
  assert.deepEqual(changes, ['liushijiazi-010', 'liushijiazi-028'].includes(old.id) ? ['historical_text'] : []);
}

// Seed old-version fictional book + bindings. Resolve a repeated normalized
// question from another hall; then run the actual showSlip function over a DOM
// stub to verify note restoration and the newly sourced poem for the SAME id.
const html = read('paper/arrival.html');
const showSlip = html.slice(html.indexOf('  function showSlip('), html.indexOf('  // 解曰 摺頁'));
assert.ok(showSlip.startsWith('  function showSlip('));
for (const number of [10, 28]) {
  const id = `liushijiazi-${String(number).padStart(3, '0')}`;
  const question = `虛構相容性測試 ${number}`;
  const record = {entryId:id, corpusId:'liushijiazi', question, note:`虛構私人筆記 ${number}`, ts:'2026-08-20T00:00:00.000Z'};
  const book = JSON.stringify([record]);
  const storage = new Map([['drawone.book.v1', book]]);
  const storageAPI = {getItem:key => storage.get(key) ?? null, setItem:() => {throw Error('Unexpected storage write');}};
  const window = {localStorage:storageAPI, sessionStorage:storageAPI};
  vm.runInNewContext(read('assets/draw-policy.js'), {window});
  const key = window.DRAW_POLICY.questionKey(question);
  storage.set('drawone.bindings.v2', JSON.stringify({[key]:[{entry_id:id, corpus_id:'liushijiazi', question_normalized:question, bound_at:record.ts}]}));
  const frozen = JSON.stringify([...storage]);
  const binding = window.DRAW_POLICY.resolveDraw({question:`  ${question}　`, corpusId:'guandi', drawFn:() => {throw Error('Must not redraw');}});
  assert.equal(binding.entryId, id);
  assert.equal(binding.boundCorpusId, 'liushijiazi');
  assert.equal(binding.repeated, true);
  const nodes = {};
  const $ = id => nodes[id] ??= {style:{}, scrollIntoView(){}, appendChild(){}};
  $('question').value = question;
  let mounted;
  window.SLIP_RENDER = {mountSlip:(_, entry) => {mounted = entry.historical_text.poem_text;}};
  const context = {window, $, store:{get:(key, fallback) => JSON.parse(storage.get(key) ?? 'null') ?? fallback}, BOOK_KEY:'drawone.book.v1', reduceMotion:true, renderJieyue(){}, currentTakeawayTs:null, currentResolved:null};
  vm.createContext(context);
  vm.runInContext(showSlip + '\nthis.showSlip = showSlip;', context);
  context.showSlip(after.entries.find(e => e.id === id), {repeated:true});
  assert.equal($('noteInput').value, record.note);
  assert.equal(context.currentTakeawayTs, record.ts);
  assert.equal(context.currentResolved.entryId, id);
  assert.equal($('takeawayZone').hidden, false);
  assert.equal(mounted, after.entries.find(e => e.id === id).historical_text.poem_text);
  assert.equal(JSON.stringify([...storage]), frozen);
}
console.log('PASS: all 260 ids stable; only two poem payloads changed; old fictional books/notes/bindings restore, cross-hall repeat never redraws, zero storage writes (offline VM scope)');
