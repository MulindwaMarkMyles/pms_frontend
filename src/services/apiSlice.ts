import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import type { LoginResponse } from './authSlice';

interface LoginRequest {
  username: string;
  password: string;
}

// Base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://127.0.0.1:8000',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Property', 'Tenant', 'Payment', 'Complaint', 'User'],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/token/',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
      query: ({ refresh }) => ({
        url: '/api/token/refresh/',
        method: 'POST',
        body: { refresh },
      }),
    }),

    // Get user profile
    getUserProfile: builder.query<any, void>({
      query: () => ({
        url: '/api/profile/',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    // User registration
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/api/register/',
        method: 'POST',
        body: userData,
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