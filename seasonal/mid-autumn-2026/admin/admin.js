const $=s=>document.querySelector(s);
const dateFormat=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',dateStyle:'medium',timeStyle:'short'});
function renderCounts(target,values,total){
 target.replaceChildren();
 for(const [label,count] of Object.entries(values)){
  const row=document.createElement('div');row.className='result-row';
  const name=document.createElement('dt');name.textContent=label;
  const value=document.createElement('dd');value.textContent=`${count} 份 · ${total?Math.round(count/total*100):0}%`;
  const bar=document.createElement('meter');bar.className='result-bar';bar.min=0;bar.max=Math.max(total,1);bar.value=count;bar.setAttribute('aria-label',`${label}：${count} 份`);
  row.append(name,value,bar);target.append(row);
 }
}
function renderResponses(responses){
 $('#responses').replaceChildren();
 for(const response of responses){
  const row=document.createElement('li');row.className='response';
  const head=document.createElement('div');head.className='response-head';
  const q1=document.createElement('span');q1.textContent=`再次使用：${response.q1}`;
  const q2=document.createElement('span');q2.textContent=`最想留下：${response.q2}`;
  const date=document.createElement('time');date.className='response-date';date.dateTime=response.submittedAt;date.textContent=dateFormat.format(new Date(response.submittedAt))+'（台北）';
  head.append(q1,q2,date);
  const text=document.createElement('p');text.className='response-text'+(response.q3?'':' blank');text.textContent=response.q3||'第三題留白';
  row.append(head,text);$('#responses').append(row);
 }
}
async function load(){
 $('#refresh').disabled=true;$('#status').textContent='正在讀取…';$('#error').hidden=true;
 try {
  const response=await fetch('/api/responses',{cache:'no-store',signal:AbortSignal.timeout(10000)});
  const result=await response.json();if(!response.ok||result.ok!==true)throw new Error(result.error||'暫時無法讀取。');
  $('#total').textContent=result.total;
  $('#summary').hidden=false;$('#empty').hidden=result.total!==0;$('#responses-section').hidden=result.total===0;
  renderCounts($('#q1-results'),result.q1,result.total);renderCounts($('#q2-results'),result.q2,result.total);renderResponses(result.responses);
  $('#status').textContent='最近讀取：'+dateFormat.format(new Date())+'（台北）';
 }catch(err){
  $('#summary').hidden=true;$('#responses-section').hidden=true;$('#empty').hidden=true;
  $('#status').textContent='尚未取得最新資料。';
  $('#error').textContent=err.name==='TimeoutError'||err instanceof TypeError?'暫時連不上本機管理服務，請啟動後重試。':err.message;$('#error').hidden=false;
 }finally{$('#refresh').disabled=false;}
}
$('#refresh').addEventListener('click',load);load();
