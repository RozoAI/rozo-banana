# Credits API Fix Summary

## Issue
The credits API was not displaying the correct balance. The user reported that while the points API was working and showing 14000, the credits API should show 7000 but was showing 0 instead.

## Root Cause
The credits API response structure was more deeply nested than expected:
```json
{
  "success": true,
  "data": {
    "credits": {
      "available": 7000,
      "plan_type": "yearly",
      "expires_at": "2026-11-23T12:10:04.272858+00:00",
      "used_this_month": 0,
      "total_monthly": 500,
      "next_refresh": "2026-11-23T12:10:04.272858+00:00"
    }
  }
}
```

The code was expecting `data.data.credits` to be a number, but it was actually an object containing an `available` property.

## Solution
Updated the `creditsAPI.getBalance()` function in `/src/lib/api.ts` to handle the nested structure:

```typescript
// New format: { success: true, data: { credits: { available: 7000, ... } } }
if (data.data.credits && typeof data.data.credits === 'object' && 'available' in data.data.credits) {
  return {
    credits: data.data.credits.available || 0,
    available: data.data.credits.available || 0,
    expires_at: data.data.credits.expires_at || null,
    plan_type: data.data.credits.plan_type || null,
    used_this_month: data.data.credits.used_this_month || 0,
    total_monthly: data.data.credits.total_monthly || 0,
    next_refresh: data.data.credits.next_refresh || null
  };
}
```

## Changes Made
1. **Updated creditsAPI parsing logic** - Added handling for nested credits object structure
2. **Added detailed logging** - Added JSON.stringify to see the actual response structure
3. **Extended response handling** - Now supports multiple response formats including the new nested structure

## Testing
- The API correctly returns 7000 credits for address `0xa9e3da13ef5eadfc6ecb2bb6bddde95016b567db`
- The parsing logic correctly extracts the `available` value from the nested structure
- The credits are now properly displayed in the UI when the correct address is used

## Important Notes
- The credits API works with the SUPABASE_ANON_KEY (no authentication required)
- The API returns different credit amounts based on the wallet address
- Address `0xa9e3da13ef5eadfc6ecb2bb6bddde95016b567db` has 7000 credits (yearly plan)
- Other addresses may have 0 credits (free tier)