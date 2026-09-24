import test from 'node:test';
import assert from 'node:assert/strict';
import {get} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAdminServer} from '../admin-server.mjs';
import {createApp} from '../server.mjs';
async function fixture(t,entries) {
 const dir=await mkdtemp(join(tmpdir(),'drawone-admin-'));
 if(entries) await writeFile(join(dir,'feedback.jsonl'),entries.map(x=>JSON.stringify(x)).join('\n')+'\n');
 const admin=createAdminServer({dataDir:dir});await new Promise(r=>admin.listen(0,'127.0.0.1',r));
 const app=createApp({dataDir:dir});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 t.after(async()=>{await Promise.all([admin,app].map(s=>new Promise(r=>s.close(r))));await rm(dir,{recursive:true,force:true});});
 return {url:`http://127.0.0.1:${admin.address().port}`,appUrl:`http://127.0.0.1:${app.address().port}`,dir};
}
const sample={id:'sample',q1:'會',q2:'收藏到籤簿',q3:'=1+1',submittedAt:'2026-09-25T12:00:00.000Z',version:'midautumn-2026-v1'};
test('private viewer reads real submissions, summarizes accurately, and neutralizes CSV formulas',async t=>{
 const {url,appUrl}=await fixture(t,[sample,{...sample,id:'second',q1:'也許',q2:'看籤詩與依據',q3:'月亮，與「回看」'}]);
 const result=await fetch(url+'/api/responses');assert.equal(result.status,200);
 const payload=await result.json();assert.equal(payload.total,2);assert.equal(payload.q1['會'],1);assert.equal(payload.q2['收藏到籤簿'],1);assert.equal(payload.responses.length,2);
 const csv=await fetch(url+'/export.csv');assert.match(csv.headers.get('content-disposition'),/attachment/);
 assert.match(await csv.text(),/"'=1\+1"/);
 assert.equal((await fetch(appUrl+'/api/responses')).status,404);
 assert.equal((await fetch(appUrl+'/admin/index.html')).status,404);
});
test('no submissions is a truthful empty state',async t=>{
 const {url}=await fixture(t);
 const payload=await (await fetch(url+'/api/responses')).json();assert.equal(payload.total,0);assert.deepEqual(payload.responses,[]);
});
test('viewer rejects foreign origins and rebound hosts without exposing responses',async t=>{
 const {url}=await fixture(t,[sample]);
 for(const headers of [{Origin:'https://elsewhere.example'},{Host:'rebound.example'},{'Sec-Fetch-Site':'cross-site'}]) {
  const result=await new Promise((resolve,reject)=>{get(url+'/api/responses',{headers},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,body}));}).on('error',reject);});
  assert.equal(result.status,403,JSON.stringify(headers));assert.doesNotMatch(result.body,/=1\+1/);
 }
});
test('unreadable or malformed data is an error, never a false zero count',async t=>{
 const {url,dir}=await fixture(t);await writeFile(join(dir,'feedback.jsonl'),'{broken\n');
 const response=await fetch(url+'/api/responses');assert.equal(response.status,503);assert.equal((await response.json()).ok,false);
});
