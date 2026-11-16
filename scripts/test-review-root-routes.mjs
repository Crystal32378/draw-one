// Model the checked-in Vercel rewrite, not a /paper-only preview URL.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,sep} from 'node:path';
const root=resolve('.'),routes=JSON.parse(readFileSync('vercel.json','utf8')).routes;
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const route=routes.find(r=>r.src===pathname);
 const path=resolve(root,'.'+(route?.dest||pathname));
 if(!path.startsWith(root+sep)||!existsSync(path)){res.writeHead(404);res.end();return;}
 res.end(readFileSync(path));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const entry of ['/','/paper/arrival.html']){
  const response=await fetch(origin+entry);assert.equal(response.status,200);
  const html=await response.text();
  const notice=html.match(/class="notice-go" href="([^"]+)"/)[1];
  const pageTemplate=html.match(/page: \(cid\) => `([^`]+)`/)[1];
  const hrefs=[notice,...['guanyin','guandi','liushijiazi'].map(cid=>pageTemplate.replace('${cid}',cid)+'#lot-5')];
  for(const href of hrefs){
   const target=new URL(href,origin+entry);
   assert.ok(target.pathname.startsWith('/paper/corpus-review'),entry+' resolves '+href);
   const result=await fetch(target);assert.equal(result.status,200,target.href);
  }
 }
 console.log('PASS: root rewrite and direct /paper entry both resolve courtyard and all three corpus review links to existing pages.');
}finally{await new Promise(resolve=>server.close(resolve));}
