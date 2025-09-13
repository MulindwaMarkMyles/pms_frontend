import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

type Tokens = {
  access: string | null;
  refresh: string | null;
};

const initialTokens: Tokens = {
  access: (typeof window !== 'undefined' && localStorage.getItem('access')) || null,
  refresh: (typeof window !== 'undefined' && localStorage.getItem('refresh')) || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { tokens: initialTokens } as { tokens: Tokens },
  reducers: {
    setCredentials(state, action: PayloadAction<Partial<Tokens>>) {
      state.tokens = { ...state.tokens, ...action.payload };
      if (action.payload.access) localStorage.setItem('access', action.payload.access);
      if (action.payload.refresh) localStorage.setItem('refresh', action.payload.refresh);
    },
    logOut(state) {
      state.tokens = { access: null, refresh: null };
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

// base fetch with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.tokens.access;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    return headers;
  },
});

// wrapper to handle 401 -> refresh
const baseQueryWithReauth = async (
  args: Parameters<typeof baseQuery>[0],
  api: BaseQueryApi,
  extraOptions: unknown
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && (result.error as any).status === 401) {
    // try to get a new token
    const refreshToken = (api.getState() as RootState).auth.tokens.refresh;
    if (!refreshToken) {
      api.dispatch(logOut());
      return result;
    }

    const refreshResult = await baseQuery(
      {
        url: '/api/token/refresh/',
        method: 'POST',
        body: { refresh: refreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // expected { access: '...' }
      const data = refreshResult.data as { access?: string; refresh?: string };
      api.dispatch(setCredentials({ access: data.access ?? null, refresh: data.refresh ?? refreshToken }));

      // retry original request with new access token
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Tenant', 'Property', 'Payment', 'Complaint'],
  endpoints: (builder) => ({
    // add API endpoints in feature files by injecting endpoints
  }),
});

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// export hooks for api endpoints to be injected in feature modules
export default store;