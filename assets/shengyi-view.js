// Historical source text, not personalized divination or medical advice.
(function(){'use strict';
 function resolve(pool,entry){
  if(!pool||pool.schema!=='shengyi-candidates/1'||!entry||!['guanyin','guandi','liushijiazi'].includes(entry.corpus_id))return null;
  const r=pool.entries?.[entry.id];
  if(!r||r.id!==entry.id||r.corpus_id!==entry.corpus_id||r.slip_number!==entry.slip_number||r.field!=='聖意'||r.expected_slip_edition!==entry.provenance?.edition_title||!pool.status_word[r.status])return null;
  return r;
 }
 function render(pool,entry,host){
  host.replaceChildren();host.hidden=true;const r=resolve(pool,entry);if(!r)return false;
  const el=(tag,text)=>{const x=document.createElement(tag);x.textContent=text;return x;};
  // 標題分兩段（詞＋狀態），讓前台能照解曰那一行的層次排；文字內容不變。
  const detail=document.createElement('details'),summary=document.createElement('summary'),word=el('span','聖意'),prov=el('span','・'+pool.status_word[r.status]+(r.notes?'・轉錄有疑點':''));word.className='sy-word';prov.className='sy-prov';summary.append(word,prov);detail.append(summary);
  const text=el('p',r.text||'原圖有聖意格，現有轉錄誤取旁文；待重新轉錄。');text.className='jieyue-text';text.style.whiteSpace='pre-wrap';detail.append(text);
  if(r.display_selection){const selection=el('p',r.display_selection.unresolved?'欄位轉錄待補':'部分欄位候選・已分離誤入旁文');selection.className='jieyue-about';detail.append(selection);}
  const locator=r.corpus_id==='liushijiazi'?'北港朝天宮官方籤詩圖檔・第'+r.slip_number+'籤':r.corpus_id==='guandi'?'同解曰所據道藏本・維基文庫轉錄・第'+r.slip_number+'籤':(function(){const pg=String(r.locator).match(/\bp\d{2,3}\b/);return pg?'同解曰所據籤紙影像・附錄二 '+pg[0]:r.source+'｜'+r.locator;})();
  const src=el('p','來源：'+locator);src.className='jieyue-src';detail.append(src);
  const note=el('p','歷史文本，非個人預測或醫療建議。');note.className='jieyue-about';detail.append(note);
  if(r.corpus_id==='liushijiazi'){const url=r.locator.match(/https:\/\/www\.matsu\.org\.tw\/[^<>\s]+/);if(url){const sourceLink=el('a','對照廟方原圖 ↗');sourceLink.href=url[0];sourceLink.className='jieyue-link';detail.append(sourceLink);}}
  const link=el('a','到校對館看來源與疑字 ↗');link.href='/paper/corpus-review-'+r.corpus_id+'.html?q='+r.slip_number;link.className='jieyue-link';detail.append(link);
  host.append(detail);host.hidden=false;return true;
 }
 window.SHENGYI_VIEW={resolve,render};
})();
