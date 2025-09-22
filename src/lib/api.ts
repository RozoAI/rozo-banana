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
  const token = localStorage.getItem("rozo_token");
  console.log("🚀 [BananaAPI] Request interceptor:", {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔑 [BananaAPI] Adding Bearer token to request");
  }
  return config;
});

// Add auth token to Points API requests
pointsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("rozo_token");
  console.log("🎯 [PointsAPI] Request interceptor:", {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔑 [PointsAPI] Adding Bearer token to request");
  } else {
    console.log("⚠️ [PointsAPI] No token found for request");
  }
  return config;
});

// Legacy interceptor for api
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("rozo_token") || localStorage.getItem("auth_token");
  console.log("📦 [LegacyAPI] Request interceptor:", {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenSource: localStorage.getItem("rozo_token")
      ? "rozo_token"
      : localStorage.getItem("auth_token")
      ? "auth_token"
      : "none",
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle JWT expiration for both API clients
const handleAuthError = (error: any) => {
  console.log("🔐 [handleAuthError] Error:", error);
  if (error.response?.status === 401) {
    // localStorage.removeItem("rozo_token");
    // localStorage.removeItem("auth_token");
    // localStorage.setItem('auth_expired', 'true');
    // if (typeof window !== 'undefined') {
    //   window.location.href = '/';
    // }
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
      // Use Supabase auth-wallet-verify endpoint
      const { data } = await pointsApi.post("/auth-wallet-verify", {
        message,
        signature,
        address,
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

        if (token) {
          localStorage.setItem("rozo_token", token);
          // Keep auth_token for backward compatibility
          localStorage.setItem("auth_token", token);
          console.log("💾 [authAPI.verify] Token saved to localStorage");
        }

        if (user) {
          localStorage.setItem("rozo_user", JSON.stringify(user));
          console.log("💾 [authAPI.verify] User data saved to localStorage");
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
      const token = localStorage.getItem("rozo_token");
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

export const userAPI = {
  getProfile: async () => {
    const { data } = await pointsApi.get("/user-profile");
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    throw new Error(data.error || "Failed to fetch profile");
  },

  getStats: async () => {
    // Parallel fetch from both services
    const [rozoData, creditsData] = await Promise.all([
      pointsApi.get("/points-balance"),
      bananaApi.get("/banana-credits-balance"),
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
  getBalance: async () => {
    const { data } = await pointsApi.get("/points-balance");
    // Handle new response format
    if (data.success && data.data) {
      return {
        balance: data.data.current_points || 0,
        points: data.data.current_points || 0,
        lifetime_points: data.data.lifetime_points || 0,
        level: data.data.level || 1,
      };
    }
    return data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const { data } = await pointsApi.get(
      `/points-transactions?limit=${limit}&offset=${offset}`
    );
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },
};

// Credits API (Banana Backend - Supabase Edge Functions)
export const creditsAPI = {
  getBalance: async () => {
    const { data } = await bananaApi.get("/banana-credits-balance");
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
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
    const { data } = await bananaApi.post("/banana-generate-image", params);
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  getHistory: async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const { data } = await bananaApi.get(
      `/banana-image-history?limit=${limit}&offset=${offset}`
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
  getHistory: async () => {
    const { data } = await bananaApi.get("/banana-payment-history");
    // Handle new response format
    if (data.success && data.data) {
      return data.data;
    }
    return data;
  },

  getPlans: async () => {
    const { data } = await bananaApi.get("/banana-payment-plans");
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
