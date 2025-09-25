# Data Fetching Test Guide

## What's Been Fixed

### 1. **Data fetching now triggers on wallet connection (not authentication)**
- Changed from `if (isAuthenticated)` to `if (address)` or `if (isConnected && address)`
- Components updated:
  - `MobileDashboard.tsx`
  - `gallery/page.tsx`
  - `history/page.tsx`

### 2. **Address is saved when wallet connects**
- `WalletConnectButton.tsx` now saves address to localStorage
- Creates a minimal user object for API calls

### 3. **API calls use address parameter**
- All GET endpoints include `?address={lowercase_address}`
- Address is automatically retrieved from localStorage

## Testing Steps

### 1. Initial Load
1. Open browser developer console (F12)
2. Go to Network tab
3. Clear console and network logs
4. Load the app

### 2. Connect Wallet
1. Click "Connect Wallet"
2. Select your wallet
3. **Check console for logs:**
   ```
   🔗 [WalletConnectButton] Wallet connected, saving address: 0x...
   👤 [WalletConnectButton] Created user object with address
   📊 [MobileDashboard] Wallet connected, fetching user data for: 0x...
   ```

4. **Check Network tab for API calls:**
   - Look for calls to:
     - `points-balance?address=0x...`
     - `banana-credits-balance?address=0x...`
   - Verify address parameter is lowercase

### 3. Navigate to Gallery
1. Click on Gallery/History page
2. **Check console for logs:**
   ```
   🖼️ [Gallery] Fetching gallery for address: 0x...
   🌌 [Gallery] API response: {...}
   ```

3. **Check Network tab:**
   - `banana-image-history?address=0x...&limit=100&offset=0`

### 4. Navigate to History
1. Go to History page
2. **Check console for logs:**
   ```
   📜 [History] Fetching history for address: 0x...
   📦 [History] API response: {...}
   ```

3. **Check Network tab:**
   - `banana-image-history?address=0x...&limit=20&offset=0`

### 5. Switch Between Pages
1. Navigate between Home → Gallery → History
2. Each page should fetch its data
3. Check that address parameter is consistent

## Expected API Calls After Wallet Connection

### Home Page (MobileDashboard):
```
GET /points-balance?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321
GET /banana-credits-balance?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321
```

### Gallery Page:
```
GET /banana-image-history?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321&limit=100&offset=0
```

### History Page:
```
GET /banana-image-history?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321&limit=20&offset=0
```

## Console Logs to Verify

### getCurrentAddress function:
```
🏠 [getCurrentAddress] Found address from rozo_user: 0x5772...
```

### API interceptors:
```
🚀 [BananaAPI] Request interceptor: {url: "/banana-credits-balance?address=0x5772...", tokenType: "anon"}
🎯 [PointsAPI] Request interceptor: {url: "/points-balance?address=0x5772...", tokenType: "anon"}
```

## Troubleshooting

### If no API calls are made:
1. Check if address is saved in localStorage:
   - Open DevTools → Application → Local Storage
   - Look for `userAddress` and `rozo_user`
   - Should contain lowercase address

2. Check console for errors:
   - 401 errors mean authentication issue
   - 404 errors mean endpoint not found
   - CORS errors mean backend configuration issue

### If address parameter is missing or wrong:
1. Check `getCurrentAddress()` is returning correct value
2. Verify localStorage has the address
3. Check if address is lowercase

### If data doesn't update when switching pages:
1. Check if useEffect dependencies include address
2. Verify hasFetched.current is not blocking refetch
3. Check console logs for fetch attempts

## Success Criteria

✅ **Wallet connection triggers data fetching immediately**
✅ **No signature prompt required for viewing data**
✅ **All API calls include lowercase address parameter**
✅ **Data fetches when switching between pages**
✅ **Console shows appropriate logs for each action**
✅ **Network tab shows API calls with correct parameters**

## Code Verification

Run in browser console to check:
```javascript
// Check stored address
console.log('userAddress:', localStorage.getItem('userAddress'));
console.log('rozo_user:', JSON.parse(localStorage.getItem('rozo_user') || '{}'));

// Check if address is lowercase
const addr = localStorage.getItem('userAddress');
console.log('Is lowercase?', addr === addr?.toLowerCase());

// Manually trigger API call
fetch('https://eslabobvkchgpokxszwv.supabase.co/functions/v1/points-balance?address=' + addr, {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
}).then(r => r.json()).then(console.log);
```