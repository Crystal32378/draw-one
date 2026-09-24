import { initSky } from './sky.js?v=3';
import { submitFeedback } from './feedback-client.js?v=1';
initSky();

const $ = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const productUrl = 'https://draw-one-crystals-projects-0006cdef.vercel.app/';

// Modal dialogs keep keyboard focus inside; Escape and backdrop dismiss them.
function openDialog(dialog) { dialog.showModal(); document.documentElement.style.overflow = 'hidden'; }
function closeDialog(dialog) { dialog.close(); }
all('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => { document.documentElement.style.overflow = ''; });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if(event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closeDialog(dialog);
  });
});
all('[data-open-notes]').forEach(button => button.addEventListener('click', () => openDialog($('#moon-notes'))));
all('[data-open-preview]').forEach(button => button.addEventListener('click', () => openDialog($('#preview-notes'))));
$('#preview-feedback').addEventListener('click', () => {
  closeDialog($('#preview-notes'));
  $('#feedback').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  setTimeout(() => all('fieldset')[step].querySelector('legend').focus({preventScroll:true}),0);
});

const form = $('#feedback-form');
const fields = all('[data-step]');
let step = 0;
let sending = false;
const responseId = crypto.randomUUID();
const error = $('#form-error');

function setStep(next) {
  step = next;
  fields.forEach((field,index) => { field.hidden = index !== step; });
  $('#survey-count').textContent = `${['一','二','三'][step]} / 三`;
  all('.survey-progress > span').forEach((bar,index) => {
    bar.classList.toggle('is-current',index === step);
    bar.classList.toggle('is-complete',index < step);
  });
  $('#previous').hidden = step === 0;
  $('#survey-tip').hidden = step !== 0;
  $('#next').hidden = step === 2;
  $('#submit').hidden = step !== 2;
  error.textContent = '';
  fields[step].querySelector('legend').focus({preventScroll:true});
  // Do not jump if the question is already comfortably in view.
  const rect = $('#survey-paper').getBoundingClientRect();
  if(rect.top < -40 || rect.top > innerHeight * .6) $('#survey-paper').scrollIntoView({block:'start',behavior:'instant'});
}
function nextStep() {
  if(sending) return;
  if(step < 2 && !form.querySelector(`input[name="q${step+1}"]:checked`)) {
    error.textContent = '請先選一個答案。';
    fields[step].querySelector('input').focus({preventScroll:true});
    return;
  }
  if(step < 2) setStep(step+1);
}
$('#next').addEventListener('click',nextStep);
$('#previous').addEventListener('click',() => { if(!sending) setStep(step-1); });
form.addEventListener('change',() => { error.textContent=''; });
function updateCount(event) {
  if(event?.isComposing) return;
  const letters = [...$('#q3').value];
  if(letters.length > 200) $('#q3').value = letters.slice(0,200).join('');
  $('#q3-count').textContent = `${[...$('#q3').value].length} / 200`;
}
$('#q3').addEventListener('input', updateCount);
$('#q3').addEventListener('compositionend',updateCount);

form.addEventListener('submit', async event => {
  event.preventDefault();
  if(sending) return;
  if(step < 2) { nextStep(); return; }
  const values = new FormData(form);
  if(!values.get('q1')) { setStep(0); nextStep(); return; }
  if(!values.get('q2')) { setStep(1); nextStep(); return; }
  updateCount();
  const payload = {id:responseId,q1:values.get('q1'),q2:values.get('q2'),q3:$('#q3').value};
  sending = true;
  error.textContent = '';
  $('#submit').textContent = '正在送出…';
  all('#feedback-form button, #feedback-form input, #feedback-form textarea').forEach(control => {control.disabled=true;});
  form.setAttribute('aria-busy','true');
  try {
    await submitFeedback(payload, { honeypot: String(values.get('bot-field') || '') });
    $('#survey-content').hidden = true;
    $('.feedback-intro').hidden = true;
    $('.feedback-layout').classList.add('is-complete');
    $('#feedback').setAttribute('aria-labelledby','thanks-title');
    $('#thanks').hidden = false;
    $('#thanks-title').focus({preventScroll:true});
    const rect = $('#survey-paper').getBoundingClientRect();
    if(rect.top < 0 || rect.bottom > innerHeight) $('#survey-paper').scrollIntoView({block:'center',behavior:'instant'});
  } catch(err) {
    error.textContent = err.name === 'TimeoutError' || err instanceof TypeError || err instanceof SyntaxError
      ? '暫時連不上。回答還留在這裡，請稍後再試一次。'
      : err.message;
    $('#submit').textContent = '再試一次 ↗';
  } finally {
    sending = false;
    all('#feedback-form button, #feedback-form input, #feedback-form textarea').forEach(control => {control.disabled=false;});
    form.removeAttribute('aria-busy');
  }
});

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent=message;
  $('#toast').classList.add('visible');
  toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);
}
const isLocal = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const shareUrl = isLocal ? productUrl : new URL(location.pathname,location.origin).href;
function shareFallback() {
  $('#share-url').value=shareUrl;
  $('#share-explanation').textContent=isLocal
    ? '這是本機預覽。分享會帶朋友前往正式的 Draw One。'
    : '複製這個連結，傳給想一起看月亮的人。';
  $('#copy-status').textContent='';
  openDialog($('#share-fallback'));
}
all('[data-share]').forEach(button => button.addEventListener('click', async() => {
  if(navigator.share) {
    try {await navigator.share({title:'Draw One｜月圓了。',text:'月圓了。你最近，有沒有一件想問的事？一起觀月、抽籤。中秋平安。',url:shareUrl});return;}
    catch(err) {if(err.name==='AbortError') return;}
  }
  shareFallback();
}));
$('#copy-share').addEventListener('click',async()=>{
  try {
    await navigator.clipboard.writeText(shareUrl);
    $('#copy-status').textContent='連結已複製，可以傳給朋友了。';
    toast('連結已複製。把這輪月，帶給朋友。');
  } catch {
    $('#share-url').focus();$('#share-url').select();
    $('#copy-status').textContent='瀏覽器未允許自動複製。請長按或選取上方連結來複製。';
  }
});
