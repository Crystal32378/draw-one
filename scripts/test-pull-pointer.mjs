import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../paper/arrival.html',import.meta.url),'utf8');
const block=html.slice(html.indexOf('  const PULL_DIST ='),html.indexOf('  function uniformDraw('));
const ev=(y,id=1)=>({clientY:y,pointerId:id,button:0,isPrimary:true,preventDefault(){}});
let clock=0;
function setup(){
 const events={},capture=new Set();let drawn=0;
 const tube={style:{},addEventListener:(t,f)=>events['tube:'+t]=f,setPointerCapture:id=>capture.add(id),releasePointerCapture:id=>capture.delete(id),hasPointerCapture:id=>capture.has(id)},stick={style:{}};
 const context=vm.createContext({$:id=>id==='tubeWrap'?tube:stick,POOL:true,DEVDRAW:false,navigator:{},performance:{now:()=>++clock},window:{addEventListener:(t,f)=>events[t]=f},completeDraw:()=>drawn++});
 vm.runInContext(block,context);return {events,capture,drawn:()=>drawn};
}
let t=setup();t.events['tube:pointerdown'](ev(300));assert(t.capture.has(1));t.events.pointermove(ev(200));t.events.pointerup(ev(150));assert.equal(t.drawn(),1);assert.equal(t.capture.size,0);t.events.pointerup(ev(100));assert.equal(t.drawn(),1);
console.log('PASS final pointerup position completes a qualifying pull exactly once');
t=setup();t.events['tube:pointerdown'](ev(300));t.events.pointermove(ev(100,2));t.events.pointerup(ev(100,2));assert.equal(t.drawn(),0);assert(t.capture.has(1));t.events.pointerup(ev(150));assert.equal(t.drawn(),1);
console.log('PASS other pointer cannot complete or cancel active pull');
t=setup();t.events['tube:pointerdown'](ev(300));t.events.pointerup(ev(270));assert.equal(t.drawn(),0);assert.equal(t.capture.size,0);t.events['tube:pointerdown'](ev(300));t.events.pointermove(ev(150));assert.equal(t.drawn(),1);
console.log('PASS short pull (<40%) does not draw even when released fast; a following valid pull works');
for(const cancel of ['pointercancel','tube:lostpointercapture','blur']){t=setup();t.events['tube:pointerdown'](ev(300));t.events[cancel](ev(100));assert.equal(t.drawn(),0);t.events.pointerup(ev(100));assert.equal(t.drawn(),0);t.events['tube:pointerdown'](ev(300));t.events.pointerup(ev(150));assert.equal(t.drawn(),1);}
console.log('PASS cancellation, capture loss and blur never draw and allow retry');
t=setup();t.events['tube:pointerdown'](ev(300));t.events.pointermove(ev(290));t.events.pointerup(ev(262));assert.equal(t.drawn(),1);
console.log('PASS flick: released while still moving up past 40% draws');
for(const cancel of ['pointercancel','tube:lostpointercapture','blur']){t=setup();t.events['tube:pointerdown'](ev(300));t.events.pointermove(ev(290));t.events.pointermove(ev(250));t.events[cancel](ev(250));assert.equal(t.drawn(),0,cancel);}
console.log('PASS cancellation mid-flick never draws');
