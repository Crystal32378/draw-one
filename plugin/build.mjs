import { execFileSync } from 'node:child_process';
import { copyFileSync,mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root=new URL('../',import.meta.url);
execFileSync(process.execPath,['scripts/build-draw-pool.mjs'],{cwd:root,stdio:'inherit'});
const data=new URL('data/',import.meta.url);
mkdirSync(data,{recursive:true});
const raw=readFileSync(new URL('assets/oracles.draw-pool.js',root),'utf8');
const canonical=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
// Explicit public projection: reviewed poems and edition/status only.
const pool={schema:canonical.schema,content_version:canonical.content_version,
 corpora:canonical.corpora.map(c=>({corpus_id:c.corpus_id,deity_tradition:c.deity_tradition,edition_title:c.edition_title,slip_count:c.slip_count})),
 entries:canonical.entries.map(e=>({id:e.id,corpus_id:e.corpus_id,deity_tradition:e.deity_tradition,slip_number:e.slip_number,original_slip_label:e.original_slip_label,historical_text:{poem_text:e.historical_text.poem_text},provenance:{edition_title:e.provenance.edition_title,transcription_status:e.provenance.transcription_status},interpretation:null}))};
const artifact='window.DRAW_POOL = '+JSON.stringify(pool,null,2)+';\n';
writeFileSync(new URL('oracles.draw-pool.js',data),artifact);
writeFileSync(new URL('draw-pool.report.json',data),JSON.stringify({status:'PASSED',content_version:pool.content_version,total_entries:pool.entries.length,pool_sha256:createHash('sha256').update(artifact).digest('hex')},null,2)+'\n');
copyFileSync(new URL('assets/draw-policy.js',root),new URL('draw-policy.js',data));
