import { Navigate, useLocation } from 'react-router-dom';
import { useFlexibleAuth } from '../hooks/useFlexibleAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, userRole, canAccess, isLoading } = useFlexibleAuth();
  const location = useLocation();

  console.log('ProtectedRoute - Full auth state:', { 
    user, 
    isAuthenticated, 
    userRole, 
    isLoading,
    allowedRoles,
    token: !!localStorage.getItem('access_token'),
    storedUser: localStorage.getItem('user_profile')
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed for this route
  if (!canAccess(allowedRoles)) {
    console.log('ProtectedRoute - Role not allowed, redirecting...');
    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case 'manager':
        return <Navigate to="/manager" replace />;
      case 'owner':
        return <Navigate to="/owner" replace />;
      case 'tenant':
        return <Navigate to="/tenant" replace />;
      default:
        return <Navigate to={redirectTo} replace />;
    }
  }

  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
}

// Convenience components for specific roles
export const ManagerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['manager', 'property_manager']}>
    {children}
  </ProtectedRoute>
);

export const OwnerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['owner', 'property_owner']}>
    {children}
  </ProtectedRoute>
);

export const TenantRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['tenant']}>
    {children}
  </ProtectedRoute>
);

// Component to redirect users to their appropriate dashboard
export const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useFlexibleAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role || user.user_type || 'tenant';
  
  switch (userRole.toLowerCase()) {
    case 'property_manager':
    case 'manager':
      return <Navigate to="/manager" replace />;
    case 'property_owner':
    case 'owner':
      return <Navigate to="/owner" replace />;
    case 'tenant':
      return <Navigate to="/tenant" replace />;
    default:
      return <Navigate to="/tenant" replace />;
  }
};