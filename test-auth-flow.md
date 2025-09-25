# Authentication Flow Test Guide

## Updated Authentication Behavior

The authentication flow has been updated so that:
1. **No automatic wallet signature** when user connects wallet
2. **Signature only required** when user tries to generate an image
3. **Users can browse freely** without authentication

## Testing Steps

### 1. Initial Page Load (No Wallet Connected)
- [ ] Open the app in browser
- [ ] Verify NO authentication prompt appears
- [ ] Verify you can browse the page without signing
- [ ] Check that API calls use `SUPABASE_ANON_KEY` with `address=0x`

### 2. Connect Wallet (Without Generating)
- [ ] Click "Connect Wallet"
- [ ] Select your wallet (MetaMask, etc.)
- [ ] Connect your wallet
- [ ] **Verify NO signature request appears**
- [ ] Verify wallet shows as connected
- [ ] Check that API calls now use `address={your_wallet_address}`

### 3. Try to Generate Image (First Time)
- [ ] Enter a prompt
- [ ] Upload an image
- [ ] Click "Generate"
- [ ] **Now signature request should appear**
- [ ] Sign the message
- [ ] Verify authentication succeeds
- [ ] Check credits balance is fetched
- [ ] If sufficient credits, generation proceeds
- [ ] If insufficient credits, error message appears

### 4. Generate Again (Already Authenticated)
- [ ] Try to generate another image
- [ ] **No signature request should appear**
- [ ] Generation proceeds directly (if credits available)

### 5. Disconnect and Reconnect Wallet
- [ ] Disconnect wallet
- [ ] Reconnect wallet
- [ ] **No signature request on reconnect**
- [ ] Try to generate image
- [ ] System should use existing token if valid
- [ ] Only request signature if token is expired/invalid

## Components Updated

### Components that NO LONGER auto-authenticate:
- `MobileDashboard.tsx` - Removed auto sign-in effect
- `gallery/page.tsx` - Removed auto sign-in effect
- `NanoBananaGenerator.tsx` - Removed wallet connect auto-auth
- `BananaImageGenerator.tsx` - Removed wallet connect auto-auth

### Authentication Flow in Image Generation:
1. User clicks "Generate"
2. Check for existing JWT token
3. If no token → Request wallet signature
4. After signature → Get JWT token
5. Check credits balance
6. If sufficient credits → Proceed with generation
7. If insufficient credits → Show topup message

## API Behavior

### GET Endpoints (Public Browsing):
```javascript
// When user is NOT logged in:
GET /banana-credits-balance?address=0x
GET /points-balance?address=0x
GET /user-profile?address=0x

// When user IS logged in (0x5772...):
GET /banana-credits-balance?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321
GET /points-balance?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321
GET /user-profile?address=0x5772c7b6e91d6b11de4c9e08e9acfc28dd7e4321
```

### POST Endpoints (Require Auth):
```javascript
// Image generation always requires user JWT (not anon key)
POST /banana-generate-image
// This will trigger wallet signature if not authenticated
```

## Expected Console Logs

### When connecting wallet (no signature):
```
🔗 Wallet connected: 0x5772...
🏠 [getCurrentAddress] Found address from rozo_user: 0x5772...
📡 API calls now use address=0x5772...
```

### When generating image (first time):
```
🔐 [Generate] No token found, need authentication
🔏 [NanoBanana] Requesting wallet signature...
✅ [NanoBanana] Signature obtained: 0xabc123...
🎫 [NanoBanana] Auth successful, token received
💳 [NanoBanana] Credits response: {available: 100}
🎨 [Generate] Sending request with prompt...
```

### When generating image (already authenticated):
```
🎟️ [NanoBanana] Using existing token, skipping signature
🎨 [Generate] Sending request with prompt...
```

## Troubleshooting

### If signature appears on wallet connect:
- Check `MobileDashboard.tsx` - Should have auto sign-in commented out
- Check `gallery/page.tsx` - Should have auto sign-in commented out
- Check for any `useEffect` that calls `signIn()` or `authenticateUser()` on mount

### If generation fails with auth error:
- Check localStorage for `rozo_token`
- Verify token is being sent in Authorization header
- Check if token has expired

### If address parameter is wrong:
- Check `getCurrentAddress()` function in `api.ts`
- Verify `rozo_user` is stored after authentication
- Check localStorage for user data

## Success Criteria

✅ Users can browse without signing
✅ Wallet connection doesn't trigger signature
✅ Image generation triggers signature (first time only)
✅ Subsequent generations use cached token
✅ API calls include correct address parameter
✅ Credits check happens after authentication
✅ Insufficient credits shows topup message