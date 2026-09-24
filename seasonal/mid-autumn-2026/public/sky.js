// An imagined sky, never a positional chart. Stars avoid reading and input areas.
const motionKey = 'drawone.midautumn.motion.v1';
const ns = 'http://www.w3.org/2000/svg';
const protect = 'h1,h2,h3,p,legend,nav,.brand,.button,.quiet-link,.occasion,figcaption,.survey-paper,.feature-detail,.preview-note,.moon-frame,.night-foot,.journey-sheet';

function random(seed) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

function drawField(region, layer, seed) {
  const rect = region.getBoundingClientRect();
  const width = rect.width, height = rect.height;
  if(!width || !height) return;
  const forbidden = [...region.querySelectorAll(protect)]
    .filter(el => el.getClientRects().length)
    .map(el => { const r=el.getBoundingClientRect(); return {left:r.left-rect.left-14,right:r.right-rect.left+14,top:r.top-rect.top-14,bottom:r.bottom-rect.top+14}; });
  const inText = (x,y) => forbidden.some(r => x>r.left && x<r.right && y>r.top && y<r.bottom);
  const rand = random(seed);
  const count = Math.min(110, Math.round(width * height / 12500));
  const nodes = document.createDocumentFragment();
  const wash = document.createElement('span');
  wash.className = 'sky-light';
  nodes.append(wash);
  const points = [];
  for(let attempts=0; points.length<count && attempts<count*40; attempts++) {
    const x=rand()*width,y=rand()*height;
    if(inText(x,y)) continue;
    const star = document.createElement('span');
    const prominent = rand()>.85;
    if(region.classList.contains('sky-paper-transition')) {
      const fraction=y/height;
      const bright=[232,240,213], ink=[92,109,99];
      star.style.color=`rgb(${bright.map((v,i)=>Math.round(v+(ink[i]-v)*fraction)).join(' ')})`;
      star.style.setProperty('--print',fraction.toFixed(3));
    }
    star.className = `sky-star${prominent?' sky-star-cross':''}`;
    star.style.left = `${x/width*100}%`;
    star.style.top = `${y/height*100}%`;
    star.style.setProperty('--star-size',`${prominent?2.5:1+rand()*1.7}px`);
    star.style.setProperty('--star-alpha',`${.4+rand()*.5}`);
    star.style.setProperty('--star-time',`${6+rand()*8}s`);
    star.style.setProperty('--star-delay',`${-rand()*14}s`);
    points.push({x,y});nodes.append(star);
  }
  const lines = document.createElementNS(ns,'svg');
  lines.setAttribute('viewBox',`0 0 ${width} ${height}`);
  lines.classList.add('sky-lines');
  let connections = 0;
  const used = new Set();
  for(let i=0;i<points.length && connections<5;i++) {
    if(used.has(i)) continue;
    const a=points[i];
    const j=points.findIndex((b,index) => index>i && !used.has(index) && Math.hypot(b.x-a.x,b.y-a.y)>35 && Math.hypot(b.x-a.x,b.y-a.y)<120 && Array.from({length:20},(_,step)=>step/19).every(t=>!inText(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)));
    if(j<0) continue;
    const b=points[j];
    const line=document.createElementNS(ns,'path');
    line.setAttribute('d',`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    lines.append(line);used.add(i);used.add(j);connections++;
  }
  nodes.append(lines);
  layer.replaceChildren(nodes);
}

export function initSky() {
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const button=document.querySelector('#motion-toggle');
  let optedOut=false;
  try { optedOut=localStorage.getItem(motionKey)==='paused'; } catch { /* Private mode keeps this visit's choice. */ }
  function syncMotion() {
    const paused=media.matches || optedOut || document.hidden;
    document.documentElement.dataset.motion=paused?'paused':'running';
    button.disabled=media.matches;
    button.setAttribute('aria-pressed',String(paused));
    document.querySelector('#motion-label').textContent=media.matches?'靜態模式':optedOut?'開啟動態':'暫停動態';
    document.querySelector('#motion-hint').textContent=media.matches?'已依裝置的減少動態設定，停止所有裝飾動畫。':'控制月光與裝飾星點的動畫。';
  }
  button.addEventListener('click',()=>{
    optedOut=!optedOut;
    try { localStorage.setItem(motionKey,optedOut?'paused':'running'); } catch { /* Keep control functional without storage. */ }
    syncMotion();
  });
  media.addEventListener('change',syncMotion);
  document.addEventListener('visibilitychange',syncMotion);
  syncMotion();

  const aura=document.createElement('span');aura.className='lunar-aura';aura.setAttribute('aria-hidden','true');
  document.querySelector('.moon-frame').prepend(aura);
  const regions=[...document.querySelectorAll('.night,.paper,.feedback-section,.sky-paper-transition')];
  const fields=regions.map((region,index)=>{
    const layer=document.createElement('div');layer.className='sky-layer';layer.setAttribute('aria-hidden','true');
    region.prepend(layer);
    return {region,layer,seed:20260925+index*77};
  });
  let queued;
  const render=()=>{cancelAnimationFrame(queued);queued=requestAnimationFrame(()=>fields.forEach(({region,layer,seed})=>drawField(region,layer,seed)));};
  const observer=new ResizeObserver(render);
  regions.forEach(region=>observer.observe(region));
  document.fonts.ready.then(render);
  render();
}
