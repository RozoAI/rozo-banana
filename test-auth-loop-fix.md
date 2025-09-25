# Authentication Loop Fix Summary

## Problems Identified and Fixed

### 1. **401 Errors Causing Logout Loop**
**Problem:** When API returned 401 errors (because backend doesn't accept SUPABASE_ANON_KEY), it triggered logout → set auth_expired → show message → repeat

**Fix:** Modified `handleAuthError` in `api.ts`:
- Only logout if we have a real user token (not anon key)
- Don't logout for 401 errors when using anon key (expected behavior)
- Added check: `hasUserToken` before triggering logout

### 2. **Address Mismatch Clearing localStorage**
**Problem:** In `page.tsx`, there was logic that cleared all localStorage when signed address didn't match current address

**Fix:** Commented out the problematic logic:
- We don't require signing for basic wallet connection anymore
- This was incorrectly clearing user data and causing loops

### 3. **Points API Failure Handling**
**Problem:** When points API failed with 401, it wasn't handled gracefully

**Fix:** Added try-catch in `MobileDashboard.tsx`:
- Catches 401 errors specifically
- Shows default value (0) instead of failing
- Logs informative message instead of error

### 4. **Address Comparison Issues**
**Problem:** Address comparisons were case-sensitive, causing mismatches

**Fix:** Updated `useAuth.ts`:
- Compare addresses in lowercase
- Added error handling for JSON parsing
- More robust address matching

## Expected Behavior Now

### When Connecting Wallet:
1. Wallet connects → Address saved to localStorage
2. Dashboard shows immediately (no signature required)
3. API calls attempt with SUPABASE_ANON_KEY
4. If API returns 401 → Log message but don't logout
5. Show default values if data can't be fetched

### No More:
- ❌ Session expired messages on loop
- ❌ Automatic logout when using anon key
- ❌ localStorage being cleared unexpectedly
- ❌ Page refreshing repeatedly

## Console Messages You Should See

### Normal Flow:
```
🔗 [WalletConnectButton] Wallet connected, saving address: 0x...
📊 [MobileDashboard] Fetching user data for address: 0x...
🔎 [handleAuthError] Anon key rejected by endpoint (expected for some APIs)
💰 [MobileDashboard] Points API requires authentication, showing default
```

### NOT These (which caused the loop):
```
❌ [handleAuthError] Token invalid/expired, logging out...  // This should NOT appear for anon key
Session expired. Please sign in again.  // This should NOT appear in loop
```

## Testing Steps

1. **Clear Everything First:**
   ```javascript
   // Run in browser console
   localStorage.clear();
   location.reload();
   ```

2. **Connect Wallet:**
   - Should connect without signature
   - Should NOT show "session expired"
   - Should NOT reload page

3. **Check Console:**
   - Should see "Anon key rejected" messages (this is OK)
   - Should NOT see "logging out" messages
   - Should NOT see repeated auth errors

4. **Navigate Pages:**
   - Should be able to navigate without issues
   - Data might show as 0 (expected without auth)
   - No logout loops

## Key Code Changes

### api.ts - handleAuthError:
```typescript
// Before: Always logout on 401
if (error.response?.status === 401) {
  // logout
}

// After: Only logout with user token
const hasUserToken = localStorage.getItem("rozo_token");
if (error.response?.status === 401 && hasUserToken) {
  // logout only if we had a real token
}
```

### page.tsx:
```typescript
// Before: Clear localStorage on address mismatch
if (signedAddressesObj.address !== address) {
  localStorage.removeItem("rozo_token");
  // ... clearing everything
}

// After: Commented out this problematic logic
```

### MobileDashboard.tsx:
```typescript
// Added error handling for 401
catch (pointsError) {
  if (pointsError.response?.status === 401) {
    console.log("Points API requires authentication, showing default");
    setPoints(0);
  }
}
```

## Success Indicators

✅ No more "Session expired" messages in loop
✅ Page doesn't refresh repeatedly
✅ Can connect wallet and stay connected
✅ Dashboard shows even without full authentication
✅ Console shows informative messages instead of errors
✅ localStorage isn't cleared unexpectedly