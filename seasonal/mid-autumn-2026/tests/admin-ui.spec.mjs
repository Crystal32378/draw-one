import {test,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const dir='/tmp/drawone-midautumn-admin-ui-tests';
const fixture={id:'ui-fixture',q1:'會',q2:'收藏到籤簿',q3:'<img src=x onerror=alert(1)> 這是測試文字',submittedAt:'2026-09-25T12:00:00Z'};
test('local manager reads actual answers as text, exports CSV, and distinguishes empty from failure',async({page})=>{
 await mkdir(dir,{recursive:true});await writeFile(dir+'/feedback.jsonl',JSON.stringify(fixture)+'\n');
 await page.goto('http://127.0.0.1:4176/');
 await expect(page.locator('#total')).toHaveText('1');
 await expect(page.locator('.response-text')).toHaveText(fixture.q3);
 await expect(page.locator('.response-text img')).toHaveCount(0);
 const downloaded=page.waitForEvent('download');await page.getByRole('link',{name:'匯出 CSV'}).click();
 const file=await downloaded;expect(await readFile(await file.path(),'utf8')).toContain('收藏到籤簿');
 await writeFile(dir+'/feedback.jsonl','{broken\n');await page.getByRole('button',{name:'重新讀取'}).click();
 await expect(page.locator('#error')).toBeVisible();await expect(page.locator('#summary')).toBeHidden();await expect(page.locator('#empty')).toBeHidden();
 await writeFile(dir+'/feedback.jsonl','');await page.getByRole('button',{name:'重新讀取'}).click();
 await expect(page.locator('#empty')).toBeVisible();await expect(page.locator('#total')).toHaveText('0');await expect(page.locator('#error')).toBeHidden();
 await page.screenshot({path:'evidence/admin-empty-mobile.png'});
});
