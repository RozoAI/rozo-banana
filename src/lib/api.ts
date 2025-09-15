import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Determine if we're using Supabase Edge Functions
const isSupabaseBackend = API_BASE_URL.includes('supabase.co') || API_BASE_URL.includes('auth.rozo.ai');

const api = axios.create({
  baseURL: isSupabaseBackend ? SUPABASE_URL + '/functions/v1' : API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(isSupabaseBackend && SUPABASE_ANON_KEY ? { 'apikey': SUPABASE_ANON_KEY } : {}),
  },
  withCredentials: !isSupabaseBackend, // Only use credentials for non-Supabase backends
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  getNonce: async (address: string) => {
    if (isSupabaseBackend) {
      // For Supabase, we don't need a separate nonce endpoint
      // Generate a random nonce client-side
      return { nonce: Math.random().toString(36).substring(2, 15) };
    }
    const { data } = await api.post('/api/auth/nonce', { address });
    return data;
  },

  verify: async (message: any, signature: string, address: string) => {
    const endpoint = isSupabaseBackend ? '/auth-wallet' : '/api/auth/siwe/verify';
    
    // For Supabase, we need to send the message as a string
    const messageStr = typeof message === 'string' ? message : message.prepareMessage();
    
    const payload = isSupabaseBackend 
      ? { address, message: messageStr, signature }
      : { message: messageStr, signature, address };
    
    const { data } = await api.post(endpoint, payload);
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },
};

export const userAPI = {
  getProfile: async () => {
    const endpoint = isSupabaseBackend ? '/auth-wallet' : '/api/auth/profile';
    const { data } = await api.get(endpoint);
    return data;
  },

  getStats: async () => {
    const endpoint = isSupabaseBackend ? '/points-balance' : '/api/points/balance';
    const { data } = await api.get(endpoint);
    return data;
  },

  getReferrals: async () => {
    const endpoint = isSupabaseBackend ? '/leaderboard' : '/api/referral/my-referrals';
    const { data } = await api.get(endpoint);
    return data;
  },
};

export const pointsAPI = {
  getBalance: async () => {
    const endpoint = isSupabaseBackend ? '/points-balance' : '/api/points/balance';
    const { data } = await api.get(endpoint);
    return data;
  },

  getHistory: async (limit = 10) => {
    const endpoint = isSupabaseBackend 
      ? `/points-balance?type=history&limit=${limit}` 
      : `/api/points/history?limit=${limit}`;
    const { data } = await api.get(endpoint);
    return data;
  },
};

export const imageAPI = {
  generate: async (prompt: string) => {
    const endpoint = isSupabaseBackend ? '/generate-image' : '/api/images/generate';
    const { data } = await api.post(endpoint, { prompt });
    return data;
  },

  getHistory: async () => {
    const endpoint = isSupabaseBackend ? '/generate-image?type=history' : '/api/images/history';
    const { data } = await api.get(endpoint);
    return data;
  },
};

export default api;