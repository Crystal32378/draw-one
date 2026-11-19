import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {buildShengyi,sourceRows} from './build-shengyi-pool.mjs';
const pool=buildShengyi(),sandbox={window:{}};vm.runInNewContext(readFileSync('assets/shengyi-pool.js','utf8'),sandbox);vm.runInNewContext(readFileSync('assets/shengyi-view.js','utf8'),sandbox);assert.equal(JSON.stringify(sandbox.window.SHENGYI_POOL),JSON.stringify(pool));
assert.equal(Object.keys(pool.entries).length,260);
for(const c of ['guanyin','guandi'])for(const row of sourceRows(c)){
 const id=c+'-'+String(row.slip_no).padStart(3,'0'),r=pool.entries[id];assert.equal(r.text,row.verbatim_text);assert.equal(r.status,row.transcription_status);assert.equal(r.locator,row.source_locator);
 const entry={id,corpus_id:c,slip_number:row.slip_no,provenance:{edition_title:r.expected_slip_edition}};
 assert.ok(sandbox.window.SHENGYI_VIEW.resolve(pool,entry));
 assert.equal(sandbox.window.SHENGYI_VIEW.resolve(pool,{...entry,slip_number:row.slip_no+1}),null);
 assert.equal(sandbox.window.SHENGYI_VIEW.resolve(pool,{...entry,provenance:{edition_title:'other'}}),null);
}
const changed={guanyin:sourceRows('guanyin'),guandi:sourceRows('guandi'),liushijiazi:sourceRows('liushijiazi')};[changed.guanyin[0].verbatim_text,changed.guanyin[1].verbatim_text]=[changed.guanyin[1].verbatim_text,changed.guanyin[0].verbatim_text];assert.throws(()=>buildShengyi(changed),/source identity changed/);
assert.equal(sandbox.window.SHENGYI_VIEW.resolve(pool,{corpus_id:'liushijiazi'}),null);
const html=readFileSync('paper/arrival.html','utf8');assert.ok(html.includes('window.SHENGYI_VIEW.render(window.SHENGYI_POOL'));assert.ok(html.includes('src="../assets/shengyi-pool.js'));assert.ok(html.includes('src="../assets/shengyi-view.js'));
// 飛寶 2026-11-16：聖意腳本缺席或出錯，只能讓聖意那一格空著，不能拖垮解曰與收籤。
assert.ok(/try \{\s*if \(!window\.SHENGYI_VIEW \|\| !window\.SHENGYI_VIEW\.render\(window\.SHENGYI_POOL, entry, sy\)\) \{ sy\.replaceChildren\(\); sy\.hidden = true; \}\s*\} catch \{/.test(html));
console.log('PASS:200 exact聖意 candidates, source/status preserved; swapped source fails build, wrong corpus/slip/edition fails runtime; real app integration present.');
// DOM-safe rendering and stale-record cleanup, without HTML interpolation.
function node(tag){return {tag,children:[],hidden:false,textContent:'',style:{},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;}};}
sandbox.document={createElement:node};const host=node('section');
const first=pool.entries['guanyin-001'];const entry={id:first.id,corpus_id:first.corpus_id,slip_number:first.slip_number,provenance:{edition_title:first.expected_slip_edition}};
assert.equal(sandbox.window.SHENGYI_VIEW.render(pool,entry,host),true);assert.equal(host.hidden,false);assert.equal(host.children[0].tag,'details');assert.equal(host.children[0].children[1].textContent,first.text);
assert.ok(host.children[0].children.at(-1).href.startsWith('/paper/'));
assert.equal(sandbox.window.SHENGYI_VIEW.render(pool,{...entry,corpus_id:'unknown'},host),false);assert.equal(host.hidden,true);assert.equal(host.children.length,0);
console.log('PASS: native collapsed details renders exact text via textContent, source link is root-safe; unknown next slip clears previous candidate.');
const short=sourceRows('liushijiazi');
for(const row of short){const r=pool.entries['liushijiazi-'+String(row.slip_no).padStart(3,'0')];
 if(row.slip_no===39){assert.equal(r.display_selection,null);assert.ok(r.text.startsWith('討海：先不利後小利')&&r.text.endsWith('求雨：未有')&&r.text.split('\n').length===27,'第 39 籤：依原圖重抄的 27 項聖意格');}
 if([31,33,41].includes(row.slip_no)){assert.equal(r.text,row.verbatim_text.split(r.display_selection.before)[0]);assert.ok(r.display_selection.note);}else assert.equal(r.text,row.verbatim_text);
 assert.equal(r.status,row.transcription_status);assert.equal(r.confirmed,false);
 const e={id:r.id,corpus_id:r.corpus_id,slip_number:r.slip_number,provenance:{edition_title:r.expected_slip_edition}};assert.ok(sandbox.window.SHENGYI_VIEW.resolve(pool,e));
}
for(const n of [22,25,32,42])assert.ok(pool.entries['liushijiazi-'+String(n).padStart(3,'0')].text.includes('□'));
assert.ok(!JSON.stringify(pool.entries['liushijiazi-039']).includes('若想求神仙之路'));
assert.ok(html.includes('const aboutText = "";'));
console.log('PASS:Jiazi57whole+3explicit exact prefixes (#39 re-transcribed from the original scan, old misfiled text never shown); no OCR completion, status upgrade or long-field leakage; compact reading.');

assert.ok(html.includes('#s-hall.reading { scroll-padding-bottom: calc(100px + env(safe-area-inset-bottom)); }'));
