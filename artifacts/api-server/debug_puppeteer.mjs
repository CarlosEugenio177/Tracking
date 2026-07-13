import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  console.log("Navigating...");
  
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const u = request.url();
    
    // Block navigation away from the page
    if (request.isNavigationRequest() && request.frame() === page.mainFrame() && u !== 'https://inlead.digital/agcveiculos-v1') {
       console.log("BLOCKED NAVIGATION TO:", u);
       request.abort();
       return;
    }
    
    if (u.includes('facebook') || u.includes('google-analytics') || u.includes('gtm')) {
       console.log("INTERCEPTED:", u);
    }
    request.continue();
  });

  await page.goto('https://inlead.digital/agcveiculos-v1', { waitUntil: 'networkidle2' });
  
  console.log("Waiting 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Clicking all buttons...");
  const clickables = await page.$$('button, a, [role="button"]');
  for (const el of clickables) {
     await el.evaluate(b => {
         try { 
             b.click(); 
         } catch(e) {}
     }).catch(() => {});
  }
  
  console.log("Waiting 5 seconds for events...");
  await new Promise(r => setTimeout(r, 5000));

  await browser.close();
}

run().catch(console.error);
