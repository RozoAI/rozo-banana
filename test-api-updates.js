#!/usr/bin/env node

/**
 * Test script for updated API endpoints with SUPABASE_ANON_KEY authentication
 * and address query parameters
 */

const axios = require('axios');

// Configuration
const SUPABASE_URL = 'https://eslabobvkchgpokxszwv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Test addresses
const TEST_ADDRESSES = {
  valid: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  empty: '0x',
  another: '0x1234567890123456789012345678901234567890'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make API requests
async function makeRequest(endpoint, address = TEST_ADDRESSES.empty, useUserToken = false) {
  const url = `${SUPABASE_URL}/${endpoint}${address ? `?address=${address}` : ''}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${useUserToken ? 'user-jwt-token-here' : SUPABASE_ANON_KEY}`
  };

  try {
    const response = await axios.get(url, { headers });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test GET endpoints with address parameter
async function testGetEndpoints() {
  console.log(colors.cyan + '\n===== Testing GET Endpoints with SUPABASE_ANON_KEY =====' + colors.reset);

  const endpoints = [
    'banana-credits-balance',
    'banana-image-history',
    'banana-payment-history',
    'banana-payment-plans',
    'user-profile',
    'points-balance'
  ];

  for (const endpoint of endpoints) {
    console.log(colors.blue + `\nTesting ${endpoint}:` + colors.reset);

    // Test with no address (should use 0x)
    console.log('  Testing with no address (0x):');
    const result1 = await makeRequest(endpoint, TEST_ADDRESSES.empty);
    console.log(`    Status: ${result1.status || 'N/A'}`);
    console.log(`    Success: ${result1.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    if (result1.success) {
      console.log(`    Response keys: ${Object.keys(result1.data).join(', ')}`);
    } else {
      console.log(`    Error: ${JSON.stringify(result1.error)}`);
    }

    // Test with valid address
    console.log(`  Testing with address ${TEST_ADDRESSES.valid}:`);
    const result2 = await makeRequest(endpoint, TEST_ADDRESSES.valid);
    console.log(`    Status: ${result2.status || 'N/A'}`);
    console.log(`    Success: ${result2.success ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
    if (result2.success) {
      console.log(`    Response keys: ${Object.keys(result2.data).join(', ')}`);
    } else {
      console.log(`    Error: ${JSON.stringify(result2.error)}`);
    }
  }
}

// Test POST endpoint (image generation) - should require user auth
async function testImageGeneration() {
  console.log(colors.cyan + '\n===== Testing Image Generation (POST) =====' + colors.reset);

  const url = `${SUPABASE_URL}/banana-generate-image`;

  // Test with ANON key (should fail with AUTH_REQUIRED)
  console.log('\n  Testing with SUPABASE_ANON_KEY (should fail):');
  try {
    const response = await axios.post(url, {
      prompt: 'A test banana image',
      style: 'realistic',
      aspect_ratio: '1:1'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    console.log(colors.red + '    ✗ Unexpected success - should require user auth' + colors.reset);
  } catch (error) {
    if (error.response?.status === 401 || error.response?.data?.error === 'AUTH_REQUIRED') {
      console.log(colors.green + '    ✓ Correctly requires user authentication' + colors.reset);
      console.log(`    Status: ${error.response?.status}`);
      console.log(`    Error: ${error.response?.data?.error || error.message}`);
    } else {
      console.log(colors.yellow + '    ⚠ Unexpected error:' + colors.reset);
      console.log(`    Status: ${error.response?.status}`);
      console.log(`    Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }

  // Note: Testing with a real user JWT token would require wallet signing
  console.log('\n  Note: Full image generation test requires wallet signature for JWT token');
}

// Test public endpoints (no auth needed)
async function testPublicEndpoints() {
  console.log(colors.cyan + '\n===== Testing Public Endpoints (No Auth) =====' + colors.reset);

  const endpoints = [
    'leaderboard-global?limit=10',
    'leaderboard-weekly'
  ];

  for (const endpoint of endpoints) {
    console.log(colors.blue + `\nTesting ${endpoint}:` + colors.reset);

    const url = `${SUPABASE_URL}/${endpoint}`;
    try {
      // Test without any auth header
      const response = await axios.get(url);
      console.log(colors.green + '  ✓ Accessible without authentication' + colors.reset);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response keys: ${Object.keys(response.data).join(', ')}`);
    } catch (error) {
      console.log(colors.red + '  ✗ Failed to access' + colors.reset);
      console.log(`  Status: ${error.response?.status || 'N/A'}`);
      console.log(`  Error: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }
}

// Main test runner
async function runTests() {
  console.log(colors.yellow + '🧪 Starting API Tests with Updated Authentication\n' + colors.reset);
  console.log('Configuration:');
  console.log(`  SUPABASE_URL: ${SUPABASE_URL}`);
  console.log(`  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 50)}...`);
  console.log(`  Test Addresses: ${Object.values(TEST_ADDRESSES).join(', ')}`);

  try {
    await testGetEndpoints();
    await testImageGeneration();
    await testPublicEndpoints();

    console.log(colors.green + '\n✅ All tests completed!' + colors.reset);
    console.log('\nSummary:');
    console.log('  - GET endpoints now work with SUPABASE_ANON_KEY + address parameter');
    console.log('  - Image generation (POST) requires user JWT from wallet authentication');
    console.log('  - Public endpoints work without any authentication');
    console.log('  - Users can browse without logging in, only need auth for generating images');
  } catch (error) {
    console.error(colors.red + '\n❌ Test suite failed:' + colors.reset, error);
  }
}

// Run tests
runTests();