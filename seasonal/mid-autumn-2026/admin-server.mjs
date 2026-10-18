import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const adminRoot=fileURLToPath(new URL('./admin/',import.meta.url));
const publicRoot=fileURLToPath(new URL('./public/',import.meta.url));
const q1Options=['會','也許','不會'];
const q2Options=['抽籤本身','看籤詩與依據','和 AI 繼續聊','收藏到籤簿','都還好'];
const localHosts=new Set(['localhost','127.0.0.1','[::1]']);
const localAddresses=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);

async function getResponses(dataDir) {
 let text='';
 try {text=await readFile(join(dataDir,'feedback.jsonl'),'utf8');} catch(err){if(err.code!=='ENOENT')throw err;}
 const responses=text.split('\n').filter(line=>line.trim()).map(line=>{
  const value=JSON.parse(line);
  if(!q1Options.includes(value.q1)||!q2Options.includes(value.q2)||typeof value.q3!=='string'||!Number.isFinite(Date.parse(value.submittedAt))) throw new Error('Invalid feedback record');
  return {id:value.id,submittedAt:value.submittedAt,q1:value.q1,q2:value.q2,q3:value.q3};
 }).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
 const q1=Object.fromEntries(q1Options.map(x=>[x,0]));
 const q2=Object.fromEntries(q2Options.map(x=>[x,0]));
 for(const response of responses) {q1[response.q1]++;q2[response.q2]++;}
 return {ok:true,total:responses.length,q1,q2,responses};
}
function csvCell(input) {
 let text=String(input??'');
 if(/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
function isLocalRequest(req) {
 if(!localAddresses.has(req.socket.remoteAddress)) return false;
 try {
  const host=new URL('http://'+req.headers.host);
  if(!localHosts.has(host.hostname)||Number(host.port||80)!==req.socket.localPort) return false;
  if(req.headers.origin && req.headers.origin!==host.origin) return false;
  if(req.headers['sec-fetch-site'] && !['same-origin','none'].includes(req.headers['sec-fetch-site'])) return false;
  return true;
 } catch {return false;}
}
export function createAdminServer({dataDir=process.env.FEEDBACK_DIR||fileURLToPath(new URL('./data/',import.meta.url))}={}) {
 const sendJSON=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
 return createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if(!isLocalRequest(req)){sendJSON(res,403,{ok:false,error:'此管理頁僅限本機同來源存取。'});return;}
  if(req.method!=='GET'){res.setHeader('Allow','GET');sendJSON(res,405,{ok:false,error:'僅供讀取。'});return;}
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/api/responses'||path==='/export.csv') {
   try {
    const data=await getResponses(dataDir);
    if(path==='/api/responses') {sendJSON(res,200,data);return;}
    const lines=[['送出時間（UTC）','再次使用意願','最想留下的部分','希望記得什麼'],...data.responses.map(r=>[r.submittedAt,r.q1,r.q2,r.q3])];
    res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="draw-one-midautumn-feedback.csv"'});
    res.end('\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n');
   } catch {sendJSON(res,503,{ok:false,error:'回覆資料暫時無法讀取。請保留資料檔，確認格式或權限後再試。'});}
   return;
  }
  const assets={
   '/':['index.html','text/html; charset=utf-8',adminRoot],
   '/admin.css':['admin.css','text/css; charset=utf-8',adminRoot],
   '/admin.js':['admin.js','text/javascript; charset=utf-8',adminRoot],
   '/fonts.css':['fonts.css','text/css; charset=utf-8',publicRoot],
   '/assets/noto-sans-tc-400.ttf':['assets/noto-sans-tc-400.ttf','font/ttf',publicRoot],
   '/assets/noto-sans-tc-500.ttf':['assets/noto-sans-tc-500.ttf','font/ttf',publicRoot],
   '/assets/noto-serif-tc-400.ttf':['assets/noto-serif-tc-400.ttf','font/ttf',publicRoot],
   '/assets/noto-serif-tc-500.ttf':['assets/noto-serif-tc-500.ttf','font/ttf',publicRoot],
   '/assets/noto-serif-tc-600.ttf':['assets/noto-serif-tc-600.ttf','font/ttf',publicRoot],
   '/assets/favicon.svg':['assets/favicon.svg','image/svg+xml',publicRoot]
  };
  if(!assets[path]){res.writeHead(404);res.end();return;}
  try {const [file,type,root]=assets[path];const body=await readFile(join(root,file));res.writeHead(200,{'Content-Type':type});res.end(body);}
  catch{res.writeHead(404);res.end();}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const port=Number(process.env.ADMIN_PORT||4175);
 createAdminServer().listen(port,'127.0.0.1',()=>console.log(`Draw One 本機回覆管理：http://localhost:${port}`));
}
