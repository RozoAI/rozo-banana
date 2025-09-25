# Points and Credits Display Fix

## Issues Fixed

### 1. **Points not displaying (showed 0 instead of 14000)**
**Problem:** API returns `data.balance = 14000` but code was looking for `data.data.current_points`

**Fix in `api.ts` - rozoAPI.getBalance():**
```typescript
// Now handles both formats:
if (data.balance !== undefined) {
  // Direct format: { balance: 14000 }
  return { balance: data.balance, ... }
} else if (data.success && data.data) {
  // Wrapped format: { success: true, data: { current_points: 14000 } }
  return { balance: data.data.current_points, ... }
}
```

### 2. **Credits not being fetched (showed 0 credits)**
**Problem:** Credits were only fetched when user had authentication token

**Fixes:**
1. **Added credits fetching to MobileDashboard**
2. **Updated NanoBananaGenerator** to fetch credits when wallet connects (not just when authenticated)
3. **Fixed creditsAPI.getBalance()** to handle different response formats

## Code Changes

### api.ts - Points API:
```typescript
getBalance: async (address?: string) => {
  const { data } = await pointsApi.get(`/points-balance?address=${queryAddress}`);

  // Handle direct format from API
  if (data.balance !== undefined) {
    return {
      balance: data.balance || 0,
      points: data.balance || 0,
      ...
    };
  }
  // Handle wrapped format
  else if (data.success && data.data) {
    return {
      balance: data.data.current_points || data.data.balance || 0,
      ...
    };
  }
}
```

### api.ts - Credits API:
```typescript
getBalance: async (address?: string) => {
  const { data } = await bananaApi.get(`/banana-credits-balance?address=${queryAddress}`);

  // Handle direct format
  if (data.credits !== undefined || data.available !== undefined) {
    return {
      credits: data.credits || data.available || 0,
      available: data.available || data.credits || 0,
      ...
    };
  }
  // Handle wrapped format
  else if (data.success && data.data) {
    return {
      credits: data.data.credits || data.data.available || 0,
      ...
    };
  }
}
```

### MobileDashboard.tsx:
```typescript
// Added credits state
const [credits, setCredits] = useState<number | null>(null);

// Fetch both points and credits
const fetchUserData = async () => {
  // Fetch points
  try {
    const balance = await pointsAPI.getBalance();
    setPoints(balance.balance ?? balance.points ?? 0);
  } catch (error) {
    setPoints(0);
  }

  // Fetch credits
  try {
    const creditsData = await creditsAPI.getBalance();
    setCredits(creditsData.credits ?? creditsData.available ?? 0);
  } catch (error) {
    setCredits(0);
  }
}
```

### NanoBananaGenerator.tsx:
```typescript
// Fetch credits when wallet connects (not just when authenticated)
useEffect(() => {
  if (isConnected && address && !hasFetched.current) {
    fetchUserCredits();
    hasFetched.current = true;
  }
}, [isConnected, address]);

// New function to fetch credits without auth
const fetchUserCredits = async () => {
  const { creditsAPI } = await import("../lib/api");
  const data = await creditsAPI.getBalance();
  setUserCredits(data.credits || data.available || 0);
}
```

## Expected Behavior

### When wallet is connected:

1. **Points should display correctly:**
   - API call: `/points-balance?address=0xa9e3...`
   - Response: `{ balance: 14000 }`
   - Display: "Points: 14000" (not 0)

2. **Credits should display correctly:**
   - API call: `/banana-credits-balance?address=0xa9e3...`
   - Response: `{ credits: 100 }` or `{ available: 100 }`
   - Display: "Balance: 100 credits" (not 0)

## Console Logs to Verify

You should see:
```
📊 [rozoAPI.getBalance] Raw response: { balance: 14000, ... }
✅ [MobileDashboard] Points balance response: { balance: 14000, ... }

💳 [creditsAPI.getBalance] Fetching credits for address: 0xa9e3...
💳 [creditsAPI.getBalance] Raw response: { credits: 100, ... }
✅ [MobileDashboard] Credits balance response: { credits: 100, ... }

💳 [NanoBanana] Credits response: { credits: 100, ... }
💰 [NanoBanana] Setting credits to: 100
```

## Testing

1. **Refresh the page** with wallet connected
2. **Check the console** for the logs above
3. **Verify display:**
   - Points section should show actual balance (e.g., 14000)
   - Generate page should show actual credits (e.g., "Balance: 100 credits")

## API Response Formats Supported

The code now handles multiple response formats:

### Points API:
- Format 1: `{ balance: 14000, lifetime_points: 20000 }`
- Format 2: `{ success: true, data: { current_points: 14000 } }`
- Format 3: `{ success: true, data: { balance: 14000 } }`

### Credits API:
- Format 1: `{ credits: 100, available: 100 }`
- Format 2: `{ available: 100 }`
- Format 3: `{ success: true, data: { credits: 100 } }`
- Format 4: `{ success: true, data: { available: 100 } }`

All formats will be properly parsed and displayed!