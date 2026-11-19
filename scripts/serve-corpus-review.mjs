// PRIVATE, loopback-only proofreader. Never export this view to public hosting.
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(resolve(ROOT,p),'utf8'));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reviewRows(){
 const holds=new Map(read('data/corpora/guandi/jieyue_holds.json').holds.map(h=>[h.slip_no,h]));
 return ['guanyin','guandi','liushijiazi'].flatMap(c=>read(`data/corpora/${c}/interpretation_layer.json`).entries.map(e=>({...e,
 review_hold:c==='guandi'&&e.field_type==='解曰'?holds.get(e.slip_no)??null:null,
 rights_note:c==='liushijiazi'?'現代官方圖檔是本次見證來源，不等於每欄皆為現代創作。卦名／五行方位等傳統短語與較長解說須分開核實；逐欄權利判定未完成，僅本機校讀，不宣稱全部禁止或全部可公開。':'歷史／傳承文本候選；轉錄疑義與再利用權利分開判斷，本頁不宣稱整套已核准公開。',
 metadata_audit_note:c==='liushijiazi'&&e.slip_no===1&&['籤閣聖意','卦運勢'].includes(e.field_type)
 ?'來源核圖回報：第 1 籤此欄原圖標題為「'+(e.field_type==='籤閣聖意'?'籤圖寓意':'乾卦運勢')+'」。目前保留資料庫原欄名供對照；尚未逐籤核對，不代表其餘 59 籤相同。':null,
 review_only:true})));}
