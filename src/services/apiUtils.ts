import { store } from '../store';
import { updateTokens, logout } from './authSlice';

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
  let response = await fetch(`http://127.0.0.1:8000${url}`, {
    ...options,
    headers,
  });

  // If token expired (401), try to refresh
  if (response.status === 401) {
    const refreshToken = state.auth.refreshToken;
    
    if (refreshToken) {
      try {
        // Attempt to refresh token
        const refreshResponse = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          
          // Update token in store
          store.dispatch(updateTokens({ access }));
          
          // Retry original request with new token
          response = await fetch(`http://127.0.0.1:8000${url}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${access}`,
            },
          });
        } else {
          // Refresh failed, logout user
          store.dispatch(logout());
          throw new Error('Session expired, please login again');
        }
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