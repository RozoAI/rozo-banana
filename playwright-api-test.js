#!/usr/bin/env node

/**
 * Playwright API test - simulates authenticated state to test API integration
 */

const { chromium } = require('playwright');

async function runAPITest() {
  console.log('🎭 Playwright API Integration Test\n');
  console.log('This test will inject a test token and verify API calls work correctly\n');
  
  const browser = await chromium.launch({ 
    headless: true, // Run headless for speed
    devtools: false
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Track API responses
  const apiResponses = {};
  
  // Intercept API calls to track them
  page.on('response', async (response) => {
    const url = response.url();
    
    if (url.includes('supabase.co/functions/v1')) {
      const endpoint = url.split('/functions/v1/')[1]?.split('?')[0];
      const status = response.status();
      
      try {
        const body = await response.json();
        apiResponses[endpoint] = { status, body };
        
        console.log(`\n📡 API Call: ${endpoint}`);
        console.log(`   Status: ${status} ${status < 400 ? '✅' : '❌'}`);
        
        if (body.success !== undefined) {
          console.log(`   Success: ${body.success}`);
          if (body.error) {
            console.log(`   Error: ${body.error}`);
          }
        }
      } catch (e) {
        // Response wasn't JSON
        apiResponses[endpoint] = { status, body: null };
      }
    }
  });
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('API') || text.includes('auth') || text.includes('Token')) {
      consoleLogs.push({ type: msg.type(), text });
    }
  });
  
  try {
    console.log('🔑 Step 1: Navigate to app and inject test token\n');
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Inject test token and user data into localStorage
    await page.evaluate(() => {
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTg3ZTcxNjEtZTE5ZS00NzMxLWE1NTYtNjAyMTI4YWM2YWFkIiwiYWRkcmVzcyI6IjB4Mjg3NzRhYjk1NDM4NmFkN2EwMDRiOTY1MjNiMzRlNDgzZWUzZDEwYiIsImFwcF9pZCI6ImJhbmFuYSIsImlhdCI6MTc1ODUyNjQwOSwiZXhwIjoxNzU5MTMxMjA5fQ.In76K9gIHZvy-XaB47455qjmMA5kebb6JI55sThUKuM';
      
      const testUser = {
        id: 'a87e7161-e19e-4731-a556-602128ac6aad',
        address: '0x28774ab954386ad7a004b96523b34e483ee3d10b',
        current_points: 0,
        lifetime_points: 0,
        level: 1
      };
      
      localStorage.setItem('rozo_token', testToken);
      localStorage.setItem('auth_token', testToken);
      localStorage.setItem('rozo_user', JSON.stringify(testUser));
      
      console.log('✅ Test token and user data injected');
    });
    
    console.log('   ✅ Token injected into localStorage\n');
    
    // Reload page to trigger authenticated state
    console.log('🔄 Step 2: Reload page with authentication\n');
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Check if authenticated UI elements appear
    console.log('🔍 Step 3: Verify authenticated state\n');
    
    const hasPoints = await page.locator('text=/Points|pts/i').first().isVisible();
    const hasCredits = await page.locator('text=/Credits/i').first().isVisible();
    
    if (hasPoints || hasCredits) {
      console.log('   ✅ Authenticated UI elements visible');
      
      // Get the displayed values
      const pointsText = await page.locator('text=/\\d+\\s*pts/').first().textContent().catch(() => null);
      const creditsText = await page.locator('text=/\\d+\\s*credits/').first().textContent().catch(() => null);
      
      if (pointsText) console.log(`   📊 Points displayed: ${pointsText}`);
      if (creditsText) console.log(`   💳 Credits displayed: ${creditsText}`);
    } else {
      console.log('   ⚠️  Authenticated elements not visible');
    }
    
    // Navigate to different routes to trigger API calls
    console.log('\n🔍 Step 4: Test route navigation and API calls\n');
    
    // Try history page
    await page.goto('http://localhost:3000/history');
    await page.waitForTimeout(2000);
    console.log('   ✅ Navigated to /history');
    
    // Check for any error messages
    const errorMessage = await page.locator('text=/error|failed|expired/i').first().textContent().catch(() => null);
    if (errorMessage) {
      console.log(`   ⚠️  Error message found: ${errorMessage}`);
    }
    
    // Navigate back to home
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('   ✅ Navigated back to home');
    
    // Summary of API calls made
    console.log('\n📊 API Call Summary:');
    console.log('━'.repeat(50));
    
    const endpoints = Object.keys(apiResponses);
    if (endpoints.length > 0) {
      for (const endpoint of endpoints) {
        const { status, body } = apiResponses[endpoint];
        const icon = status < 400 ? '✅' : '❌';
        console.log(`${icon} ${endpoint}: ${status}`);
        
        if (body?.success === false) {
          console.log(`   └─ Error: ${body.error || 'Unknown error'}`);
        }
      }
    } else {
      console.log('   ⚠️  No API calls detected');
    }
    
    // Check console logs for errors
    console.log('\n📝 Frontend Console Analysis:');
    console.log('━'.repeat(50));
    
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warn');
    
    if (errors.length > 0) {
      console.log(`   ❌ ${errors.length} errors found:`);
      errors.slice(0, 3).forEach(log => {
        console.log(`      - ${log.text.substring(0, 100)}...`);
      });
    } else {
      console.log('   ✅ No errors in console');
    }
    
    if (warnings.length > 0) {
      console.log(`   ⚠️  ${warnings.length} warnings found`);
    }
    
    // Test specific API endpoint directly
    console.log('\n🔬 Step 5: Direct API endpoint test\n');
    
    const testResponse = await page.evaluate(async () => {
      const token = localStorage.getItem('rozo_token');
      
      try {
        const response = await fetch('https://eslabobvkchgpokxszwv.supabase.co/functions/v1/points-balance', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (testResponse.error) {
      console.log(`   ❌ Direct API call failed: ${testResponse.error}`);
    } else {
      console.log(`   ✅ Direct API call successful: Status ${testResponse.status}`);
      if (testResponse.data?.success) {
        console.log(`   📊 Points balance: ${testResponse.data.data?.current_points || 0}`);
      }
    }
    
    console.log('\n✨ API Integration Test Completed!\n');
    
    // Final verdict
    const successfulCalls = Object.values(apiResponses).filter(r => r.status < 400).length;
    const failedCalls = Object.values(apiResponses).filter(r => r.status >= 400).length;
    
    console.log('📈 Test Results:');
    console.log(`   ✅ Successful API calls: ${successfulCalls}`);
    console.log(`   ❌ Failed API calls: ${failedCalls}`);
    console.log(`   📝 Console errors: ${errors.length}`);
    
    if (failedCalls === 0 && errors.length === 0) {
      console.log('\n🎉 All tests passed successfully!');
    } else {
      console.log('\n⚠️  Some issues were detected. Review the logs above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
runAPITest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});