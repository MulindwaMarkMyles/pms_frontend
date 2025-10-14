import { createApi } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import type { RootState } from '../store';
import type { LoginResponse } from './authSlice';

interface LoginRequest {
  username: string;
  password: string;
}

// Custom axios base query
const axiosBaseQuery = ({ baseUrl }: { baseUrl: string }) => async ({ url, method, data, params, headers: customHeaders }: any) => {
  try {
    const result = await axios({
      url: baseUrl + url,
      method,
      data,
      params,
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    });
    return { data: result.data };
  } catch (axiosError: any) {
    return {
      error: {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      },
    };
  }
};

// Base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: 'http://localhost:8000' }),
  tagTypes: ['Property', 'Tenant', 'Payment', 'Complaint', 'User'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/token/',
        method: 'POST',
        data: credentials,
        headers: {}, // No auth needed for login
      }),
    }),
    
    refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
      query: ({ refresh }) => ({
        url: '/api/token/refresh/',
        method: 'POST',
        data: { refresh },
        headers: {}, // No auth needed for refresh
      }),
    }),

    // Get user profile
    getUserProfile: builder.query<any, void>({
      query: () => ({
        url: '/api/profile/',
        method: 'GET',
        headers: (getState: () => RootState) => {
          const token = getState().auth.token;
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
      providesTags: ['User'],
    }),

    // User registration
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/api/register/',
        method: 'POST',
        data: userData,
        headers: {}, // Assuming no auth for registration
      }),
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRefreshTokenMutation,
  useGetUserProfileQuery,
  useRegisterMutation
} = apiSlice;