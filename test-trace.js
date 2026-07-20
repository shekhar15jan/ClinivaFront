const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => { if (msg.type() === 'error') console.log(`[error]`, msg.text().substring(0, 200)); });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message.substring(0, 200)));

  // Step 1: Go to generic login
  console.log('Step 1: goto /login');
  await page.goto('http://localhost:4201/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('URL:', page.url());

  // Step 2: Fill email and submit
  console.log('Step 2: fill email');
  await page.fill('input[type="email"]', 'admin@clinivahms.com');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  console.log('URL after submit:', page.url());

  // Step 3: Check page content
  const bodyText = await page.textContent('body');
  console.log('Page text:', bodyText?.substring(0, 300));

  // Step 4: Try to find Send OTP button
  const sendOtpBtn = page.locator('button:has-text("Send OTP")');
  const sendOtpCount = await sendOtpBtn.count();
  console.log('Send OTP buttons found:', sendOtpCount);

  // Step 5: If found, click it
  if (sendOtpCount > 0) {
    console.log('Step 5: clicking Send OTP');
    await sendOtpBtn.click();
    await page.waitForTimeout(5000);
    console.log('URL after Send OTP:', page.url());
    
    const otpInputs = page.locator('input[maxlength="1"]');
    const otpCount = await otpInputs.count();
    console.log('OTP inputs found:', otpCount);
    
    if (otpCount > 0) {
      for (let i = 0; i < Math.min(otpCount, 6); i++) {
        await otpInputs.nth(i).fill(String(i + 1));
      }
      console.log('Step 6: clicked Verify');
      await page.locator('button:has-text("Verify")').click();
      await page.waitForTimeout(5000);
      console.log('URL after Verify:', page.url());
    }
  }

  await browser.close();
})();
