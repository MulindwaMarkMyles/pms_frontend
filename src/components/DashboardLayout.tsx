import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { useUserPermissions } from '../hooks/useRoleGuard';
import { logout } from '../services/authSlice';

interface DashboardLayoutProps {
  userType: 'manager' | 'owner' | 'tenant';
  children?: React.ReactNode;
}

export default function DashboardLayout({ userType, children }: DashboardLayoutProps) {
  const { user, isAuthenticated } = useUserPermissions();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null; // Let the ProtectedRoute handle redirects
  }

  const getUserTitle = () => {
    switch (userType) {
      case 'manager':
        return 'Property Manager Portal';
      case 'owner':
        return 'Property Owner Portal';
      case 'tenant':
        return 'Tenant Portal';
      default:
        return 'Dashboard';
    }
  };

  const getUserIcon = () => {
    switch (userType) {
      case 'manager':
        return '👨‍💼';
      case 'owner':
        return '🏠';
      case 'tenant':
        return '👥';
      default:
        return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🏢</span>
                <span className="text-xl font-bold text-gray-900">PMS</span>
              </Link>
              <div className="border-l border-gray-300 pl-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getUserIcon()}</span>
                  <span className="text-lg font-semibold text-gray-900">{getUserTitle()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome,</span>
                <span className="font-medium">{user?.username || user?.name || 'User'}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {userType}
                </span>
              </div>
              
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm"
              >
                Home
              </Link>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 Property Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Convenience components for specific user types
export const ManagerLayout = ({ children }: { children?: React.ReactNode }) => (
  <DashboardLayout userType="manager">{children}</DashboardLayout>
);

export const OwnerLayout = ({ children }: { children?: React.ReactNode }) => (
  <DashboardLayout userType="owner">{children}</DashboardLayout>
);

export const TenantLayout = ({ children }: { children?: React.ReactNode }) => (
  <DashboardLayout userType="tenant">{children}</DashboardLayout>
);