import axios from 'axios';

// Service URLs configuration
const BANANA_API_URL = process.env.NEXT_PUBLIC_BANANA_API_URL || 'https://api.banana.rozo.ai/api';
const POINTS_API_URL = process.env.NEXT_PUBLIC_POINTS_API_URL || 'https://points.rozo.ai/api';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Legacy support for Supabase backend
const API_BASE_URL = process.env.NEXT_PUBLIC_BANANA_API_URL || BANANA_API_URL;
const isSupabaseBackend = API_BASE_URL.includes('supabase.co') || API_BASE_URL.includes('auth.rozo.ai');

// Banana Backend API client
const bananaApi = axios.create({
  baseURL: isSupabaseBackend ? SUPABASE_URL + '/functions/v1' : BANANA_API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(isSupabaseBackend && SUPABASE_ANON_KEY ? { 
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    } : {}),
  },
  withCredentials: !isSupabaseBackend,
});

// Points Service API client  
const pointsApi = axios.create({
  baseURL: POINTS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Legacy api for backward compatibility
const api = bananaApi;

// Add auth token to Banana API requests
bananaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('rozo_token');
  console.log('🚀 [BananaAPI] Request interceptor:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    isSupabaseBackend
  });
  
  if (token && isSupabaseBackend) {
    config.headers['X-Auth-Token'] = token;
    config.headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 [BananaAPI] Adding Bearer token to request');
  } else if (isSupabaseBackend && SUPABASE_ANON_KEY) {
    config.headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return config;
});

// Add auth token to Points API requests
pointsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('rozo_token');
  console.log('🎯 [PointsAPI] Request interceptor:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 [PointsAPI] Adding Bearer token to request');
  } else {
    console.log('⚠️ [PointsAPI] No token found for request');
  }
  return config;
});

// Legacy interceptor for api
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rozo_token') || localStorage.getItem('auth_token');
  console.log('📦 [LegacyAPI] Request interceptor:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenSource: localStorage.getItem('rozo_token') ? 'rozo_token' : localStorage.getItem('auth_token') ? 'auth_token' : 'none'
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle JWT expiration for both API clients
const handleAuthError = (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('rozo_token');
    localStorage.removeItem('auth_token');
    localStorage.setItem('auth_expired', 'true');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
  return Promise.reject(error);
};

bananaApi.interceptors.response.use((response) => response, handleAuthError);
pointsApi.interceptors.response.use((response) => response, handleAuthError);
api.interceptors.response.use((response) => response, handleAuthError);

export const authAPI = {
  // Updated to use Points Service for authentication
  verify: async (message: string, signature: string, address: string, referralCode?: string) => {
    console.log('🔐 [authAPI.verify] Sending verification request:', {
      address,
      app_id: 'banana',
      referralCode,
      messageLength: message.length,
      signatureLength: signature.length,
      signaturePreview: signature.substring(0, 30) + '...'
    });
    
    try {
      const { data } = await pointsApi.post('/auth/wallet/verify', {
        message,
        signature,
        address,
        app_id: 'banana',
        referral_code: referralCode
      });
      
      console.log('✅ [authAPI.verify] Response received:', {
        hasToken: !!data.token,
        tokenPreview: data.token ? `${data.token.substring(0, 30)}...` : null,
        is_new_user: data.is_new_user,
        error: data.error
      });
      
      if (data.token) {
        localStorage.setItem('rozo_token', data.token);
        // Keep auth_token for backward compatibility
        localStorage.setItem('auth_token', data.token);
        console.log('💾 [authAPI.verify] Token saved to localStorage');
      }
      return data;
    } catch (error: any) {
      console.error('❌ [authAPI.verify] Error during verification:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  logout: () => {
    console.log('🚪 [authAPI.logout] Logging out, clearing all auth data');
    // Clear all authentication tokens
    localStorage.removeItem('rozo_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    
    // Clear user data
    localStorage.removeItem('rozo_user');
    localStorage.removeItem('userAddress');
    
    // Clear welcome/status flags
    localStorage.removeItem('auth_expired');
    localStorage.removeItem('welcome_new_user');
    localStorage.removeItem('welcome_back_user');
    localStorage.removeItem('referral_bonus_applied');
    
    // Clear affiliate names for all addresses (pattern: affiliateName_*)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('affiliateName_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ [authAPI.logout] All auth data cleared');
  },

  validateToken: async () => {
    try {
      const token = localStorage.getItem('rozo_token');
      console.log('🔍 [authAPI.validateToken] Validating token:', {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      });
      
      const { data } = await pointsApi.get('/auth/validate');
      console.log('✅ [authAPI.validateToken] Validation response:', data);
      return data;
    } catch (error: any) {
      console.log('⚠️ [authAPI.validateToken] Token validation failed, likely expired or invalid');
      return { valid: false };
    }
  },
};

export const userAPI = {
  getProfile: async () => {
    const { data } = await pointsApi.get('/user/profile');
    return data;
  },

  getStats: async () => {
    // Parallel fetch from both services
    const [rozoData, creditsData] = await Promise.all([
      pointsApi.get('/points/balance'),
      bananaApi.get('/credits/balance')
    ]);
    
    return {
      rozo_balance: rozoData.data.balance,
      total_earned: rozoData.data.total_earned,
      total_spent: rozoData.data.total_spent,
      credits: creditsData.data.credits
    };
  },
};

// ROZO Points API (Points Service)
export const rozoAPI = {
  getBalance: async () => {
    const { data } = await pointsApi.get('/points/balance');
    return data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const { data } = await pointsApi.get(`/points/transactions?page=${page}&limit=${limit}`);
    return data;
  },
};

// Credits API (Banana Backend)
export const creditsAPI = {
  getBalance: async () => {
    const { data } = await bananaApi.get('/credits/balance');
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
    const { data } = await bananaApi.post('/image/generate', params);
    return data;
  },

  getHistory: async (page = 1, limit = 20) => {
    const { data } = await bananaApi.get(`/image/history?page=${page}&limit=${limit}`);
    return data;
  },
};

// Referral API (Points Service)
export const referralAPI = {
  getMyCode: async () => {
    const { data } = await pointsApi.get('/referral/code');
    return data;
  },

  setCustomCode: async (customCode: string) => {
    const { data } = await pointsApi.post('/referral/set-custom', {
      custom_code: customCode
    });
    return data;
  },

  applyCode: async (referralCode: string) => {
    const { data } = await pointsApi.post('/referral/apply', {
      referral_code: referralCode
    });
    return data;
  },
};

// Leaderboard API (Points Service)
export const leaderboardAPI = {
  getGlobal: async (limit = 100) => {
    const { data } = await pointsApi.get(`/leaderboard/global?limit=${limit}`);
    return data;
  },

  getWeekly: async () => {
    const { data } = await pointsApi.get('/leaderboard/weekly');
    return data;
  },
};

// Payment API (Banana Backend)
export const paymentAPI = {
  getHistory: async () => {
    const { data } = await bananaApi.get('/payment/history');
    return data;
  },
};

export default api;
export { bananaApi, pointsApi };