const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('npm run preview');
  await new Promise(r => setTimeout(r, 2000));
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`BROWSER-CONSOLE [${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`BROWSER-ERROR:`, err.message, err.stack));
  
  try {
    await page.goto('http://localhost:4173/', { timeout: 5000 });
    await page.waitForTimeout(2000);
  } catch(e) {}
  
  await browser.close();
  server.kill();
  process.exit(0);
})();
