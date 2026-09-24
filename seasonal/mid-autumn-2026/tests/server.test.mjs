import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';

async function fixture(t, dataDir) {
  const dir = dataDir || await mkdtemp(join(tmpdir(), 'drawone-test-'));
  const server = createApp({ dataDir: dir });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(async () => { await new Promise(r => server.close(r)); if (!dataDir) await rm(dir,{recursive:true,force:true}); });
  return { url: `http://127.0.0.1:${server.address().port}`, dir };
}
const valid = { id:'f50445eb-aef0-4098-8063-329228dd72a1', q1:'也許', q2:'看籤詩與依據', q3:'當時的問題' };
const post = (url, value) => fetch(url+'/api/feedback', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});

test('a successful response means the exact anonymous answers are persisted, and retry is idempotent', async t => {
  const {url,dir}=await fixture(t);
  const responses = await Promise.all([post(url,valid),post(url,valid)]);
  for (const res of responses) assert.equal(res.status,200);
  const lines=(await readFile(join(dir,'feedback.jsonl'),'utf8')).trim().split('\n');
  assert.equal(lines.length,1);
  const saved=JSON.parse(lines[0]);
  assert.deepEqual([saved.q1,saved.q2,saved.q3],['也許','看籤詩與依據','當時的問題']);
  assert.deepEqual(Object.keys(saved).sort(),['id','q1','q2','q3','submittedAt','version'].sort());
  assert.equal((await fetch(url+'/data/feedback.jsonl')).status,404);
  assert.equal((await fetch(url+'/server.mjs')).status,404);
});
test('missing or forged options and oversized input do not save',async t=>{
  const {url,dir}=await fixture(t);
  for (const values of [{...valid,q1:''},{...valid,q2:'假的選項'},{...valid,q3:'月'.repeat(201)},{...valid,id:'../test'}]) {
    assert.equal((await post(url,values)).status,400);
  }
  await assert.rejects(readFile(join(dir,'feedback.jsonl')));
});
test('optional final response can be skipped and whitespace is trimmed',async t=>{
  const {url,dir}=await fixture(t);
  assert.equal((await post(url,{...valid,q3:'  '})).status,200);
  assert.equal(JSON.parse(await readFile(join(dir,'feedback.jsonl'),'utf8')).q3,'');
});
test('disk failure cannot produce a thank-you success',async t=>{
  const {url}=await fixture(t,'/dev/null/unwritable');
  const response=await post(url,valid);
  assert.equal(response.status,503);
  assert.equal((await response.json()).ok,false);
});
test('a duplicate id with different answers is rejected',async t=>{
  const {url}=await fixture(t);
  await post(url,valid);
  assert.equal((await post(url,{...valid,q1:'不會'})).status,409);
});
