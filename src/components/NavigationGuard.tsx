import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFlexibleAuth } from '../hooks/useFlexibleAuth';

export default function NavigationGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, canAccess } = useFlexibleAuth();

  useEffect(() => {
    const currentPath = location.pathname;

    // Allow access to public routes
    const publicRoutes = ['/', '/login', '/register', '/about', '/contact'];
    if (publicRoutes.includes(currentPath)) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      return;
    }

    // Define role-based route patterns
    const routePermissions = {
      '/manager': ['manager'],
      '/owner': ['owner'],
      '/tenant': ['tenant']
    };

    // Check if current path requires specific permissions
    let hasAccess = false;
    let redirectPath = '';

    for (const [route, requiredRoles] of Object.entries(routePermissions)) {
      if (currentPath.startsWith(route)) {
        hasAccess = canAccess(requiredRoles);
        if (!hasAccess) {
          // Redirect to user's appropriate dashboard
          switch (userRole) {
            case 'manager':
              redirectPath = '/manager';
              break;
            case 'owner':
              redirectPath = '/owner';
              break;
            case 'tenant':
              redirectPath = '/tenant';
              break;
            default:
              redirectPath = '/login';
          }
        }
        break;
      }
    }

    // If access denied, redirect
    if (!hasAccess && redirectPath && currentPath !== redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [location, navigate, isAuthenticated, userRole, canAccess]);

  return null; // This component doesn't render anything
}

// Unauthorized access component
export const UnauthorizedAccess = () => {
  const navigate = useNavigate();
  const { userRole } = useFlexibleAuth();

  const handleGoToDashboard = () => {
    switch (userRole) {
      case 'manager':
        navigate('/manager');
        break;
      case 'owner':
        navigate('/owner');
        break;
      case 'tenant':
        navigate('/tenant');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};