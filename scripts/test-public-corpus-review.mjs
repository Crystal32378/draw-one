import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPublicReview,buildReviewLanding} from './build-corpus-review.mjs';
import {reviewRows} from './serve-corpus-review.mjs';
const rows=reviewRows(),html=buildPublicReview();
const landing=buildReviewLanding();assert.equal(readFileSync('paper/corpus-review.html','utf8'),landing);
for(const c of ['guanyin','guandi','liushijiazi']){const subset=rows.filter(r=>r.corpus===c);const page=readFileSync('paper/corpus-review-'+c+'.html','utf8');assert.equal(page,buildPublicReview(subset,c));assert.equal((page.match(/<article /g)||[]).length,subset.length);assert.ok(landing.includes('corpus-review-'+c+'.html'));assert.ok(!page.includes('https://github.com/Crystal32378/draw-one'));}

assert.equal((html.match(/<article /g)||[]).length,760);
for(const r of rows.filter(r=>r.corpus==='liushijiazi'&&!['卦名','五行方位'].includes(r.field_type))){
 const h=buildPublicReview([{...r,verbatim_text:'UNPUBLISHED_MODERN_TEXT',variants_or_notes:'UNPUBLISHED_NOTE',review_hold:{note:'UNPUBLISHED_HOLD'}}]);
 assert.ok(!h.includes('UNPUBLISHED_'));
}
assert.ok(html.includes('得忍且忍。得耐且耐。身不用忙。功名自在。'));
assert.ok(landing.includes('到 GitHub 專案參與校對'));
assert.equal((landing.match(/href="https:\/\/github.com\/Crystal32378\/draw-one"/g)||[]).length,1);
assert.ok(!html.includes('/issues/new'));
assert.ok(!html.match(/<article[\s\S]*?href="https:\/\/github.com/));
assert.ok(html.includes('role="status"'));
assert.ok(!buildPublicReview([{...rows[0],verbatim_text:'<img onerror=alert(1)>'}]).includes('<img onerror'));
console.log('PASS: deterministic760-field public-review candidate; Jiazi240 other raw/diagnostic fields excluded,120 short candidates visible; one general project contribution link; text escaping.');

assert.ok(buildPublicReview(rows.filter(r=>r.corpus==='liushijiazi'&&r.slip_no===59&&r.field_type==='籤閣聖意')).includes('結構性缺欄'));

assert.equal((html.match(/原圖欄位轉錄候選 · /g)||[]).length,120);assert.ok(buildPublicReview(rows.filter(r=>r.corpus==='liushijiazi'&&r.slip_no===54&&r.field_type==='卦名')).includes('孤燈寂寂夜沉沉'));
const {compactLocator,reviewStage}=await import('./build-corpus-review.mjs');
const q2=rows.find(r=>r.corpus==='guanyin'&&r.slip_no===2&&r.field_type==='解曰');
assert.equal(compactLocator(q2),'p179');
assert.equal(reviewStage({...q2,manual_image_confirmation:false,transcription_status:'PROBABLE'}),'待初校');
assert.equal(reviewStage({...q2,manual_image_confirmation:true}),'1校（有人工核圖紀錄）');
for(const c of ['guanyin','guandi','liushijiazi']){
 const page=readFileSync('paper/corpus-review-'+c+'.html','utf8');
 assert.equal((page.match(/<p class="source">來源：/g)||[]).length,1);
 assert.ok(page.includes('data-source-locator='));assert.ok(page.includes('data-transcription-status='));
}
console.log('PASS: shared citation once per corpus, Guanyin p179 compact locator, full metadata retained, no OCR/PROBABLE promotion to first human review.');
const {parseLotQuery,matchesReview}=await import('./build-corpus-review.mjs');
for(const q of ['5','第5籤','第五籤','五','第５籤'])assert.equal(parseLotQuery(q),5);
assert.equal(parseLotQuery('第十五籤'),15);assert.equal(parseLotQuery('第一百籤'),100);assert.equal(parseLotQuery('九十九'),99);assert.equal(parseLotQuery('門庭'),null);
assert.ok(matchesReview({slip:'5',stage:'first',text:'門庭清吉'},'第五籤','first'));
assert.ok(matchesReview({slip:'8',stage:'second',text:'門庭清吉'},'門庭','second'));
assert.ok(!matchesReview({slip:'5',stage:'first',text:'門庭清吉'},'門庭','second'));
assert.ok(!matchesReview({slip:'5',stage:'first',text:'門庭清吉'},'不存在文字',''));
for(const r of rows){const h=buildPublicReview([r],r.corpus);assert.ok(h.includes('data-review-stage="'+(r.manual_image_confirmation===true?'second':'first')+'"'));}
assert.ok(html.includes('id="empty" hidden'));assert.ok(html.includes('type="reset"'));
console.log('PASS: Arabic/full-width/Chinese lot lookup, phrase/status combinations, honest stages, empty/reset controls.');
for(const corpus of ['guanyin','guandi','liushijiazi']){
 const page=readFileSync('paper/corpus-review-'+corpus+'.html','utf8');
 assert.equal((page.match(/class="slip-group"/g)||[]).length,corpus==='liushijiazi'?60:100);
 assert.ok(page.includes('grid-template-columns:var(--review-cols,64px minmax(0,.9fr) minmax(0,1fr) minmax(0,1.4fr) minmax(0,1fr))'));
 assert.ok(page.includes('@media(max-width:1100px)'));
 const poems=JSON.parse(readFileSync('data/corpora/'+corpus+'/slip_texts.json','utf8')).slips;
 for(const poem of poems)assert.ok(page.includes(poem.poem_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')));
}
const jiaziPage=readFileSync('paper/corpus-review-liushijiazi.html','utf8');
const official=JSON.parse(readFileSync('data/corpora/liushijiazi/attestations.json','utf8')).filter(a=>a.source_id==='src-beigang-official');
for(const a of official)assert.ok(jiaziPage.includes(a.item_url));
console.log('PASS:260 exact poem comparison groups,760 fields retained, responsive three columns, official60image links not guessed.');

for(const c of ['guanyin','guandi','liushijiazi']){const p=readFileSync('paper/corpus-review-'+c+'.html','utf8');assert.ok(p.includes('class="table-header"'));assert.equal((p.match(/class="field-note"/g)||[]).length,c==='liushijiazi'?360:200);}

assert.equal((html.match(/type="checkbox" data-column=/g)||[]).length,4);assert.ok(html.includes('只改畫面，不改資料'));assert.ok(html.includes("el.hidden=!c.checked"));assert.ok(!html.includes('localStorage.setItem'));
