import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_type?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useFlexibleAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check localStorage for auth data
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_profile');
    
    console.log('useFlexibleAuth - Checking localStorage:');
    console.log('- storedToken exists:', !!storedToken);
    console.log('- storedUser exists:', !!storedUser);
    console.log('- storedUser content:', storedUser);
    
    let user: User | null = null;
    
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
        console.log('- parsed user:', user);
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        // Clear corrupted data
        localStorage.removeItem('user_profile');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }

    const isAuthenticated = !!(storedToken && user);
    console.log('- isAuthenticated result:', isAuthenticated);
    
    setAuthState({
      user,
      token: storedToken,
      isAuthenticated,
      isLoading: false
    });
  }, []);

  const normalizeRole = (role: string): string => {
    switch (role?.toLowerCase()) {
      case 'property_manager':
      case 'manager':
        return 'manager';
      case 'property_owner':
      case 'owner':
        return 'owner';
      case 'tenant':
        return 'tenant';
      default:
        return role?.toLowerCase() || 'tenant';
    }
  };

  const userRole = authState.user?.role || authState.user?.user_type || 'tenant';
  const normalizedRole = normalizeRole(userRole);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_profile');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
    window.location.href = '/login';
  };

  const canAccess = (allowedRoles: string[]): boolean => {
    if (!authState.isAuthenticated) return false;
    const normalizedAllowedRoles = allowedRoles.map(role => normalizeRole(role));
    return normalizedAllowedRoles.includes(normalizedRole);
  };

  return {
    ...authState,
    userRole: normalizedRole,
    logout,
    canAccess,
    canAccessManager: normalizedRole === 'manager',
    canAccessOwner: normalizedRole === 'owner',
    canAccessTenant: normalizedRole === 'tenant'
  };
};

// Role-specific guards
export const useManagerGuard = () => {
  const auth = useFlexibleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        console.log('Manager guard: Not authenticated, redirecting to login');
        navigate('/login');
      } else if (!auth.canAccessManager) {
        console.log('Manager guard: Not a manager, redirecting to appropriate dashboard');
        switch (auth.userRole) {
          case 'owner':
            window.location.href = '/owner';
            break;
          case 'tenant':
            window.location.href = '/tenant';
            break;
          default:
            navigate('/login');
        }
      } else {
        console.log('Manager guard: Access granted');
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.canAccessManager, auth.userRole, navigate]);

  return auth;
};

export const useOwnerGuard = () => {
  const auth = useFlexibleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        navigate('/login');
      } else if (!auth.canAccessOwner) {
        switch (auth.userRole) {
          case 'manager':
            window.location.href = '/manager';
            break;
          case 'tenant':
            window.location.href = '/tenant';
            break;
          default:
            navigate('/login');
        }
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.canAccessOwner, auth.userRole, navigate]);

  return auth;
};

export const useTenantGuard = () => {
  const auth = useFlexibleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        navigate('/login');
      } else if (!auth.canAccessTenant) {
        switch (auth.userRole) {
          case 'manager':
            window.location.href = '/manager';
            break;
          case 'owner':
            window.location.href = '/owner';
            break;
          default:
            navigate('/login');
        }
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.canAccessTenant, auth.userRole, navigate]);

  return auth;
};