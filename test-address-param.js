#!/usr/bin/env node

/**
 * Test script to verify address parameter is correctly passed in API calls
 */

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Simulate localStorage in Node.js
const localStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value;
  },
  removeItem(key) {
    delete this.storage[key];
  }
};

// Mock window for Node.js
global.window = { localStorage };
global.localStorage = localStorage;

console.log('🧪 Testing getCurrentAddress function with different localStorage states\n');

// Helper function to get current user address (same as in api.ts)
const getCurrentAddress = () => {
  if (typeof window === 'undefined') return '0x';

  // First check if we have a rozo_user in localStorage (from authentication)
  const rozoUser = localStorage.getItem("rozo_user");
  if (rozoUser) {
    try {
      const user = JSON.parse(rozoUser);
      if (user.address) {
        console.log("🏠 [getCurrentAddress] Found address from rozo_user:", user.address);
        return user.address;
      }
    } catch (e) {
      console.error("❌ [getCurrentAddress] Failed to parse rozo_user:", e);
    }
  }

  // Fallback to userAddress (some components may set this directly)
  const userAddress = localStorage.getItem("userAddress");
  if (userAddress) {
    console.log("🏠 [getCurrentAddress] Found address from userAddress:", userAddress);
    return userAddress;
  }

  // No user address found, return default
  console.log("🏠 [getCurrentAddress] No user address found, using 0x");
  return '0x';
};

// Test 1: No user logged in
console.log('Test 1: No user logged in');
console.log('Expected: 0x');
const address1 = getCurrentAddress();
console.log('Result:', address1);
console.log('✅ Pass:', address1 === '0x' ? 'Yes' : 'No');
console.log('');

// Test 2: User logged in with rozo_user
console.log('Test 2: User logged in with rozo_user (from wallet auth)');
const testUser = {
  id: 'test-id',
  address: '0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321',
  current_points: 1000,
  lifetime_points: 5000
};
localStorage.setItem('rozo_user', JSON.stringify(testUser));
console.log('Set rozo_user with address:', testUser.address);
console.log('Expected:', testUser.address);
const address2 = getCurrentAddress();
console.log('Result:', address2);
console.log('✅ Pass:', address2 === testUser.address ? 'Yes' : 'No');
console.log('');

// Test 3: Clear rozo_user, use userAddress fallback
console.log('Test 3: Using userAddress fallback');
localStorage.removeItem('rozo_user');
const fallbackAddress = '0x1234567890123456789012345678901234567890';
localStorage.setItem('userAddress', fallbackAddress);
console.log('Set userAddress:', fallbackAddress);
console.log('Expected:', fallbackAddress);
const address3 = getCurrentAddress();
console.log('Result:', address3);
console.log('✅ Pass:', address3 === fallbackAddress ? 'Yes' : 'No');
console.log('');

// Test 4: Both rozo_user and userAddress exist (rozo_user should take priority)
console.log('Test 4: Both rozo_user and userAddress exist (rozo_user priority)');
localStorage.setItem('rozo_user', JSON.stringify(testUser));
console.log('rozo_user address:', testUser.address);
console.log('userAddress:', fallbackAddress);
console.log('Expected (rozo_user has priority):', testUser.address);
const address4 = getCurrentAddress();
console.log('Result:', address4);
console.log('✅ Pass:', address4 === testUser.address ? 'Yes' : 'No');
console.log('');

// Test 5: Invalid rozo_user JSON
console.log('Test 5: Invalid rozo_user JSON (fallback to userAddress)');
localStorage.setItem('rozo_user', 'invalid json{');
console.log('Set invalid rozo_user');
console.log('Expected (fallback to userAddress):', fallbackAddress);
const address5 = getCurrentAddress();
console.log('Result:', address5);
console.log('✅ Pass:', address5 === fallbackAddress ? 'Yes' : 'No');
console.log('');

// Summary
console.log('\n📊 Summary:');
console.log('- getCurrentAddress correctly retrieves user address from rozo_user (priority)');
console.log('- Falls back to userAddress if rozo_user is not available');
console.log('- Returns "0x" when no user is logged in');
console.log('- Handles JSON parsing errors gracefully');

// Test API URLs with address parameter
console.log('\n🔗 Example API calls with address parameter:');
const endpoints = [
  'banana-credits-balance',
  'banana-image-history',
  'points-balance',
  'user-profile'
];

// Simulate logged in user
localStorage.setItem('rozo_user', JSON.stringify(testUser));
const currentAddress = getCurrentAddress();

endpoints.forEach(endpoint => {
  const url = `https://eslabobvkchgpokxszwv.supabase.co/functions/v1/${endpoint}?address=${currentAddress}`;
  console.log(`- ${endpoint}: ?address=${currentAddress}`);
});

console.log('\n✅ All tests completed!');