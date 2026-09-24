import { createServer } from 'node:http';
import { readFile, mkdir, appendFile } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.png':'image/png'};
const q1Options = new Set(['會','也許','不會']);
const q2Options = new Set(['抽籤本身','看籤詩與依據','和 AI 繼續聊','收藏到籤簿','都還好']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createApp({dataDir=process.env.FEEDBACK_DIR || fileURLToPath(new URL('./data/',import.meta.url))}={}) {
  let writes=Promise.resolve();
  const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
    let pathname;
    try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
    if(pathname==='/api/feedback') {
      if(req.method!=='POST') {res.setHeader('Allow','POST');send(res,405,{ok:false,error:'請以表單送出。'});return;}
      if(req.headers.origin) {
        try {if(new URL(req.headers.origin).host!==req.headers.host) {send(res,403,{ok:false,error:'請回到原頁面送出。'});return;}}
        catch {send(res,403,{ok:false,error:'來源無效。'});return;}
      }
      if(!req.headers['content-type']?.startsWith('application/json')) {send(res,415,{ok:false,error:'資料格式不正確。'});return;}
      try {
        const chunks=[];let size=0;
        for await(const chunk of req) {size+=chunk.length;if(size>8192){send(res,413,{ok:false,error:'內容太長了。'});return;}chunks.push(chunk);}
        let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{send(res,400,{ok:false,error:'資料格式不正確。'});return;}
        if(!data || !uuid.test(data.id) || !q1Options.has(data.q1) || !q2Options.has(data.q2) || typeof data.q3!=='string' || [...data.q3].length>200) {
          send(res,400,{ok:false,error:'請完成前兩題，最後一題限 200 字。'});return;
        }
        const entry={id:data.id,q1:data.q1,q2:data.q2,q3:data.q3.trim(),submittedAt:new Date().toISOString(),version:'midautumn-2026-v1'};
        const save=async()=>{
          await mkdir(dataDir,{recursive:true,mode:0o700});
          const path=join(dataDir,'feedback.jsonl');
          let previous='';try{previous=await readFile(path,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
          const existing=previous.split('\n').filter(Boolean).map(line=>JSON.parse(line)).find(x=>x.id===entry.id);
          if(existing) return existing.q1===entry.q1&&existing.q2===entry.q2&&existing.q3===entry.q3 ? 200:409;
          await appendFile(path,JSON.stringify(entry)+'\n',{mode:0o600,flush:true});
          return 200;
        };
        const job=writes.then(save);writes=job.catch(()=>{});
        const status=await job;
        send(res,status,status===200?{ok:true}:{ok:false,error:'這份回覆已送出，請重新整理後再填。'});
      } catch {send(res,503,{ok:false,error:'暫時無法送出，回答仍留在這裡。請稍後再試。'});}
      return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!path.startsWith(root+sep) || pathname.split('/').some(x=>x.startsWith('.'))) {res.writeHead(404);res.end();return;}
    try {
      const content=await readFile(path);
      res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':extname(path)==='.html'?'no-cache':'public, max-age=3600'});
      res.end(req.method==='HEAD'?undefined:content);
    }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('這一頁不在這裡。');}
  });
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.PORT || 4173);
  createApp().listen(port,'127.0.0.1',()=>console.log(`Draw One 中秋原型：http://localhost:${port}`));
}
