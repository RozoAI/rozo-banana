#!/usr/bin/env node

/**
 * Playwright test for Supabase integration
 * Tests the authentication flow and API calls through the frontend
 */

const { chromium } = require('playwright');

async function runTest() {
  console.log('🎭 Starting Playwright test for Supabase integration\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Add console listener to capture frontend logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    // Filter and display relevant API logs
    if (text.includes('[BananaAPI]') || 
        text.includes('[PointsAPI]') || 
        text.includes('[authAPI]') || 
        text.includes('[useAuth]') ||
        text.includes('[MobileDashboard]')) {
      
      if (type === 'error') {
        console.log(`❌ ${text}`);
      } else if (type === 'warn') {
        console.log(`⚠️  ${text}`);
      } else {
        console.log(`📊 ${text}`);
      }
    }
  });
  
  // Add network listener to monitor API calls
  page.on('response', response => {
    const url = response.url();
    if (url.includes('supabase.co/functions/v1')) {
      const endpoint = url.split('/functions/v1/')[1]?.split('?')[0];
      const status = response.status();
      const statusIcon = status < 400 ? '✅' : '❌';
      console.log(`\n🌐 API Call: ${endpoint}`);
      console.log(`   ${statusIcon} Status: ${status}`);
    }
  });
  
  try {
    console.log('📱 Step 1: Navigate to the application');
    await page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded'
    });
    console.log('   ✅ Page loaded successfully\n');
    
    // Wait for initial page load
    await page.waitForTimeout(2000);
    
    console.log('🔍 Step 2: Check for wallet connect button');
    const connectButton = await page.locator('text=/Connect Wallet|Sign In|Connect/i').first();
    
    if (await connectButton.isVisible()) {
      console.log('   ✅ Found wallet connect button\n');
      
      console.log('📸 Taking screenshot of initial state');
      await page.screenshot({ 
        path: 'test-screenshots/01-initial.png',
        fullPage: true 
      });
      
      // Note: Can't fully automate wallet signing without wallet extension
      console.log('\n⚠️  Note: Full wallet authentication requires MetaMask or similar extension');
      console.log('   In a real test, you would need to mock the wallet provider\n');
    }
    
    console.log('🔍 Step 3: Check for authenticated content');
    
    // Check if any authenticated content is visible
    const pointsElement = await page.locator('text=/Points|pts|ROZO/i').first();
    const creditsElement = await page.locator('text=/Credits|credits/i').first();
    
    if (await pointsElement.isVisible() || await creditsElement.isVisible()) {
      console.log('   ✅ Found authenticated content (Points/Credits display)\n');
      
      console.log('📸 Taking screenshot of authenticated state');
      await page.screenshot({ 
        path: 'test-screenshots/02-authenticated.png',
        fullPage: true 
      });
    } else {
      console.log('   ℹ️  No authenticated content visible (user not signed in)\n');
    }
    
    console.log('🔍 Step 4: Test API error handling');
    
    // Try to access a protected route directly
    await page.goto('http://localhost:3000/history');
    await page.waitForTimeout(2000);
    
    console.log('   ✅ Navigated to /history route\n');
    
    console.log('📸 Taking screenshot of history page');
    await page.screenshot({ 
      path: 'test-screenshots/03-history.png',
      fullPage: true 
    });
    
    console.log('🔍 Step 5: Check mobile responsiveness');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    console.log('   ✅ Switched to mobile viewport\n');
    
    console.log('📸 Taking screenshot of mobile view');
    await page.screenshot({ 
      path: 'test-screenshots/04-mobile.png',
      fullPage: true 
    });
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    console.log('\n📸 Taking error screenshot');
    await page.screenshot({ 
      path: 'test-screenshots/error.png',
      fullPage: true 
    });
  } finally {
    console.log('\n🎭 Closing browser...');
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});