import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_type?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
  [key: string]: any; // Allow additional properties
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      const { access, refresh, user, ...otherData } = action.payload;
      
      state.token = access;
      state.refreshToken = refresh;
      
      // Handle user data - it might be nested or at root level
      if (user) {
        state.user = user;
      } else if (otherData.user) {
        state.user = otherData.user;
      } else {
        // If user data is mixed with tokens at root level
        const userData: User = {
          id: otherData.id || otherData.user_id || 0,
          username: otherData.username || '',
          email: otherData.email,
          first_name: otherData.first_name,
          last_name: otherData.last_name,
          role: otherData.role || otherData.user_type,
          user_type: otherData.user_type || otherData.role,
          name: otherData.name || `${otherData.first_name || ''} ${otherData.last_name || ''}`.trim()
        };
        state.user = userData;
      }
      
      state.isAuthenticated = !!access;
    },
    
    updateTokens: (state, action: PayloadAction<{ access: string; refresh?: string }>) => {
      const { access, refresh } = action.payload;
      state.token = access;
      if (refresh) {
        state.refreshToken = refresh;
      }
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    
    clearAuth: () => {
      return initialState;
    }
  },
});

export const { 
  setCredentials, 
  updateTokens, 
  updateUser, 
  logout, 
  clearAuth 
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;

// Utility selectors
export const selectUserRole = (state: { auth: AuthState }) => {
  const user = state.auth.user;
  return user?.role || user?.user_type || 'tenant';
};

export const selectUserDisplayName = (state: { auth: AuthState }) => {
  const user = state.auth.user;
  if (!user) return '';
  
  if (user.name) return user.name;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.username || '';
};