import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('mobile survey validates, retains answers across back navigation, and saves before thanks',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await page.locator('#feedback').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'下一題'}).click();
  await expect(page.getByRole('alert')).toContainText('先選一個');
  await page.getByRole('radio',{name:'也許',exact:true}).check();
  await page.getByRole('button',{name:'下一題'}).click();
  await page.getByRole('radio',{name:'看籤詩與依據',exact:true}).check();
  await page.getByRole('button',{name:'上一題'}).click();
  await expect(page.getByRole('radio',{name:'也許',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'下一題'}).click();
  await expect(page.getByRole('radio',{name:'看籤詩與依據',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'下一題'}).click();
  const note='測試回覆：希望記得當時的問題。';
  await page.getByRole('textbox',{name:'如果下次打開'}).fill(note);
  await page.getByRole('button',{name:'送出回覆'}).click();
  await expect(page.locator('#thanks')).toBeVisible();
  await expect(page.locator('#thanks-title')).toContainText('中秋平安。');
  const lines=(await readFile('/tmp/drawone-midautumn-e2e-data/feedback.jsonl','utf8')).trim().split('\n');
  expect(lines.some(line=>{const v=JSON.parse(line);return v.q1==='也許'&&v.q2==='看籤詩與依據'&&v.q3===note})).toBe(true);
  await expect(page.getByRole('link',{name:'再抽一籤'})).toHaveAttribute('href','https://draw-one-crystals-projects-0006cdef.vercel.app/');
  expect(errors).toEqual([]);
  await page.screenshot({path:'evidence/prototype-mobile-thanks.png'});
});

test('failed submission keeps the form and answers, then can retry without false success',async({page})=>{
  await page.goto('/');
  await page.getByRole('radio',{name:'會',exact:true}).check();await page.getByRole('button',{name:'下一題'}).click();
  await page.getByRole('radio',{name:'抽籤本身',exact:true}).check();await page.getByRole('button',{name:'下一題'}).click();
  await page.locator('#q3').fill('測試回覆：失敗後仍保留');
  await page.route('**/api/feedback',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'暫時無法送出，回答仍留在這裡。請稍後再試。'})}));
  await page.getByRole('button',{name:'送出回覆'}).click();
  await expect(page.getByRole('alert')).toContainText('暫時無法送出');
  await expect(page.locator('#thanks')).toBeHidden();
  await expect(page.locator('#q3')).toHaveValue('測試回覆：失敗後仍保留');
  await page.unroute('**/api/feedback');
  await page.getByRole('button',{name:'再試一次'}).click();
  await expect(page.locator('#thanks')).toBeVisible();
});

test('moon notes are accessible, close with Escape, and return focus; AI is labeled preview',async({page})=>{
  await page.goto('/');
  const button=page.getByRole('button',{name:'觀月札記'});
  await button.click();
  await expect(page.getByRole('dialog',{name:'同一輪月'})).toBeVisible();
  await expect(page.locator('#moon-notes')).toContainText('不是台灣即時星圖');
  await page.screenshot({path:'evidence/prototype-moon-notes.png'});
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await page.getByRole('button',{name:'新體驗預告'}).click();
  await expect(page.locator('#preview-notes')).toContainText('尚未提供');
  await page.getByRole('button',{name:'留個想法'}).click();
  await expect(page.locator('#preview-notes')).toBeHidden();
});

test('share fallback provides the public product link and survives denied clipboard',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined});Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied')}}});});
  await page.goto('/');
  await page.locator('footer').getByRole('button',{name:'分享給朋友'}).click();
  await expect(page.locator('#share-url')).toHaveValue('https://draw-one-crystals-projects-0006cdef.vercel.app/');
  await page.getByRole('button',{name:'複製連結'}).click();
  await expect(page.locator('#copy-status')).toContainText('請長按或選取');
});

test('mobile and desktop fit the viewport with working fonts and image',async({page})=>{
  for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:width>1000?1000:844});
    await page.goto('/');
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator('.moon-image').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    if([390,1440].includes(width)) {
      await page.screenshot({path:`evidence/prototype-${width}-full.png`,fullPage:true});
      await page.screenshot({path:`evidence/prototype-${width}-hero.png`});
    }
  }
});

test('completion replaces the entire survey invitation and default sharing omits author credit',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:async(data)=>{window.sharedPayload=data;}});});
  await page.goto('/');
  await expect(page.locator('#thanks')).toBeHidden();
  await page.getByRole('radio',{name:'會',exact:true}).check();await page.getByRole('button',{name:'下一題'}).click();
  await page.getByRole('radio',{name:'收藏到籤簿',exact:true}).check();await page.getByRole('button',{name:'下一題'}).click();
  await page.getByRole('button',{name:'送出回覆'}).click();
  await expect(page.locator('#thanks')).toBeVisible();
  await expect(page.locator('.feedback-intro')).toBeHidden();
  await expect(page.locator('#feedback-form')).toBeHidden();
  await expect(page.getByText('三個問題，約半分鐘。')).toBeHidden();
  await page.locator('#thanks').getByRole('button',{name:'分享給朋友'}).click();
  const share=await page.evaluate(()=>window.sharedPayload);
  expect(share.text).toContain('中秋平安');
  expect(JSON.stringify(share)).not.toContain('Astra');
  await expect(page.locator('footer')).toContainText('Astra');
  await expect(page.locator('.signature-star')).toHaveCount(0);
});
