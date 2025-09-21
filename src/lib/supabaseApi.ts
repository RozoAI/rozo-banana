import axios from 'axios';
import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_BANANA_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add Supabase auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return axios.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export const supabaseAuthAPI = {
  // Email/Password auth
  signUp: async (email: string, password: string, address?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          address: address?.toLowerCase()
        }
      }
    });
    
    if (error) throw error;
    
    // Call backend to create user profile
    if (data.session) {
      await api.post('/api/v2/auth/signup', {
        email,
        password,
        address
      });
    }
    
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Wallet auth
  signInWithWallet: async (address: string, message: string, signature: string, inviteCode?: string) => {
    const { data } = await api.post('/api/v2/auth/signin-wallet', {
      address,
      message,
      signature,
      inviteCode
    });
    
    // Set Supabase session from backend response
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    }
    
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    // Get additional user data from backend
    if (user) {
      const { data } = await api.get('/api/v2/auth/user');
      return { ...user, ...data.user };
    }
    
    return user;
  },

  refreshSession: async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  },

  // OAuth providers
  signInWithProvider: async (provider: 'google' | 'github' | 'discord') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  }
};

// Keep existing API endpoints for backward compatibility
export const userAPI = {
  getProfile: async () => {
    const { data } = await api.get('/api/auth/profile');
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/api/points/balance');
    return data;
  },

  getReferrals: async () => {
    const { data } = await api.get('/api/referral/my-referrals');
    return data;
  },
};

export const pointsAPI = {
  getBalance: async () => {
    const { data } = await api.get('/api/points/balance');
    return data;
  },

  getHistory: async (limit = 10) => {
    const { data } = await api.get(`/api/points/history?limit=${limit}`);
    return data;
  },
};

export const imageAPI = {
  generate: async (prompt: string) => {
    const { data } = await api.post('/api/images/generate', { prompt });
    return data;
  },

  getHistory: async () => {
    const { data } = await api.get('/api/images/history');
    return data;
  },
};

export default api;