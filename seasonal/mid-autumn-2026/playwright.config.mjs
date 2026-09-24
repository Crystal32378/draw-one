import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'*.spec.mjs',fullyParallel:false,workers:1,
  use:{baseURL:'http://127.0.0.1:4174',channel:'chrome',headless:true,viewport:{width:390,height:844},reducedMotion:'reduce'},
  webServer:[
    {command:'PORT=4174 FEEDBACK_DIR=/tmp/drawone-midautumn-e2e-data node server.mjs',url:'http://127.0.0.1:4174',reuseExistingServer:false},
    {command:'ADMIN_PORT=4176 FEEDBACK_DIR=/tmp/drawone-midautumn-admin-ui-tests node admin-server.mjs',url:'http://127.0.0.1:4176',reuseExistingServer:false}
  ],
  reporter:'list'
});
