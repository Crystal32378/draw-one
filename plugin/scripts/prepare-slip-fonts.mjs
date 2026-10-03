import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const base=new URL('../../',import.meta.url).pathname;const raw=readFileSync(base+'plugin/data/oracles.draw-pool.js','utf8');const pool=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1));
const renderer=readFileSync(base+'assets/slip-render.js','utf8');const texts=pool.entries.map(e=>e.historical_text.poem_text+e.original_slip_label).join('')+renderer+'抽一謹錄已對勘待複核據〇一二三四五六七八九十百月日春夏秋冬寒暑雨水驚蟄清明穀滿芒種至小大小立分露霜降雪處';
const chars=[...new Set([...texts].filter(c=>c.codePointAt(0)>127))];let css='';
for(let i=0;i<chars.length;i+=220){const chunk=chars.slice(i,i+220);const url='https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400..700&text='+encodeURIComponent(chunk.join(''));const r=await fetch(url);if(!r.ok)throw Error('Font CSS '+r.status);const s=await r.text();const match=s.match(/url\((https:[^)]+)\)/);if(!match)throw Error('No font URL');const f=await fetch(match[1]);if(!f.ok)throw Error('Font download '+f.status);const bytes=Buffer.from(await f.arrayBuffer());css+=`@font-face{font-family:'Noto Serif TC';font-style:normal;font-weight:400 700;src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype');unicode-range:${chunk.map(c=>'U+'+c.codePointAt(0).toString(16)).join(',')};}\n`;}
// TC lacks U+5E77 in this public corpus; supplement only that glyph with SC.
const fallbackCss=await (await fetch('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400..700&text='+encodeURIComponent('幷'))).text();
const fallbackUrl=fallbackCss.match(/url\((https:[^)]+)\)/)?.[1];if(!fallbackUrl)throw Error('Missing fallback font');
const fallbackFont=Buffer.from(await (await fetch(fallbackUrl)).arrayBuffer());
css+=`@font-face{font-family:'Noto Serif TC';font-style:normal;font-weight:400 700;src:url(data:font/ttf;base64,${fallbackFont.toString('base64')}) format('truetype');unicode-range:U+5E77;}\n`;
writeFileSync(base+'plugin/data/slip-fonts.css',css);copyFileSync(base+'seasonal/mid-autumn-2026/public/assets/Noto-Serif-TC-OFL.txt',base+'plugin/data/Noto-Serif-TC-OFL.txt');console.log('Embedded public glyph font chunks:',chars.length,'CSS bytes:',css.length);
