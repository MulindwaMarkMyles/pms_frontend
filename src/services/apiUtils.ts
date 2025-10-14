import { store } from '../store';
import { updateTokens, logout } from './authSlice';
import axios from 'axios';

// API utility for making authenticated requests with auto token refresh
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const state = store.getState();
  let token = state.auth.token;

  if (!token) {
    // No token available, user needs to login
    store.dispatch(logout());
    throw new Error('No authentication token available');
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // Make the request
  let response = await axios({
    url,
    method: options.method || 'GET',
    data: options.body,
    baseURL: 'http://localhost:8000',
    headers,
  });

  // If token expired (401), try to refresh
  if (response.status === 401) {
    const refreshToken = state.auth.refreshToken;
    
    if (refreshToken) {
      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post('/api/token/refresh/', { refresh: refreshToken }, {
          baseURL: 'http://localhost:8000',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const { access } = refreshResponse.data;
        
        // Update token in store
        store.dispatch(updateTokens({ access }));
        
        // Retry original request with new token
        response = await axios({
          url,
          method: options.method || 'GET',
          data: options.body,
          baseURL: 'http://localhost:8000',
          headers: {
            ...headers,
            'Authorization': `Bearer ${access}`,
          },
        });
      } catch (error) {
        store.dispatch(logout());
        throw new Error('Session expired, please login again');
      }
    } else {
      // No refresh token, logout user
      store.dispatch(logout());
      throw new Error('Session expired, please login again');
    }
  }

  return response;
};

// Helper functions for common operations
export const apiGet = (url: string) => apiRequest(url, { method: 'GET' });

export const apiPost = (url: string, data?: any) => 
  apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (url: string, data?: any) => 
  apiRequest(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (url: string) => apiRequest(url, { method: 'DELETE' });

// Utility to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const state = store.getState();
  return state.auth.isAuthenticated && !!state.auth.token;
};

// Get current user from store
export const getCurrentUser = () => {
  const state = store.getState();
  return state.auth.user;
};

// Get user role
export const getUserRole = (): string => {
  const user = getCurrentUser();
  return user?.role || user?.user_type || 'tenant';
};

// Logout utility
export const logoutUser = () => {
  store.dispatch(logout());
  window.location.href = '/login';
};