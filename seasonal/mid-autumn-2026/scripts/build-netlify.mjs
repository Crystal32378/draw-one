import {mkdir,copyFile,readFile,writeFile,readdir,lstat,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=resolve(fileURLToPath(new URL('../',import.meta.url)));
const sourceRoot=join(projectRoot,'public');
const publicFiles=['index.html','app.js','sky.js','fonts.css','styles.css','moonlight.css','feedback-client.js','feedback-config.js'];
const assetNames=['favicon.svg','moon-2026.jpg','Noto-Sans-TC-OFL.txt','Noto-Serif-TC-OFL.txt','noto-sans-tc-400.ttf','noto-sans-tc-500.ttf','noto-serif-tc-400.ttf','noto-serif-tc-500.ttf','noto-serif-tc-600.ttf'];

export async function buildNetlify({outDir=join(projectRoot,'dist/netlify')}={}) {
  const output=resolve(outDir);
  if(output===projectRoot || output===sourceRoot || !output.endsWith('/netlify') && !output.endsWith('/site')) throw new Error('Unexpected publish directory');
  // A fresh, explicit allowlist prevents local data or tools from entering a deployment.
  await rm(output,{recursive:true,force:true});
  await mkdir(join(output,'assets'),{recursive:true});
  for(const relative of [...publicFiles,...assetNames.map(name=>'assets/'+name)]) {
    const source=join(sourceRoot,relative);
    if(!(await lstat(source)).isFile()) throw new Error('Publish inputs must be regular files: '+relative);
    await copyFile(source,join(output,relative));
  }
  await writeFile(join(output,'feedback-config.js'),"// Generated for Netlify static deployment. No private credentials.\nexport const feedbackConfig = Object.freeze({ mode: 'netlify' });\n");
  const html=await readFile(join(output,'index.html'),'utf8');
  if(!html.includes('data-netlify="true"')||!html.includes('name="form-name" value="draw-one-midautumn-2026"')) throw new Error('Missing Netlify form registration');
  const files=await readdir(output,{recursive:true});
  if(files.some(name=>/\.jsonl$|\.csv$|(^|\/)(admin|data|\.env|\.git)(\/|$)/.test(name))) throw new Error('Private file in publish artifact');
  return {outDir:output,files:files.filter(name=>name!=='assets')};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await buildNetlify();console.log(`Netlify static output: ${result.files.length} files in ${result.outDir}`);
}
