import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {buildNetlify} from '../scripts/build-netlify.mjs';

test('published form transport keeps failed answers and shows thanks only after a successful POST',async({page})=>{
 const {outDir}=await buildNetlify();
 const config=await readFile(outDir+'/feedback-config.js','utf8');
 await page.route('**/feedback-config.js',route=>route.fulfill({contentType:'text/javascript',body:config}));
 const posts=[];let fail=true;let localCalls=0;
 page.on('request',request=>{if(request.url().includes('/api/feedback'))localCalls++;});
 await page.route('http://127.0.0.1:4174/',route=>{
  if(route.request().method()!=='POST')return route.continue();
  posts.push(new URLSearchParams(route.request().postData()));
  return route.fulfill({status:fail?503:200,contentType:'text/html',body:fail?'Unavailable':'<html>Received by Netlify</html>'});
 });
 await page.goto('/');
 await expect(page.locator('form[data-netlify="true"]')).toBeHidden();
 await page.getByRole('radio',{name:'也許',exact:true}).check();await page.getByRole('button',{name:'下一題'}).click();
 await page.getByRole('radio',{name:'看籤詩與依據',exact:true}).check();await page.getByRole('button',{name:'下一題'}).click();
 const answer='[TEST] 記得 A+B & 月光 = 原文？';await page.locator('#q3').fill(answer);
 await page.getByRole('button',{name:'送出回覆'}).click();
 await expect(page.locator('#form-error')).toContainText('暫時無法送出');
 await expect(page.locator('#thanks')).toBeHidden();await expect(page.locator('#q3')).toHaveValue(answer);
 await expect(page.locator('.feedback-intro')).toBeVisible();
 fail=false;await page.getByRole('button',{name:'再試一次'}).click();
 await expect(page.locator('#thanks')).toBeVisible();await expect(page.locator('.feedback-intro')).toBeHidden();
 expect(localCalls).toBe(0);expect(posts).toHaveLength(2);
 for(const body of posts){expect(body.get('form-name')).toBe('draw-one-midautumn-2026');expect(body.get('q1')).toBe('也許');expect(body.get('q2')).toBe('看籤詩與依據');expect(body.get('q3')).toBe(answer);}
 expect(posts[0].get('submission-id')).toBe(posts[1].get('submission-id'));
});
