#!/usr/bin/env node

/**
 * Test script for Supabase API integration
 * Tests authentication and basic data fetching
 */

const SUPABASE_URL = 'https://eslabobvkchgpokxszwv.supabase.co/functions/v1';
const TEST_ADDRESS = '0x28774ab954386ad7a004b96523b34e483ee3d10b';

async function testEndpoint(name, url, method = 'GET', body = null, headers = {}) {
  console.log(`\n📡 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${method}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return data;
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   ❌ Error:`, data);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Supabase API Integration Tests');
  console.log('==========================================');
  
  // Test 1: Authentication endpoint (without actual signature)
  console.log('\n1️⃣ Testing Authentication Endpoint Structure');
  await testEndpoint(
    'auth-wallet-verify (structure test)',
    `${SUPABASE_URL}/auth-wallet-verify`,
    'POST',
    {
      message: 'test',
      signature: '0xtest',
      address: TEST_ADDRESS,
      app_id: 'banana'
    }
  );
  
  // Test 2: Public endpoints (no auth required)
  console.log('\n2️⃣ Testing Public Endpoints');
  
  await testEndpoint(
    'leaderboard-global',
    `${SUPABASE_URL}/leaderboard-global?limit=5`
  );
  
  await testEndpoint(
    'leaderboard-weekly',
    `${SUPABASE_URL}/leaderboard-weekly?limit=5`
  );
  
  await testEndpoint(
    'banana-payment-plans',
    `${SUPABASE_URL}/banana-payment-plans`
  );
  
  // Test 3: Use test token for authenticated endpoints
  const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTg3ZTcxNjEtZTE5ZS00NzMxLWE1NTYtNjAyMTI4YWM2YWFkIiwiYWRkcmVzcyI6IjB4Mjg3NzRhYjk1NDM4NmFkN2EwMDRiOTY1MjNiMzRlNDgzZWUzZDEwYiIsImFwcF9pZCI6ImJhbmFuYSIsImlhdCI6MTc1ODUyNjQwOSwiZXhwIjoxNzU5MTMxMjA5fQ.In76K9gIHZvy-XaB47455qjmMA5kebb6JI55sThUKuM';
  
  console.log('\n3️⃣ Testing Authenticated Endpoints (with test token)');
  
  const authHeaders = {
    'Authorization': `Bearer ${TEST_TOKEN}`
  };
  
  await testEndpoint(
    'auth-validate',
    `${SUPABASE_URL}/auth-validate`,
    'GET',
    null,
    authHeaders
  );
  
  await testEndpoint(
    'user-profile',
    `${SUPABASE_URL}/user-profile`,
    'GET',
    null,
    authHeaders
  );
  
  await testEndpoint(
    'points-balance',
    `${SUPABASE_URL}/points-balance`,
    'GET',
    null,
    authHeaders
  );
  
  await testEndpoint(
    'banana-credits-balance',
    `${SUPABASE_URL}/banana-credits-balance`,
    'GET',
    null,
    authHeaders
  );
  
  await testEndpoint(
    'referral-my-code',
    `${SUPABASE_URL}/referral-my-code`,
    'GET',
    null,
    authHeaders
  );
  
  console.log('\n==========================================');
  console.log('✨ Tests completed!');
  console.log('\nNote: Some endpoints may fail if:');
  console.log('- Database tables are not properly configured');
  console.log('- Test token has expired');
  console.log('- Endpoints require specific data');
}

// Run tests
runTests().catch(console.error);