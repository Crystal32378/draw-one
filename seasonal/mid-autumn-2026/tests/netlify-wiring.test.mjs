import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {submitFeedback,NETLIFY_FORM_NAME} from '../public/feedback-client.js';
import {buildNetlify} from '../scripts/build-netlify.mjs';
const payload={id:'f50445eb-aef0-4098-8063-329228dd72a1',q1:'也許',q2:'看籤詩與依據',q3:'保留 A+B & 月光 = 原文？'};

test('Netlify sends all three answers as URL-encoded form data, not the local API',async()=>{
 const calls=[];
 await submitFeedback(payload,{mode:'netlify',fetchImpl:async(url,options)=>{calls.push({url,options});return new Response('<html>Thank you</html>',{status:200});}});
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/');
 const {options}=calls[0];assert.equal(options.method,'POST');assert.equal(options.headers['Content-Type'],'application/x-www-form-urlencoded');
 const body=new URLSearchParams(options.body);
 assert.equal(body.get('form-name'),NETLIFY_FORM_NAME);
 assert.equal(body.get('submission-id'),payload.id);
 for(const key of ['q1','q2','q3'])assert.equal(body.get(key),payload[key]);
 assert.equal(body.get('bot-field'),'');
});
test('Netlify errors reject instead of reporting success or falling back to local persistence',async()=>{
 for(const status of [400,404,422,429,500,503]) {
  let calls=0;
  await assert.rejects(submitFeedback(payload,{mode:'netlify',fetchImpl:async()=>{calls++;return new Response('failure',{status});}}));
  assert.equal(calls,1);
 }
 await assert.rejects(submitFeedback(payload,{mode:'netlify',fetchImpl:async()=>{throw new TypeError('network failure');}}));
});
test('a filled honeypot is not sent and never resolves as success',async()=>{
 let called=false;
 await assert.rejects(submitFeedback(payload,{mode:'netlify',honeypot:'bot',fetchImpl:async()=>{called=true;return new Response('ok');}}));
 assert.equal(called,false);
});
test('static publish output registers the matching hidden form and excludes all local tools and responses',async t=>{
 const temporary=await mkdtemp(join(tmpdir(),'drawone-publish-'));t.after(()=>rm(temporary,{recursive:true,force:true}));
 const out=join(temporary,'site');await buildNetlify({outDir:out});
 const html=await readFile(join(out,'index.html'),'utf8');
 assert.match(html,/name="draw-one-midautumn-2026"[^>]*data-netlify="true"[^>]*hidden/);
 assert.match(html,/name="form-name" value="draw-one-midautumn-2026"/);
 for(const name of ['q1','q2','q3','submission-id','bot-field'])assert.ok(html.includes(`name="${name}"`));
 assert.match(await readFile(join(out,'feedback-config.js'),'utf8'),/mode: 'netlify'/);
 const files=await readdir(out,{recursive:true});
 for(const name of files)assert.doesNotMatch(name,/(^|\/)(admin|data|tests|scripts|node_modules|\.env|\.git)(\/|$)|\.jsonl$|\.csv$|server\.mjs$/);
 for(const name of ['styles.css','moonlight.css','sky.js','assets/moon-2026.jpg'])assert.deepEqual(await readFile(join(out,name)),await readFile(new URL('../public/'+name,import.meta.url)));
});
