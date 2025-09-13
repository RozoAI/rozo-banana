import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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
    const { data } = await api.post('/api/auth/nonce', { address });
    return data;
  },

  verify: async (message: string, signature: string, address: string) => {
    const { data } = await api.post('/api/auth/siwe/verify', { message, signature, address });
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