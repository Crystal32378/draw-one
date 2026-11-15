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
// 2026-11-15：關帝籤詩另有一批「人眼核圖裁定」的字級修正（data/corpora/guandi/poem_corrections.json 的 applied）。
// 允許變動的 id 只有：乙未／戊午兩支＋這份帳上 applied 的籤；pending 的籤一個字都不准動。
const guandiLedger = JSON.parse(read('data/corpora/guandi/poem_corrections.json'));
const guandiId = n => `guandi-${String(n).padStart(3, '0')}`;
const guandiAfter = new Map(guandiLedger.applied.map(r => [guandiId(r.slip_number), r]));
const guandiPending = new Set(guandiLedger.pending.map(r => guandiId(r.slip_number)).filter(id => !guandiAfter.has(id)));
const mayChange = new Set(['liushijiazi-010', 'liushijiazi-028', ...guandiAfter.keys()]);
for (const old of before.entries) {
  const entry = after.entries.find(e => e.id === old.id);
  const changes = Object.keys(old).filter(key => JSON.stringify(old[key]) !== JSON.stringify(entry[key]));
  assert.deepEqual(changes, mayChange.has(old.id) ? ['historical_text'] : [], old.id);
  if (guandiAfter.has(old.id)) {
    const row = guandiAfter.get(old.id);
    assert.equal(old.historical_text.poem_text, row.poem_before, old.id + ' before');
    assert.equal(entry.historical_text.poem_text, row.poem_after, old.id + ' after');
    const inner = Object.keys(old.historical_text).filter(k => JSON.stringify(old.historical_text[k]) !== JSON.stringify(entry.historical_text[k]));
    assert.deepEqual(inner, ['poem_text'], old.id + ': only the poem text may differ');
    assert.equal(JSON.stringify(old.provenance), JSON.stringify(entry.provenance), old.id + ': status/provenance untouched');
  }
  if (guandiPending.has(old.id)) assert.equal(JSON.stringify(old), JSON.stringify(entry), old.id + ' is pending and must be untouched');
}

// Seed old-version fictional book + bindings. Resolve a repeated normalized
// question from another hall; then run the actual showSlip function over a DOM
// stub to verify note restoration and the newly sourced poem for the SAME id.
const html = read('paper/arrival.html');
const showSlip = html.slice(html.indexOf('  function showSlip('), html.indexOf('  // 解曰 摺頁'));
assert.ok(showSlip.startsWith('  function showSlip('));
// 入廟 ink／PR #32 整合後：showSlip 會呼叫 ensureBookEntry（紙落定即入簿）。舊紀錄已在簿中時它不得新增或改寫
// 籤簿與 bindings；唯一允許的寫入是「上次走進哪一殿」的標記（LASTHALL）。主線（無此函式）則維持零寫入。
const eb0 = html.indexOf('  function ensureBookEntry(');
const ensureBookEntry = eb0 < 0 ? '' : html.slice(eb0, html.indexOf('\n  }\n', eb0) + 5);
for (const [corpus, number] of [['liushijiazi', 10], ['liushijiazi', 28], ['guandi', 74]]) {
  const id = `${corpus}-${String(number).padStart(3, '0')}`;
  const question = `虛構相容性測試 ${number}`;
  const record = {entryId:id, corpusId:corpus, question, note:`虛構私人筆記 ${number}`, ts:'2026-08-20T00:00:00.000Z'};
  const book = JSON.stringify([record]);
  const storage = new Map([['drawone.book.v1', book]]);
  const storageAPI = {getItem:key => storage.get(key) ?? null, setItem:() => {throw Error('Unexpected storage write');}};
  const window = {localStorage:storageAPI, sessionStorage:storageAPI};
  vm.runInNewContext(read('assets/draw-policy.js'), {window});
  const key = window.DRAW_POLICY.questionKey(question);
  storage.set('drawone.bindings.v2', JSON.stringify({[key]:[{entry_id:id, corpus_id:corpus, question_normalized:question, bound_at:record.ts}]}));
  const frozen = JSON.stringify([...storage]);
  const binding = window.DRAW_POLICY.resolveDraw({question:`  ${question}　`, corpusId:corpus === 'guandi' ? 'guanyin' : 'guandi', drawFn:() => {throw Error('Must not redraw');}});
  assert.equal(binding.entryId, id);
  assert.equal(binding.boundCorpusId, corpus);
  assert.equal(binding.repeated, true);
  const nodes = {};
  const $ = id => nodes[id] ??= {style:{}, scrollIntoView(){}, appendChild(){}, classList:{add(){}, remove(){}, toggle(){}, contains(){return false;}}}; // classList：入廟 ink 分支的 showSlip 會切殿內 reading 狀態（僅樣式）
  $('question').value = question;
  let mounted;
  window.SLIP_RENDER = {mountSlip:(_, entry) => {mounted = entry.historical_text.poem_text;}};
  const writes = [];
  const context = {window, $, store:{get:(key, fallback) => JSON.parse(storage.get(key) ?? 'null') ?? fallback, set:(key) => { writes.push(key); }}, BOOK_KEY:'drawone.book.v1', LASTHALL_KEY:'__lasthall__', currentHall:{id:'mazu'}, cnNum:String, Date, reduceMotion:true, renderJieyue(){}, currentTakeawayTs:null, currentResolved:null};
  vm.createContext(context);
  vm.runInContext(ensureBookEntry + '\n' + showSlip + '\nthis.showSlip = showSlip;', context);
  context.showSlip(after.entries.find(e => e.id === id), {repeated:true});
  assert.equal($('noteInput').value, record.note);
  assert.equal(context.currentTakeawayTs, record.ts);
  assert.equal(context.currentResolved.entryId, id);
  assert.equal($('takeawayZone').hidden, false);
  assert.equal(mounted, after.entries.find(e => e.id === id).historical_text.poem_text);
  assert.equal(JSON.stringify([...storage]), frozen);
  assert.ok(writes.every(k => k === '__lasthall__'), 'only the last-hall marker may be written: ' + writes.join());
}
console.log(`PASS: all 260 ids stable; only 乙未／戊午 + ${guandiAfter.size} adjudicated Guandi poem payloads changed (${guandiPending.size} pending slips untouched);`,' old fictional books/notes/bindings restore, cross-hall repeat never redraws, zero storage writes (offline VM scope)');
