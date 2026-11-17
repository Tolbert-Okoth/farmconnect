import axios from 'axios';
import { API_ORIGIN } from './config';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    let userInfo = null;
    try {
      userInfo = JSON.parse(localStorage.getItem('userInfo'));
    } catch {
      localStorage.removeItem('userInfo');
    }
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;