import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
let html=read('paper/arrival.html');
html=html.replace('<link rel="preconnect" href="https://fonts.googleapis.com" />','');
html=html.replace(/<link href="https:\/\/fonts.googleapis.com[^>]+>/,()=>'<style>'+read('plugin/data/slip-fonts.css')+'</style>');
html=html.replace('<link rel="stylesheet" href="../assets/slip.css?v=3" />','<style>'+read('assets/slip.css')+'</style>');
for(const [file,body] of [['oracles.draw-pool.js',read('plugin/data/oracles.draw-pool.js')],['draw-policy.js',read('assets/draw-policy.js')],['slip-render.js',read('assets/slip-render.js')]]) html=html.replace(`<script src="../assets/${file}?v=3"></script>`,()=>'<script>'+body.replaceAll('</script','<\\/script')+'</script>');
html=html.replace(/<script src="\.\.\/assets\/(interpretation-pool\.guanyin|jieyue-guard)\.js\?v=1"><\/script>\n/g,'');
const bridge=`<script>
window.DRAW_ONE_HOST=(function(){let seq=0;let capabilities={};const pending=new Map();
const rpc=(method,params)=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('連線逾時，請稍後再試。'));},20000);pending.set(id,{resolve,reject,timer});parent.postMessage({jsonrpc:'2.0',id,method,params},'*');});
addEventListener('message',e=>{if(e.source!==parent||e.data?.jsonrpc!=='2.0')return;const m=e.data,p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error('連線失敗，請稍後再試。')):p.resolve(m.result);}});
const ready=rpc('ui/initialize',{appInfo:{name:'draw-one',version:'0.1.0'},appCapabilities:{},protocolVersion:'2026-01-26'}).then(r=>{capabilities=r.hostCapabilities??{};parent.postMessage({jsonrpc:'2.0',method:'ui/notifications/initialized',params:{}},'*');});
ready.catch(()=>{});
return{ready,canDownload:()=>Boolean(capabilities.downloadFile),download:contents=>rpc('ui/download-file',{contents}),async tool(name,args){await ready;const r=await rpc('tools/call',{name,arguments:args});if(r.isError||!r.structuredContent)throw Error('暫時無法取得籤詩。');return r.structuredContent;}};})();
</script>`;
html=html.replace('<script>\n/* ==================== sound-layer:begin',()=>bridge+'\n<script>\n/* ==================== sound-layer:begin');
const start=html.indexOf('  function completeDraw() {'),end=html.indexOf('\n  $("jieyueToggle")',start);
if(start<0||end<0)throw Error('Arrival draw seam changed');
html=html.slice(0,start)+`  let hostDrawing = false;
  async function completeDraw() {
    if(hostDrawing) return;
    hostDrawing=true;
    const question=$("question").value, corpusId=currentHall.corpusId;
    try {
      const bound=window.DRAW_POLICY.peekBinding({question});
      const result=bound ? await window.DRAW_ONE_HOST.tool('get_draw_one_slip',{entry_id:bound.entryId}) : await window.DRAW_ONE_HOST.tool('draw_one_slip',{corpus_id:corpusId});
      if(bound) currentResolved={entryId:bound.entryId,repeated:true};
      else currentResolved=window.DRAW_POLICY.resolveDraw({question,corpusId,drawFn:()=>result.entry});
      const entry=POOL.entries.find(e=>e.id===currentResolved.entryId);
      if(!entry)throw Error('找不到這支籤。');
      if (navigator.vibrate) navigator.vibrate(16);
      window.ARRIVAL_SOUND?.stickOut();
      $("tubeStage").style.display="none";
      $("stickLabel").textContent=window.SLIP_RENDER.tabText(entry);
      $("stickStage").style.display="flex";
      $("stickStage").scrollIntoView({behavior:reduceMotion?"auto":"smooth",block:"center"});
    }catch(error){$("presentQ").textContent=error.message+' 請稍後再試。';resetStick();}
    finally{hostDrawing=false;}
  }
`+html.slice(end);
html=html.replace('<textarea id="question" rows="1"','<textarea id="question" maxlength="2000" rows="1"');
// Preserve notes during this opening when browser storage is unavailable.
html=html.replace('  const store = {', '  const localMemory=new Map();\n  const store = {');
html=html.replace('get: (k, f) => { try {', 'get: (k, f) => { if(localMemory.has(k))return localMemory.get(k); try {');
html=html.replace('catch { return f; } },','catch { return localMemory.get(k) ?? f; } },');
html=html.replace('set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },','set: (k, v) => { localMemory.set(k,v); try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },');
html=html.replace('    renderJieyue(entry);','    if($("sharePreview")) $("sharePreview").hidden=true;\n    renderJieyue(entry);');
html=html.replace('<div class="ask-label">今天想問什麼</div>', '<div class="ask-label">今天想問什麼</div><p id="localPrivacy" style="font-size:11px;line-height:1.7;color:var(--ink-soft)">問題與籤簿留在本機，不傳送到抽籤服務。</p>');
// Local font bytes are shared by the page and exported SVG; no external fetch.
const fontStart=html.indexOf('  async function inlineFontCss(text) {');
const fontEnd=html.indexOf('  async function renderTakeawayPng',fontStart);
if(fontStart<0||fontEnd<0)throw Error('Font export seam changed');
html=html.slice(0,fontStart)+'  async function inlineFontCss() { return '+JSON.stringify(read('plugin/data/slip-fonts.css'))+'; }\n'+html.slice(fontEnd);
// Export must include the full protruding label even for long Chinese numbers.
html=html.replace('    window.SLIP_RENDER.mountSlip(art, entry);', '    await document.fonts.ready;\n    window.SLIP_RENDER.mountSlip(art, entry);\n    const labelTop=art.querySelector(".slip-tab").getBoundingClientRect().top-art.getBoundingClientRect().top;\n    if(labelTop<10) art.style.paddingTop=(parseFloat(getComputedStyle(art).paddingTop)+10-labelTop)+"px";');
html=html.replace('<textarea id="noteInput"', '<textarea id="noteInput" maxlength="2000"');
// Clipboard fallback remains user-controlled and contains only public slip text.
html=html.replace('      $("copyBtn").textContent = "複製失敗";', '      $("copyBtn").textContent = "請選取籤文複製";\n      let output=document.getElementById("copySlipText");if(!output){output=document.createElement("textarea");output.id="copySlipText";output.readOnly=true;output.style.cssText="width:100%;min-height:160px;margin-top:12px";output.setAttribute("aria-label","可複製的籤文，不含私人問題或筆記");$("takeawayZone").appendChild(output);}output.value=text;output.hidden=false;output.focus();output.select();');
html=html.replace('    if($("sharePreview")) $("sharePreview").hidden=true;', '    if($("sharePreview")) $("sharePreview").hidden=true;\n    if($("copySlipText")) $("copySlipText").hidden=true;');
// Explicit save/share gesture for host user-activation limits.
html=html.replace('<button class="takeaway-btn" id="copyBtn">複製籤文</button>', '<button class="takeaway-btn" id="copyBtn">複製籤文</button><div id="sharePreview" hidden><img id="shareImage" alt="可帶走的籤紙，只有籤詩與版記" style="width:100%;max-width:360px"><a id="saveImage" class="takeaway-btn" download="draw-one-slip.png">儲存籤紙圖片</a><button id="shareImageBtn" class="takeaway-btn" hidden>分享籤紙圖片</button><p style="font-size:12px;line-height:1.8">分享不包含問題與筆記。若宿主限制下載，可長按圖片儲存。</p></div>');
const shareStart=html.indexOf('      if (navigator.canShare?.({ files: [file] })) {');
const shareEnd=html.indexOf('      btn.textContent = orig;',shareStart);
if(shareStart<0||shareEnd<0)throw Error('Share seam changed');
html=html.slice(0,shareStart)+`      if(window.drawOneShareUrl) URL.revokeObjectURL(window.drawOneShareUrl);
      const url=URL.createObjectURL(blob);window.drawOneShareUrl=url;
      $("shareImage").src=url;$("saveImage").href=url;$("sharePreview").hidden=false;
      $("saveImage").onclick=async event=>{
        if(!window.DRAW_ONE_HOST.canDownload())return;
        event.preventDefault();
        try{
          const bytes=new Uint8Array(await blob.arrayBuffer());let binary="";
          for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
          const exported=await window.DRAW_ONE_HOST.download([{type:"resource",resource:{uri:"file:///draw-one-slip.png",mimeType:"image/png",blob:btoa(binary)}}]);
          $("saveImage").textContent=exported.isError?"未儲存，可再試一次":"已交給宿主儲存";
        }catch{$("saveImage").textContent="宿主未提供下載，可長按圖片儲存";}
      };
      $("shareImageBtn").hidden=!navigator.canShare?.({files:[file]});
      $("shareImageBtn").onclick=async()=>{try{await navigator.share({files:[file]});}catch(e){if(e.name!=="AbortError")$("shareImageBtn").textContent="請改用儲存圖片";}};
      $("sharePreview").scrollIntoView({block:"nearest",behavior:reduceMotion?"auto":"smooth"});
`+html.slice(shareEnd);
html=html.replace('</body>',`<script>
const enter=document.getElementById('enterBtn');enter.disabled=true;
try{localStorage.setItem('drawone.storage-check','1');localStorage.removeItem('drawone.storage-check');}catch{document.getElementById('localPrivacy').textContent='目前宿主無法保存資料；問題、籤與筆記只保留在這次開啟中。';}
window.DRAW_ONE_HOST.ready.then(()=>{enter.disabled=false;}).catch(()=>{enter.textContent='連接未完成，請重新開啟';});
</script></body>`);
writeFileSync(new URL('public/widget.html',import.meta.url),html);
console.log('Original Arrival + Slip bundled; public pool only; MCP draw bridge.');
