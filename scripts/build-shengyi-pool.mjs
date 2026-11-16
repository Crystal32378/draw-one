// Source-preserving historical 聖意. Pins document source identity, NOT human verification.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
export const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function sourceRows(c){return read(`data/corpora/${c}/interpretation_layer.json`).entries.filter(r=>r.field_type==='聖意');}
export function buildShengyi(sources={guanyin:sourceRows('guanyin'),guandi:sourceRows('guandi'),liushijiazi:sourceRows('liushijiazi')},pins=read('data/production/shengyi-source-pins.json')){
 const entries={};
 for(const c of ['guanyin','guandi','liushijiazi']){
  const rows=sources[c],pin=pins[c];
  const total=c==='liushijiazi'?60:100;
  if(rows.length!==total||digest(rows)!==pin.source_digest)throw Error(c+': source identity changed; review exact mapping before updating pins');
  const seen=new Set();
  for(const r of rows){
   if(r.corpus!==c||!Number.isInteger(r.slip_no)||r.slip_no<1||r.slip_no>total||seen.has(r.slip_no)||r.edition!==pin.source_edition||!r.source_locator||!r.verbatim_text||/[\uFFFD\u0000]/u.test(r.verbatim_text)||!['VERIFIED','PROBABLE','CANDIDATE','UNRESOLVED'].includes(r.transcription_status))throw Error(c+': invalid exact source row');
   seen.add(r.slip_no);
   const segment=pin.segments?.[r.slip_no];
   let text=r.verbatim_text;
   if(segment?.before){const i=text.indexOf(segment.before);if(i<1)throw Error('segment boundary missing');text=text.slice(0,i);}
   if(segment?.unresolved)text='';
   const id=c+'-'+String(r.slip_no).padStart(3,'0');
   entries[id]={id,corpus_id:c,slip_number:r.slip_no,expected_slip_edition:pin.slip_edition,field:'聖意',text,display_selection:segment||null,status:r.transcription_status,confirmed:r.manual_image_confirmation===true,source:r.edition,locator:r.source_locator,notes:r.variants_or_notes||'',source_hash:digest(r)};
  }
 }
 return {schema:'shengyi-candidates/1',status_word:{VERIFIED:'已對勘',PROBABLE:'待複核',CANDIDATE:'候選讀法',UNRESOLVED:'有疑字・待核對'},entries};
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){const pool=buildShengyi();writeFileSync('assets/shengyi-pool.js','// Generated exact historical candidate text; no status promotion.\nwindow.SHENGYI_POOL = '+JSON.stringify(pool,null,2).replace(/</g,'\\u003c')+';\n');console.log('Built260 聖意 records:259 source candidates +1 wrong-field transcription awaiting replacement.');}
