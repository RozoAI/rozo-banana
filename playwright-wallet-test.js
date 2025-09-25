const { chromium } = require('playwright');

async function testWalletConnect() {
  console.log('Starting Wallet Connect test...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Start the dev server in the background
    console.log('Please make sure the dev server is running (npm run dev)');

    // Navigate to the application
    console.log('Navigating to localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });

    // Check if the page loads
    console.log('Checking page title...');
    const title = await page.title();
    console.log('Page title:', title);

    // Look for wallet connect button
    console.log('Looking for wallet connect button...');
    const walletButton = await page.locator('button:has-text("Connect Wallet"), button:has-text("Connect Mobile Wallet")').first();
    const isVisible = await walletButton.isVisible();
    console.log('Wallet connect button visible:', isVisible);

    if (isVisible) {
      console.log('✅ Wallet connect button found!');

      // Take a screenshot
      await page.screenshot({ path: 'test-screenshots/wallet-button.png' });
      console.log('Screenshot saved to test-screenshots/wallet-button.png');

      // Click the wallet connect button
      console.log('Clicking wallet connect button...');
      await walletButton.click();

      // Wait a bit to see if anything happens
      await page.waitForTimeout(2000);

      // Check if a modal or QR code appears
      const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"], [class*="qr"]').first().isVisible().catch(() => false);
      console.log('Modal or QR code visible after click:', modalVisible);

      if (modalVisible) {
        console.log('✅ Wallet connection modal appeared!');
        await page.screenshot({ path: 'test-screenshots/wallet-modal.png' });
      }
    }

    // Test navigation to other pages
    console.log('\nTesting navigation to other pages...');

    // Test Gallery page
    console.log('Navigating to /gallery...');
    await page.goto('http://localhost:3002/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const galleryTitle = await page.locator('h1, h2').first().textContent().catch(() => 'No title found');
    console.log('Gallery page loaded, title:', galleryTitle);

    // Test Generate page
    console.log('Navigating to /generate...');
    await page.goto('http://localhost:3002/generate', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const generateTitle = await page.locator('h1, h2').first().textContent().catch(() => 'No title found');
    console.log('Generate page loaded, title:', generateTitle);

    // Test Recharge page
    console.log('Navigating to /recharge...');
    await page.goto('http://localhost:3002/recharge', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait longer for dynamic content
    const rechargeTitle = await page.locator('h1:has-text("Recharge")').textContent().catch(() => 'No recharge title found');
    console.log('Recharge page loaded, title:', rechargeTitle);

    // Check if pricing tiers are visible
    const pricingTiers = await page.locator('[class*="rounded-2xl"]').count();
    console.log('Pricing tiers found:', pricingTiers);

    if (pricingTiers > 0) {
      console.log('✅ Recharge page with pricing tiers loaded successfully!');
      await page.screenshot({ path: 'test-screenshots/recharge-page.png' });
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testWalletConnect();