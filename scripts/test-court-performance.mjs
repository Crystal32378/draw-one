#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('../paper/arrival.html', import.meta.url), 'utf8');
const between = (a,b) => html.slice(html.indexOf(a), html.indexOf(b, html.indexOf(a)));
const handlers = between('  function animate() {','  function courtAnimating()') +
  between('  view.addEventListener("pointermove",','  const release =') +
  between('  addEventListener("resize",','  function updateWalkHint()');
let queue, events, draws, rebuilds, updates, active, time;
function setup() {
  queue = new Map(); events = {}; draws = rebuilds = updates = 0; active=true; time=0;
  let id=0;
  const context = vm.createContext({
    Math, performance:{now:()=>++time},
    requestAnimationFrame: f => { queue.set(++id,f); return id; },
    cancelAnimationFrame: id => queue.delete(id),
    addEventListener: (type,fn)=>events[type]=fn,
    view:{clientWidth:390,addEventListener:(type,fn)=>events[type]=fn},
    $:()=>({classList:{contains:()=>active},style:{}}),
    applyFrame:()=>draws++, updateFacingUI:()=>updates++,
    renderCourt:()=>{rebuilds++; vm.runInContext('courtWidth = view.clientWidth',context);},
    stationCenter:i=>i*300,
  });
  vm.runInContext('let raf=0, resizeRaf=0, courtWidth=390, innerWidth=390, dragging=true, scroll=0, targetScroll=0, reduceMotion=false, velocity=0,lastX=0,lastT=0,dragStartX=0,dragStartScroll=300,hasTurned=false,stationW=300,STATIONS=[1,2,3],downTarget={},lastAnimT=0,SETTLE_TAU=80;'+handlers,context);
  return {run:s=>vm.runInContext(s,context),flush:()=>{const pending=[...queue.keys()];for(const id of pending){const f=queue.get(id);if(f){queue.delete(id);f();}}}};
}
let t=setup();
for(let i=1;i<=20;i++)events.pointermove({clientX:i});
assert.equal(queue.size,1);assert.equal(draws,0);assert.equal(t.run('scroll'),280);
t.flush();assert.equal(draws,1);assert.equal(queue.size,0);
events.pointermove({clientX:25});assert.equal(queue.size,1);
t.run('dragging=false;targetScroll=300;kick()');assert.equal(queue.size,1);
t.flush();assert.equal(draws,2);assert.ok(t.run('scroll')>275);
console.log('PASS pointer bursts coalesce, latest coordinates retained, release continues settling');
t=setup();events.resize();events.resize();assert.equal(queue.size,1);t.flush();assert.equal(rebuilds,0);t.flush();assert.equal(draws,1);assert.equal(t.run('dragging'),true);
console.log('PASS height-only resize preserves DOM and active drag; events coalesce');
t=setup();events.pointermove({clientX:20});t.run('view.clientWidth=844');events.resize();t.flush();assert.equal(rebuilds,1);assert.equal(t.run('dragging'),false);assert.equal(t.run('downTarget'),null);assert.equal(t.run('raf'),0);assert.equal(queue.size,0);
events.resize();t.flush();assert.equal(rebuilds,1);
console.log('PASS width resize rebuilds once and clears stale drag/animation state');
t=setup();active=false;events.resize();assert.equal(queue.size,0);active=true;events.resize();active=false;t.flush();assert.equal(rebuilds,0);assert.equal(draws,0);
console.log('PASS hidden court and navigation before scheduled resize do not render');