export function candidates(rows=reviewRows()){
 // Exact candidate strings, not corrections, status upgrades or production custody tokens.
 return Object.fromEntries(rows.filter(e=>e.corpus!=='liushijiazi'&&e.field_type==='解曰').map(e=>[`${e.corpus}-${String(e.slip_no).padStart(3,'0')}`,e]));
}
const client=String.raw`
window.renderLocalCandidate=function(entry){
 const r=window.LOCAL_REVIEW_CANDIDATES[entry.id];if(!r||r.corpus!==entry.corpus_id)return false;
 const $=id=>document.getElementById(id);$('jieyue').hidden=false;
 $('jieyueToggle').setAttribute('aria-expanded','false');$('jieyueBody').hidden=true;
 $('jieyue').querySelector('.jieyue-caret').textContent='▸';
 $('jieyueWord').textContent='解曰';$('jieyueProv').textContent=({VERIFIED:'已對勘',PROBABLE:'待複核',UNRESOLVED:'有疑字・待核對',CANDIDATE:'候選讀法・待核對'})[r.transcription_status]||'待核對';
 $('jieyueText').hidden=false;$('jieyueText').textContent=r.verbatim_text;
 $('jieyueSrc').hidden=false;$('jieyueSrc').textContent='來源：'+r.edition+'\n'+r.source_locator;
 $('jieyueAbout').hidden=true;$('jieyueAbout').classList.remove('is-lead');
 $('jieyueAbout').textContent='';
 $('jieyueLink').hidden=false;$('jieyueLink').href='/review?corpus='+encodeURIComponent(r.corpus)+'&slip='+r.slip_no;$('jieyueLink').textContent='查看校對資料';return true;
};`;
export function previewHTML(html){
 const data=JSON.stringify(candidates()).replace(/</g,'\\u003c');
 return html.replace('<head>','<head><meta name="robots" content="noindex,nofollow">')
 .replace('  function renderJieyue(entry) {','  function renderJieyue(entry) {\n    if(window.renderLocalCandidate(entry)) return;')
 .replace('        chron.appendChild(b);',`        chron.appendChild(b);
        const reviewLink=document.createElement('a');reviewLink.href='/paper/corpus-review.html';reviewLink.textContent='徵求校對助手';reviewLink.addEventListener('pointerdown',ev=>ev.stopPropagation());reviewLink.style.cssText='display:block;margin:8px auto 0;font-size:12px;color:inherit;opacity:.7;text-decoration:none';chron.appendChild(reviewLink);`)
 .replace('</head>',`<script>window.LOCAL_REVIEW_CANDIDATES=${data};${client}</script></head>`)
 .replace('<body>','<body><a href="/review" style="position:fixed;z-index:99999;right:4px;top:4px;background:#fff;color:#700;padding:4px;font:12px sans-serif">校讀預覽</a>');
}
export function reviewHTML(rows,query=new URLSearchParams()){
 const corpus=query.get('corpus')||'',slip=query.get('slip')||'';
 const filtered=rows.filter(r=>(!corpus||r.corpus===corpus)&&(!slip||String(r.slip_no)===slip));
 return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>三組籤詩本機校讀</title><style>body{max-width:920px;margin:2em auto;padding:0 1em;font:18px/1.7 system-ui;background:#faf7f0}article{border-top:1px solid #aaa;padding:1em 0}pre{white-space:pre-wrap;font:inherit}small{display:block;color:#644}summary{cursor:pointer}input,select,button{font:inherit;max-width:100%}</style><h1>本機校讀・不是正式發布</h1><p>全部 ${rows.length} 欄可見；本次篩選 ${filtered.length} 欄。保留來源原字、OCR 缺字及狀態，不以顯示代表核定。聖意是歷史資料，不是健康、懷孕或其他決策建議。六十甲子現代解說僅本機核對，未授權公開轉載。</p><a href="/paper/arrival.html">回到抽籤預覽</a><details id="help" open><summary>徵求校對助手</summary><p>選籤組和籤號，對照下方原文、來源頁碼與疑字。如果找到不同讀法，請把籤組／籤號、原字、建議讀法、來源頁碼或影像位置交給 Crystal。尚未設線上投稿後台；本頁不會自動送出或儲存。請勿把權利未明的完整長文貼到公開平台。</p><label for="reviewDraft">校對回報草稿（可選取複製）</label><textarea id="reviewDraft" rows="7" style="display:block;width:100%;box-sizing:border-box;font:inherit">籤組／籤號：
欄位：
原字／疑字：
建議讀法：
來源、頁碼或影像位置：
核對方式：</textarea></details><form><select name="corpus"><option value="">全部</option>${['guanyin','guandi','liushijiazi'].map(c=>`<option ${c===corpus?'selected':''}>${c}</option>`).join('')}</select><input name="slip" type="number" min="1" max="100" placeholder="籤號" value="${escape(slip)}"><button>篩選</button></form>${filtered.map(r=>`<article><h2>${escape(r.corpus)} #${r.slip_no} ${escape(r.field_type)}</h2><small>${escape(r.transcription_status)}｜人工核圖：${r.manual_image_confirmation===true?'來源記載是（不代表整套核定）':'未記載確認'}｜${escape(r.source_observation_status||'未記載觀察方式')}</small><p>${escape(r.metadata_audit_note||'')}</p><pre>${escape(r.verbatim_text)||'（原欄空白，未補寫）'}</pre><small>來源：${escape(r.edition)}<br>${escape(r.source_locator)}<br>${escape(r.rights_note)}</small><details><summary>疑義、異讀與暫緩原因</summary><pre>${escape(r.review_hold?JSON.stringify(r.review_hold,null,2):'')}${escape(r.variants_or_notes)}\n${escape(r.unresolved_reason_code)}</pre></details></article>`).join('')}</html>`;
}
export function createReviewServer(){return createServer((req,res)=>{
 const host=req.headers.host||'';
 if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)||!['GET','HEAD'].includes(req.method)){res.writeHead(403);return res.end('Local read-only preview only');}
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Content-Security-Policy',"frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 try {const u=new URL(req.url,'http://127.0.0.1');let body,type='text/html; charset=utf-8';
 if(u.pathname==='/review')body=reviewHTML(reviewRows(),u.searchParams);
 else if(u.pathname==='/'||u.pathname==='/paper/arrival.html')body=previewHTML(readFileSync(resolve(ROOT,'paper/arrival.html'),'utf8'));
 else {if(!/^\/(assets|paper)\/[a-zA-Z0-9_./-]+$/.test(u.pathname)||u.pathname.includes('..'))throw Error('not found');const p=resolve(ROOT,'.'+u.pathname);body=readFileSync(p);type=({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.html':'text/html'})[extname(p)]||'application/octet-stream';}
 res.setHeader('Content-Type',type);res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404);res.end('Not found');}
});}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8777);createReviewServer().listen(port,'127.0.0.1',()=>console.log(`PRIVATE review: http://127.0.0.1:${port}/paper/arrival.html and /review — no public tunnel/export`));
}
