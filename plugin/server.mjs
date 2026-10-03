import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHash, randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
const root = new URL('./data/', import.meta.url);
const raw = readFileSync(new URL('oracles.draw-pool.js', root),'utf8');
const pool = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}')+1));
const report = JSON.parse(readFileSync(new URL('draw-pool.report.json',root),'utf8'));
const digest = createHash('sha256').update(raw).digest('hex');
if (digest !== report.pool_sha256 || report.status !== 'PASSED' || pool.entries.length !== 260) throw Error('Production pool verification failed');
for (const [id,count] of Object.entries({guanyin:100,guandi:100,liushijiazi:60})) {
 const entries=pool.entries.filter(e=>e.corpus_id===id);
 if(entries.length!==count || new Set(entries.map(e=>e.slip_number)).size!==count || entries.some(e=>e.interpretation!==null || !['VERIFIED','PROBABLE'].includes(e.provenance.transcription_status))) throw Error('Invalid production corpus');
}
const URI='ui://draw-one/arrival-v3.html';
const html=readFileSync(new URL('public/widget.html',import.meta.url),'utf8').replace('/* DRAW_POLICY */',readFileSync(new URL('draw-policy.js',root),'utf8'));
const corpusId=z.enum(['guanyin','guandi','liushijiazi']);
const reply = data => ({content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data});
export function makeServer(){
 const server=new McpServer({name:'draw-one',version:'0.1.1'});
 registerAppResource(server,'draw-one',URI,{},async()=>({contents:[{uri:URI,mimeType:RESOURCE_MIME_TYPE,text:html,_meta:{ui:{csp:{connectDomains:[],resourceDomains:[]}}}}]}));
 registerAppTool(server,'open_draw_one_temple',{title:'開啟 Draw One',description:'開啟 Draw One 原版宮廟體驗：山門入內、廟埕轉身、走進觀音、關帝或媽祖殿，使用者自行向上抽籤、取籤紙、收進本機籤簿與帶走圖片。原文與來源狀態來自既有產品資料。不提供神諭、預測或 AI 解籤。請讓使用者在介面內抽籤，不要代替使用者重抽。',inputSchema:{},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},_meta:{ui:{resourceUri:URI}}},async()=>reply({corpora:pool.corpora,content_version:pool.content_version,interpretation:null}));
 registerAppTool(server,'draw_one_slip',{title:'抽一支籤',description:'僅供介面明確抽籤操作使用。問題內容不傳送到伺服器；一事一籤由介面沿用產品 draw-policy 綁定。',inputSchema:{corpus_id:corpusId},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},_meta:{ui:{resourceUri:URI,visibility:['app']}}},async({corpus_id})=>{const entries=pool.entries.filter(e=>e.corpus_id===corpus_id);return reply({entry:entries[randomInt(entries.length)],content_version:pool.content_version});});
 registerAppTool(server,'get_draw_one_slip',{title:'查看既有籤',description:'依既有籤的 ID 讀取原文與来源，供介面恢復同一支籤。',inputSchema:{entry_id:z.string().regex(/^(guanyin|guandi|liushijiazi)-\d{3}$/)},annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},_meta:{ui:{resourceUri:URI,visibility:['app']}}},async({entry_id})=>{const entry=pool.entries.find(e=>e.id===entry_id);return entry?reply({entry,content_version:pool.content_version}):{isError:true,content:[{type:'text',text:'找不到這支籤。'}]};});
 return server;
}
export async function handler(req,res){
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/' && req.method==='GET'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'}).end('Draw One MCP · 260 slips · no AI interpretation');return;}
 if(path!=='/mcp'){res.writeHead(404).end('Not found');return;}
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, GET, DELETE, OPTIONS','Access-Control-Allow-Headers':'content-type, mcp-protocol-version, mcp-session-id'}).end();return;}
 if(!['POST','GET','DELETE'].includes(req.method)){res.writeHead(405).end();return;}
 res.setHeader('Access-Control-Allow-Origin','*');
 const server=makeServer();
 const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
 res.on('close',()=>{void transport.close();void server.close();});
 try{await server.connect(transport);await transport.handleRequest(req,res,req.body);}catch{if(!res.headersSent)res.writeHead(500).end('MCP request failed');}
}
if(process.argv[1]===fileURLToPath(import.meta.url))createServer(handler).listen(Number(process.env.PORT||8787),'127.0.0.1',()=>console.log('Draw One MCP ready on http://127.0.0.1:8787/mcp'));
