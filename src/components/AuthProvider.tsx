import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { selectCurrentUser, selectCurrentToken, logout, setCredentials } from '../services/authSlice';

interface AuthContextType {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectCurrentToken);
  const isAuthenticated = !!token && !!user;
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have stored tokens
        const storedToken = localStorage.getItem('access_token');
        const storedRefresh = localStorage.getItem('refresh_token');
        const storedUser = localStorage.getItem('user_profile');

        if (storedToken && storedRefresh && storedUser) {
          // Restore auth state
          dispatch(setCredentials({
            access: storedToken,
            refresh: storedRefresh,
            user: JSON.parse(storedUser)
          }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear any corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_profile');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Persist auth state to localStorage
  useEffect(() => {
    if (isAuthenticated && user && token) {
      localStorage.setItem('access_token', token);
      const refreshToken = useAppSelector(state => state.auth.refreshToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      localStorage.setItem('user_profile', JSON.stringify(user));
    }
  }, [isAuthenticated, user, token]);

  const handleLogin = async (credentials: any) => {
    try {
      // Login logic would go here
      // This is handled by the LoginPage component
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    
    // Clear Redux state
    dispatch(logout());
    
    // Redirect to login
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Loading component for auth initialization
export const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);