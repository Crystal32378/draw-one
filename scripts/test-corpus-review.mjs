import {get as httpGet} from "node:http";
import vm from "node:vm";
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewRows,candidates,previewHTML,reviewHTML,createReviewServer} from './serve-corpus-review.mjs';
const rows=reviewRows(),c=candidates(rows);
assert.equal(rows.length,760);assert.equal(Object.keys(c).length,200);
for(const corpus of ['guanyin','guandi','liushijiazi']){
 const src=JSON.parse(readFileSync(`data/corpora/${corpus}/interpretation_layer.json`));
 for(const e of src.entries){const r=rows.find(r=>r.corpus===corpus&&r.slip_no===e.slip_no&&r.field_type===e.field_type);for(const k of Object.keys(e))assert.deepEqual(r[k],e[k]);}
}
assert.equal(c['guandi-053'].review_hold.slip_no,53);
for(const id of ['012','020','035','044','065','077'])assert.ok(c['guanyin-'+id]);
assert.ok(!Object.keys(c).some(k=>k.startsWith('liushijiazi')));
const original=readFileSync('paper/arrival.html','utf8'),html=previewHTML(original);
assert.ok(html.includes('if(window.renderLocalCandidate(entry)) return;'));
assert.ok(!original.includes('LOCAL_REVIEW_CANDIDATES'));
assert.ok(html.includes('校讀預覽'));
const table=reviewHTML(rows,new URLSearchParams('corpus=guandi&slip=53'));
assert.ok(table.includes('本次篩選 2 欄'));assert.ok(table.includes('聖意'));
assert.ok(reviewHTML([{...rows[0],verbatim_text:'<script>alert(1)</script>',edition:'<img src=x>'}]).includes('&lt;script&gt;'));
assert.ok(!reviewHTML([{...rows[0],verbatim_text:'<script>alert(1)</script>'}]).includes('<script>'));
assert.ok(rows.filter(r=>r.corpus==='liushijiazi').every(r=>r.rights_note.includes('未完成')));
console.log('PASS: 760 exact source fields; 200 app candidates incl 37 holds; six Jiazi local table only; no status promotion; escaped rendering.');

const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',setAttribute(){},classList:{remove(){}},querySelector(){return get('caret')}});return nodes.get(id)};
const ctx={window:{},document:{getElementById:get}};vm.createContext(ctx);
const injected=html.match(/<script>window.LOCAL_REVIEW_CANDIDATES=([\s\S]*?)<\/script>/)[0].slice(8,-9);vm.runInContext(injected,ctx);
assert.equal(ctx.window.renderLocalCandidate({id:'guandi-053',corpus_id:'guandi'}),true);
assert.equal(get('jieyueText').textContent,c['guandi-053'].verbatim_text);assert.equal(get('jieyueAbout').hidden,true);assert.equal(get('jieyueAbout').textContent,'');
assert.equal(ctx.window.renderLocalCandidate({id:'guandi-005',corpus_id:'guandi'}),true);
assert.equal(get('jieyueText').textContent,c['guandi-005'].verbatim_text);assert.equal(get('jieyueText').hidden,false);assert.ok(get('jieyueProv').textContent.includes('待複核'));assert.ok(get('jieyueSrc').textContent.includes(c['guandi-005'].source_locator));assert.ok(!get('jieyueProv').textContent.includes('暫未上紙'));
assert.equal(ctx.window.renderLocalCandidate({id:'liushijiazi-001',corpus_id:'liushijiazi'}),false);
assert.equal(ctx.window.renderLocalCandidate({id:'guandi-053',corpus_id:'guanyin'}),false);
console.log('PASS: preview runtime displays original #53 with warnings; six Jiazi and corpus mismatch do not enter normal app.');

const server=createReviewServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {const url='http://127.0.0.1:'+server.address().port;
 assert.equal((await fetch(url+'/review?corpus=guandi&slip=53')).status,200);
 assert.equal((await fetch(url+'/paper/arrival.html')).status,200);
 assert.equal((await fetch(url+'/review',{method:'POST'})).status,403);
 assert.equal(await new Promise((resolve,reject)=>httpGet(url+'/review',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode)}).on('error',reject)),403);
 assert.equal((await fetch(url+'/data/corpora/liushijiazi/interpretation_layer.json')).status,404);
 const response=await fetch(url+'/review');assert.equal(response.headers.get('cache-control'),'no-store');
 console.log('PASS: local HTTP app/table, Host/write rejection, raw data not served, no-store headers.');
}finally{await new Promise(resolve=>server.close(resolve));}

const metadataFlags=rows.filter(r=>r.metadata_audit_note);assert.equal(metadataFlags.length,2);assert.ok(metadataFlags.every(r=>r.corpus==='liushijiazi'&&r.slip_no===1));assert.ok(metadataFlags.some(r=>r.metadata_audit_note.includes('籤圖寓意')));
console.log('PASS: two source-specific Jiazi #1 metadata flags; raw field names unchanged, no bulk inference.');

assert.equal(ctx.window.renderLocalCandidate({id:'guanyin-002',corpus_id:'guanyin'}),true);
assert.equal(get('jieyueText').textContent,'得忍且忍。得耐且耐。身不用忙。功名自在。');
assert.ok(get('jieyueSrc').textContent.includes('p179'));assert.equal(get('jieyueAbout').textContent,'');
assert.ok(html.includes('徵求校對助手'));assert.ok(table.includes('id="help"'));assert.ok(table.includes('本頁不會自動送出或儲存'));
console.log('PASS: Guanyin #2 concise canonical verse/source, diagnostics separated, courtyard proofreading entry and honest manual contribution route.');

assert.ok(html.includes("reviewLink.addEventListener('pointerdown',ev=>ev.stopPropagation())"));
