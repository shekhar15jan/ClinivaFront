const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => { if(msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('=== TEST 1: /CLINIVA/login ===');
  await page.goto('http://localhost:4201/CLINIVA/login');
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());
  const buttons1 = await page.locator('button').allTextContents();
  console.log('Buttons:', JSON.stringify(buttons1));
  const sendOtp = await page.locator('button:has-text("Send OTP")').count();
  console.log('Send OTP buttons:', sendOtp);
  
  console.log('\n=== TEST 2: Full login flow ===');
  await page.goto('http://localhost:4201/login');
  await page.waitForTimeout(2000);
  console.log('Generic login URL:', page.url());
  const genericBtns = await page.locator('button').allTextContents();
  console.log('Generic buttons:', JSON.stringify(genericBtns));
  
  await page.fill('input[type="email"]', 'admin@clinivahms.com');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  
  console.log('After Continue URL:', page.url());
  const afterBtns = await page.locator('button').allTextContents();
  console.log('After Continue buttons:', JSON.stringify(afterBtns));
  
  const sendOtp2 = await page.locator('button:has-text("Send OTP")').count();
  console.log('Send OTP buttons:', sendOtp2);
  
  if (sendOtp2 > 0) {
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForTimeout(3000);
    console.log('After Send OTP URL:', page.url());
    
    const otpInputs = await page.locator('input[maxlength="1"]').count();
    console.log('OTP input count:', otpInputs);
    
    if (otpInputs >= 6) {
      const digits = '123456';
      for (let i = 0; i < 6; i++) {
        await page.locator('input[maxlength="1"]').nth(i).fill(digits[i]);
      }
      await page.locator('button:has-text("Verify")').click();
      await page.waitForTimeout(3000);
      console.log('After Verify URL:', page.url());
    }
  }
  
  await browser.close();
})();
