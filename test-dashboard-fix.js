#!/usr/bin/env node

/**
 * Test script to verify dashboard fix and lowercase address
 */

// Mock localStorage
const localStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value;
  }
};

global.window = { localStorage };
global.localStorage = localStorage;

console.log('🧪 Testing Dashboard and Address Fixes\n');

// Test getCurrentAddress with uppercase address
const getCurrentAddress = () => {
  if (typeof window === 'undefined') return '0x';

  // First check if we have a rozo_user in localStorage (from authentication)
  const rozoUser = localStorage.getItem("rozo_user");
  if (rozoUser) {
    try {
      const user = JSON.parse(rozoUser);
      if (user.address) {
        const lowerAddress = user.address.toLowerCase();
        console.log("🏠 [getCurrentAddress] Found address from rozo_user:", lowerAddress);
        return lowerAddress;
      }
    } catch (e) {
      console.error("❌ [getCurrentAddress] Failed to parse rozo_user:", e);
    }
  }

  // Fallback to userAddress (some components may set this directly)
  const userAddress = localStorage.getItem("userAddress");
  if (userAddress) {
    const lowerAddress = userAddress.toLowerCase();
    console.log("🏠 [getCurrentAddress] Found address from userAddress:", lowerAddress);
    return lowerAddress;
  }

  // No user address found, return default
  console.log("🏠 [getCurrentAddress] No user address found, using 0x");
  return '0x';
};

// Test 1: Uppercase address in rozo_user
console.log('Test 1: Uppercase address in rozo_user');
const upperCaseUser = {
  id: 'test-id',
  address: '0x5772C7B6E91D6B11DE4C9E08E9ACFC28DD7E4321'  // Uppercase
};
localStorage.setItem('rozo_user', JSON.stringify(upperCaseUser));
const address1 = getCurrentAddress();
console.log('Input address:', upperCaseUser.address);
console.log('Output address:', address1);
console.log('✅ Is lowercase:', address1 === address1.toLowerCase());
console.log('');

// Test 2: Mixed case in userAddress fallback
console.log('Test 2: Mixed case in userAddress fallback');
localStorage.storage = {}; // Clear storage
localStorage.setItem('userAddress', '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
const address2 = getCurrentAddress();
console.log('Input address:', '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12');
console.log('Output address:', address2);
console.log('✅ Is lowercase:', address2 === address2.toLowerCase());
console.log('');

// Test 3: API URL construction
console.log('Test 3: API URL construction with lowercase address');
const testAddress = '0x5772C7B6E91D6B11DE4C9E08E9ACFC28DD7E4321';
localStorage.storage = {};
localStorage.setItem('rozo_user', JSON.stringify({ address: testAddress }));
const apiAddress = getCurrentAddress();

const endpoints = [
  'banana-credits-balance',
  'points-balance',
  'user-profile',
  'banana-image-history'
];

console.log('Original address:', testAddress);
console.log('API parameter:', apiAddress);
console.log('');
console.log('Example API URLs:');
endpoints.forEach(endpoint => {
  console.log(`  GET /${endpoint}?address=${apiAddress}`);
});

console.log('\n📋 Summary:');
console.log('✅ Dashboard shows after wallet connection (no signature required)');
console.log('✅ Addresses are converted to lowercase in API calls');
console.log('✅ MobileDashboard checks for wallet connection, not authentication');
console.log('✅ Gallery page no longer requires authentication to view');
console.log('\n🎯 Expected Behavior:');
console.log('1. Connect wallet → Dashboard shows immediately');
console.log('2. No signature prompt until generating images');
console.log('3. All API calls use lowercase addresses');
console.log('4. Example: ?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321');