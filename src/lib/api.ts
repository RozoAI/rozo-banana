import axios from "axios";

// Service URLs configuration
const BANANA_API_URL =
  process.env.NEXT_PUBLIC_BANANA_API_URL ||
  "https://eslabobvkchgpokxszwv.supabase.co/functions/v1";
const POINTS_API_URL =
  process.env.NEXT_PUBLIC_POINTS_API_URL ||
  "https://eslabobvkchgpokxszwv.supabase.co/functions/v1";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://eslabobvkchgpokxszwv.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Banana Backend API client (Supabase Edge Functions)
const bananaApi = axios.create({
  baseURL: BANANA_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Points Service API client (Supabase Edge Functions)
const pointsApi = axios.create({
  baseURL: POINTS_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Legacy api for backward compatibility
const api = bananaApi;

// Add auth token to Banana API requests
bananaApi.interceptors.request.use((config) => {
  // Check if we're in browser environment
  let token = null;
  let tokenType = "anon";

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // Check for user JWT token first
    token = localStorage.getItem("rozo_token");
    if (token) {
      tokenType = "user";
    }
  }

  // Use Supabase anon key as default if no user token
  if (!token) {
    token = SUPABASE_ANON_KEY;
    tokenType = "anon";
  }

  console.log("🚀 [BananaAPI] Request interceptor:", {
    url: config.url,
    method: config.method,
    tokenType,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
  });

  config.headers.Authorization = `Bearer ${token}`;
  console.log(`🔑 [BananaAPI] Adding ${tokenType} Bearer token to request`);

  return config;
});

// Add auth token to Points API requests
pointsApi.interceptors.request.use((config) => {
  // Check if we're in browser environment
  let token = null;
  let tokenType = "anon";

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // Check for user JWT token first
    token = localStorage.getItem("rozo_token");
    if (token) {
      tokenType = "user";
    }
  }

  // Use Supabase anon key as default if no user token
  if (!token) {
    token = SUPABASE_ANON_KEY;
    tokenType = "anon";
  }

  console.log("🎯 [PointsAPI] Request interceptor:", {
    url: config.url,
    method: config.method,
    tokenType,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
  });

  config.headers.Authorization = `Bearer ${token}`;
  console.log(`🔑 [PointsAPI] Adding ${tokenType} Bearer token to request`);

  return config;
});

// Legacy interceptor for api
api.interceptors.request.use((config) => {
  // Check if we're in browser environment
  let token = null;
  let tokenSource = "anon";

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    token = localStorage.getItem("rozo_token") || localStorage.getItem("auth_token");
    if (token) {
      tokenSource = localStorage.getItem("rozo_token")
        ? "rozo_token"
        : "auth_token";
    }
  }

  // Use Supabase anon key as default if no user token
  if (!token) {
    token = SUPABASE_ANON_KEY;
    tokenSource = "anon";
  }

  console.log("📦 [LegacyAPI] Request interceptor:", {
    url: config.url,
    method: config.method,
    tokenSource,
  });

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle JWT expiration for both API clients
const handleAuthError = (error: any) => {
  console.log("🔐 [handleAuthError] Error:", error);

  // Check if it's an insufficient credits error - don't logout for this
  const errorMessage = error.response?.data?.error || error.response?.data?.message || '';
  const isInsufficientCredits = errorMessage.toLowerCase().includes('insufficient') ||
                                errorMessage.toLowerCase().includes('credits') ||
                                errorMessage.toLowerCase().includes('balance');

  // Check if we're using a real user token or just the anon key
  const hasUserToken = typeof window !== 'undefined' &&
                       (localStorage.getItem("rozo_token") || localStorage.getItem("auth_token"));

  // Only logout if we have a real user token that's invalid
  // Don't logout for anon key failures (expected for some endpoints)
  if ((error.response?.status === 401 || error.response?.status === 403) &&
      !isInsufficientCredits &&
      hasUserToken) {
    console.log("❌ [handleAuthError] User token invalid/expired, logging out...");
    if (typeof window !== 'undefined') {
      localStorage.removeItem("rozo_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("rozo_user");
      localStorage.removeItem("userAddress");
      localStorage.removeItem("rozo_signed_addresses");
      localStorage.setItem('auth_expired', 'true');
      window.location.href = '/';
    }
  } else if ((error.response?.status === 401 || error.response?.status === 403) && !hasUserToken) {
    console.log("🔔 [handleAuthError] Anon key rejected by endpoint (expected for some APIs)");
    // Don't logout or redirect, just let the error propagate
  }
  return Promise.reject(error);
};

bananaApi.interceptors.response.use((response) => response, handleAuthError);
pointsApi.interceptors.response.use((response) => response, handleAuthError);
api.interceptors.response.use((response) => response, handleAuthError);

export const authAPI = {
  // Updated to use Supabase auth-wallet-verify endpoint
  verify: async (
    message: string,
    signature: string,
    address: string,
    referralCode?: string
  ) => {
    console.log("🔐 [authAPI.verify] Sending verification request:", {
      address,
      app_id: "banana",
      referralCode,
      messageLength: message.length,
      signatureLength: signature.length,
      signaturePreview: signature.substring(0, 30) + "...",
    });

    try {
      // Use Supabase auth-wallet-verify endpoint (with lowercase address)
      const { data } = await pointsApi.post("/auth-wallet-verify", {
        message,
        signature,
        address: address.toLowerCase(),
        app_id: "banana",
        referral_code: referralCode,
      });

      console.log("✅ [authAPI.verify] Response received:", {
        success: data.success,
        hasToken: !!data.data?.token,
        tokenPreview: data.data?.token
          ? `${data.data.token.substring(0, 30)}...`
          : null,
        hasUser: !!data.data?.user,
      });

      // Handle new response format with success/data structure
      if (data.success && data.data) {
        const { token, user } = data.data;

        if (token && typeof window !== 'undefined') {
          localStorage.setItem("rozo_token", token);
          // Keep auth_token for backward compatibility
          localStorage.setItem("auth_token", token);
          console.log("💾 [authAPI.verify] Token saved to localStorage");
        }

        if (user && typeof window !== 'undefined') {
          // Ensure address is lowercase in stored user data
          const userWithLowerAddress = {
            ...user,
            address: user.address?.toLowerCase()
          };
          localStorage.setItem("rozo_user", JSON.stringify(userWithLowerAddress));
          console.log("💾 [authAPI.verify] User data saved to localStorage with lowercase address");
        }

        return {
          token,
          user,
          is_new_user: user?.created_at === user?.updated_at, // Rough check for new user
        };
      }

      throw new Error(data.error || "Authentication failed");
    } catch (error: any) {
      console.error("❌ [authAPI.verify] Error during verification:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  logout: () => {
    console.log("🚪 [authAPI.logout] Logging out, clearing all auth data");
    if (typeof window === 'undefined') {
      return;
    }
    // Clear all authentication tokens
    // localStorage.removeItem("rozo_token");
    // localStorage.removeItem("auth_token");
    localStorage.removeItem("authToken");

    // Clear user data
    localStorage.removeItem("rozo_user");
    localStorage.removeItem("userAddress");
    // localStorage.removeItem("rozo_signed_addresses");

    // Clear welcome/status flags
    localStorage.removeItem("auth_expired");
    localStorage.removeItem("welcome_new_user");
    localStorage.removeItem("welcome_back_user");
    localStorage.removeItem("referral_bonus_applied");

    // Clear affiliate names for all addresses (pattern: affiliateName_*)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("affiliateName_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log("✅ [authAPI.logout] All auth data cleared");
  },

  validateToken: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("rozo_token") : null;
      console.log("🔍 [authAPI.validateToken] Validating token:", {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
      });

      const { data } = await pointsApi.get("/auth-validate");
      console.log("✅ [authAPI.validateToken] Validation response:", data);

      // Handle new response format
      if (data.success && data.data) {
        return { valid: data.data.valid };
      }
      return { valid: false };
    } catch (error: any) {
      console.log(
        "⚠️ [authAPI.validateToken] Token validation failed, likely expired or invalid"
      );
      return { valid: false };
    }
  },
};

// Helper function to get current user address (always lowercase)
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

export const userAPI = {
  getProfile: async (address?: string) => {
    const queryAddress = address || getCurrentAddress();
    const { data } = await pointsApi.get(`/user-profile?address=${queryAddress}`);
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || "Failed to fetch profile");
  },

  getStats: async (address?: string) => {
    const queryAddress = address || getCurrentAddress();

    // Parallel fetch from both services with address parameter
    const [rozoData, creditsData] = await Promise.all([
      pointsApi.get(`/points-balance?address=${queryAddress}`),
      bananaApi.get(`/banana-credits-balance?address=${queryAddress}`),
    ]);

    // Handle new response format
    const rozoBalance = rozoData.data.success
      ? rozoData.data.data
      : rozoData.data;
    const credits = creditsData.data.success
      ? creditsData.data.data
      : creditsData.data;

    return {
      rozo_balance: rozoBalance.current_points || rozoBalance.balance || 0,
      total_earned:
        rozoBalance.lifetime_points || rozoBalance.total_earned || 0,
      total_spent: rozoBalance.total_spent || 0,
      credits: credits.available || credits.credits || 0,
    };
  },
};

// ROZO Points API (Supabase Edge Functions)
export const rozoAPI = {
  getBalance: async (address?: string) => {
    const queryAddress = address || getCurrentAddress();
    const { data } = await pointsApi.get(`/points-balance?address=${queryAddress}`);
    console.log("📊 [rozoAPI.getBalance] Raw response:", data);

    // Handle different response formats
    // Format 1: { balance: 14000, ... }
    // Format 2: { success: true, data: { current_points: 14000, ... } }

    if (data.balance !== undefined) {
      // Direct format from API
      return {
        balance: data.balance || 0,
        points: data.balance || 0,
        lifetime_points: data.lifetime_points || data.total_earned || 0,
        level: data.level || 1,
      };
    } else if (data.success && data.data) {
      // Wrapped format
      return {
        balance: data.data.current_points || data.data.balance || 0,
        points: data.data.current_points || data.data.balance || 0,
        lifetime_points: data.data.lifetime_points || 0,
        level: data.data.level || 1,
      };
    }

    // Fallback: return as is
    return {
      balance: 0,
      points: 0,
      lifetime_points: 0,
      level: 1
    };
  },

  getTransactions: async (page = 1, limit = 20) => {
    // NOTE: The legacy `/points-transactions` endpoint is no longer used.
    // Return an empty history payload to keep callers working without hitting the API.
    return {
      history: [],
      pagination: {
        page,
        limit,
        total: 0,
      },
    } as any;
  },
};

// Credits API (Banana Backend - Supabase Edge Functions)
export const creditsAPI = {
  getBalance: async (address?: string) => {
    const queryAddress = address || getCurrentAddress();
    console.log("💳 [creditsAPI.getBalance] Fetching credits for address:", queryAddress);
    const { data } = await bananaApi.get(`/banana-credits-balance?address=${queryAddress}`);
    console.log("💳 [creditsAPI.getBalance] Raw response:", JSON.stringify(data, null, 2));

    // Handle different response formats
    // Format 1: { credits: 100, available: 100, ... }
    // Format 2: { success: true, data: { credits: { available: 7000, ... } } }
    // Format 3: { success: true, data: { credits: 100, ... } }

    if (data.credits !== undefined || data.available !== undefined) {
      // Direct format
      return {
        credits: data.credits || data.available || 0,
        available: data.available || data.credits || 0,
        expires_at: data.expires_at || null,
        plan_type: data.plan_type || null
      };
    } else if (data.success && data.data) {
      // Wrapped format - check if credits is an object with 'available' property
      if (data.data.credits && typeof data.data.credits === 'object' && 'available' in data.data.credits) {
        // New format: { success: true, data: { credits: { available: 7000, ... } } }
        return {
          credits: data.data.credits.available || 0,
          available: data.data.credits.available || 0,
          expires_at: data.data.credits.expires_at || null,
          plan_type: data.data.credits.plan_type || null,
          used_this_month: data.data.credits.used_this_month || 0,
          total_monthly: data.data.credits.total_monthly || 0,
          next_refresh: data.data.credits.next_refresh || null
        };
      } else if (data.data.credits !== undefined || data.data.available !== undefined) {
        // Old wrapped format: { success: true, data: { credits: 100, ... } }
        return {
          credits: data.data.credits || data.data.available || 0,
          available: data.data.available || data.data.credits || 0,
          expires_at: data.data.expires_at || null,
          plan_type: data.data.plan_type || null
        };
      }
    }

    // Fallback
    return {
      credits: 0,
      available: 0,
      expires_at: null,
      plan_type: null
    };
  },
};

// Legacy pointsAPI for backward compatibility
export const pointsAPI = {
  getBalance: rozoAPI.getBalance,
  getHistory: rozoAPI.getTransactions,
};

export const imageAPI = {
  generate: async (params: {
    prompt: string;
    negative_prompt?: string;
    style?: string;
    aspect_ratio?: string;
    images?: string[]; // Base64 encoded images for multi-upload
  }) => {
    // Image generation requires user authentication
    // Check if user has a valid token (not anon key)
    const userToken = typeof window !== 'undefined' ? localStorage.getItem("rozo_token") : null;

    if (!userToken) {
      // Throw error that will trigger authentication flow
      throw new Error("AUTH_REQUIRED");
    }

    const { data } = await bananaApi.post("/banana-generate-image", params);
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  getHistory: async (page = 1, limit = 20, address?: string) => {
    const queryAddress = address || getCurrentAddress();
    const offset = (page - 1) * limit;
    const { data } = await bananaApi.get(
      `/banana-image-history?limit=${limit}&offset=${offset}&address=${queryAddress}`
    );
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },
};

// Referral API (Supabase Edge Functions)
export const referralAPI = {
  getMyCode: async () => {
    const { data } = await pointsApi.get("/referral-my-code");
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  setCustomCode: async (customCode: string) => {
    // Note: This endpoint might not exist in new backend
    // Using the same pattern for consistency
    const { data } = await pointsApi.post("/referral-set-custom", {
      custom_code: customCode,
    });
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  applyCode: async (referralCode: string) => {
    // Note: This might be handled during auth-wallet-verify
    const { data } = await pointsApi.post("/referral-apply", {
      referral_code: referralCode,
    });
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },
};

// Leaderboard API (Supabase Edge Functions)
export const leaderboardAPI = {
  getGlobal: async (limit = 100) => {
    const { data } = await pointsApi.get(`/leaderboard-global?limit=${limit}`);
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  getWeekly: async () => {
    const { data } = await pointsApi.get("/leaderboard-weekly");
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },
};

// Payment API (Banana Backend - Supabase Edge Functions)
export const paymentAPI = {
  getHistory: async (address?: string) => {
    const queryAddress = address || getCurrentAddress();
    const { data } = await bananaApi.get(`/banana-payment-history?address=${queryAddress}`);
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  getPlans: async (address?: string) => {
    const queryAddress = address || getCurrentAddress();
    const { data } = await bananaApi.get(`/banana-payment-plans?address=${queryAddress}`);
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  createOrder: async (params: any) => {
    const { data } = await bananaApi.post(
      "/banana-payment-create-order",
      params
    );
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },
};

export default api;
export { bananaApi, pointsApi };
