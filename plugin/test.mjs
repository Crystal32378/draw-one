import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {handler} from './server.mjs';
test('real MCP HTTP discovery, three corpora, source truth and app-only draw',async()=>{
 const http=createServer(handler);await new Promise(r=>http.listen(0,'127.0.0.1',r));
 const client=new Client({name:'draw-one-test',version:'1.0'});
 try{
 await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${http.address().port}/mcp`)));
 const {tools}=await client.listTools();assert.equal(tools.length,3);
 assert.deepEqual(tools.find(t=>t.name==='draw_one_slip')._meta.ui.visibility,['app']);
 const opened=await client.callTool({name:'open_draw_one',arguments:{}});assert.equal(opened.structuredContent.corpora.length,3);
 for(const corpus_id of ['guanyin','guandi','liushijiazi']){
 const r=await client.callTool({name:'draw_one_slip',arguments:{corpus_id}});const e=r.structuredContent.entry;
 assert.equal(e.corpus_id,corpus_id);assert.equal(e.interpretation,null);assert.ok(e.provenance.source_locator);
 const again=await client.callTool({name:'get_draw_one_slip',arguments:{entry_id:e.id}});assert.deepEqual(again.structuredContent.entry,e);
 }
 const bad=await client.callTool({name:'draw_one_slip',arguments:{corpus_id:'yuelao'}});assert.equal(bad.isError,true);
 const resource=await client.readResource({uri:'ui://draw-one/slip-v1.html'});assert.match(resource.contents[0].mimeType,/mcp-app/);assert.match(resource.contents[0].text,/window.DRAW_POLICY/);
 const src=readFileSync('data/draw-policy.js','utf8');const map=new Map();const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const c={window:{localStorage:storage,sessionStorage:storage}};vm.runInNewContext(src,c);
 let draws=0;const args={question:'我的工作',corpusId:'guanyin',drawFn:()=>{draws++;return{id:'guanyin-001',corpus_id:'guanyin'};}};
 c.window.DRAW_POLICY.resolveDraw(args);const repeated=c.window.DRAW_POLICY.resolveDraw({...args,corpusId:'guandi'});assert.equal(repeated.entryId,'guanyin-001');assert.equal(draws,1);
 }finally{await client.close();await new Promise(r=>http.close(r));}
});
