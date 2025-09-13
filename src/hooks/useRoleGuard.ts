import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';

interface UseRoleGuardOptions {
  allowedRoles: string[];
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export const useRoleGuard = (options: UseRoleGuardOptions) => {
  const { allowedRoles, redirectTo, onUnauthorized } = options;
  // Get auth state directly from store structure - accessing tokens if that's the structure
  const authState = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Role guard checking auth state:', authState);
    
    // Check localStorage as fallback since the store structure seems different
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_profile');
    
    console.log('Stored token:', !!storedToken);
    console.log('Stored user:', storedUser);
    
    // Check if authenticated using localStorage (since that's where login saves it)
    if (!storedToken || !storedUser) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error('Failed to parse user data');
      navigate('/login');
      return;
    }

    // Get user role
    const userRole = user.role || user.user_type || 'tenant';
    console.log('User role:', userRole);
    
    // Normalize role names
    const normalizeRole = (role: string) => {
      switch (role.toLowerCase()) {
        case 'property_manager':
        case 'manager':
          return 'manager';
        case 'property_owner':
        case 'owner':
          return 'owner';
        case 'tenant':
          return 'tenant';
        default:
          return role.toLowerCase();
      }
    };

    const normalizedUserRole = normalizeRole(userRole);
    const normalizedAllowedRoles = allowedRoles.map(role => normalizeRole(role));
    
    console.log('Normalized user role:', normalizedUserRole);
    console.log('Allowed roles:', normalizedAllowedRoles);

    // Check if user's role is allowed
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.log('Role not allowed, redirecting...');
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Redirect to appropriate dashboard using window.location for immediate redirect
        switch (normalizedUserRole) {
          case 'manager':
            window.location.href = '/manager';
            break;
          case 'owner':
            window.location.href = '/owner';
            break;
          case 'tenant':
            window.location.href = '/tenant';
            break;
          default:
            navigate(redirectTo || '/login');
        }
      }
    } else {
      console.log('Access granted for role:', normalizedUserRole);
    }
  }, [allowedRoles, navigate, redirectTo, onUnauthorized]);

  // Get user data from localStorage for return values
  const storedToken = localStorage.getItem('access_token');
  const storedUser = localStorage.getItem('user_profile');
  let user = null;
  
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      // ignore parsing errors
    }
  }

  return {
    user,
    isAuthenticated: !!(storedToken && user),
    userRole: user?.role || user?.user_type || 'tenant'
  };
};

// Convenience hooks for specific roles
export const useManagerGuard = () => 
  useRoleGuard({ allowedRoles: ['manager', 'property_manager'] });

export const useOwnerGuard = () => 
  useRoleGuard({ allowedRoles: ['owner', 'property_owner'] });

export const useTenantGuard = () => 
  useRoleGuard({ allowedRoles: ['tenant'] });

// Get user permissions using localStorage
export const useUserPermissions = () => {
  const storedToken = localStorage.getItem('access_token');
  const storedUser = localStorage.getItem('user_profile');
  
  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      // ignore parsing errors
    }
  }

  const isAuthenticated = !!(storedToken && user);
  const userRole = user?.role || user?.user_type || 'tenant';

  const normalizeRole = (role: string) => {
    switch (role.toLowerCase()) {
      case 'property_manager':
      case 'manager':
        return 'manager';
      case 'property_owner':
      case 'owner':
        return 'owner';
      case 'tenant':
        return 'tenant';
      default:
        return role.toLowerCase();
    }
  };

  const normalizedRole = normalizeRole(userRole);

  return {
    user,
    isAuthenticated,
    userRole: normalizedRole,
    canAccessManager: normalizedRole === 'manager',
    canAccessOwner: normalizedRole === 'owner',
    canAccessTenant: normalizedRole === 'tenant',
    canAccess: (roles: string[]) => {
      const normalizedRoles = roles.map(role => normalizeRole(role));
      return normalizedRoles.includes(normalizedRole);
    }
  };
};