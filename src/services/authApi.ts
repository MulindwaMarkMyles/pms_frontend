import { apiSlice } from '../store';
import type { LoginCredentials, RegisterCredentials, TokenResponse, RegisterResponse } from '../types/api';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<TokenResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/api/token/',
        method: 'POST',
        body: credentials,
      }),
    }),

    register: builder.mutation<RegisterResponse, RegisterCredentials>({
      query: (userData) => ({
        url: '/api/register/',
        method: 'POST',
        body: userData,
      }),
    }),

    refreshToken: builder.mutation<{ access: string }, { refresh: string }>({
      query: (refreshData) => ({
        url: '/api/token/refresh/',
        method: 'POST',
        body: refreshData,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
} = authApi;