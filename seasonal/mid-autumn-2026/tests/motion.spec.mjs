import { test, expect } from '@playwright/test';

test('moon and stars animate, can be paused without moving, and remember the choice',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const toggle=page.getByRole('button',{name:'暫停動態',exact:true});
  await expect(toggle).toBeVisible();
  await expect(page.locator('.night .sky-star').first()).toBeAttached();
  const motion=()=>page.locator('.moon-frame').evaluate(el=>getComputedStyle(el).transform);
  const start=await motion();
  await page.waitForTimeout(450);
  expect(await motion()).not.toBe(start);
  await toggle.click();
  const paused=await motion();
  await page.waitForTimeout(450);
  expect(await motion()).toBe(paused);
  await page.reload();
  await expect(page.getByRole('button',{name:'開啟動態',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'開啟動態',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion','running');
});

test('reduced motion stays static and does not remove moon or stars',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.getByRole('button',{name:'靜態模式',exact:true})).toBeDisabled();
  await expect(page.locator('html')).toHaveAttribute('data-motion','paused');
  await expect(page.locator('.moon-image')).toBeVisible();
  await expect(page.locator('.night .sky-star').first()).toBeAttached();
  const moving=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length);
  expect(moving).toBe(0);
});
