import { execFileSync } from 'node:child_process';
import { copyFileSync,mkdirSync } from 'node:fs';
const root=new URL('../',import.meta.url);
execFileSync(process.execPath,['scripts/build-draw-pool.mjs'],{cwd:root,stdio:'inherit'});
mkdirSync(new URL('data/',import.meta.url),{recursive:true});
for(const [src,dst] of [['assets/oracles.draw-pool.js','oracles.draw-pool.js'],['assets/draw-policy.js','draw-policy.js'],['data/production/draw-pool.report.json','draw-pool.report.json']])copyFileSync(new URL(src,root),new URL('data/'+dst,import.meta.url));
