import { Link } from 'react-router-dom';
import { useUserPermissions } from '../../hooks/useRoleGuard';

export default function HomePage() {
  const { isAuthenticated, userRole } = useUserPermissions();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    
    switch (userRole) {
      case 'manager':
        return '/manager';
      case 'owner':
        return '/owner';
      case 'tenant':
        return '/tenant';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🏢 PMS</h1>
              <span className="text-gray-600">Property Management System</span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              {isAuthenticated ? (
                <Link 
                  to={getDashboardLink()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-8">🏘️</div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Property Management
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your property management with our comprehensive platform designed for property owners, managers, and tenants.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {isAuthenticated ? (
              <Link
                to={getDashboardLink()}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* For Property Managers */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                    <span className="text-2xl text-white">👨‍💼</span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    For Property Managers
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Manage tenants, handle payments, track maintenance requests, and oversee multiple properties from one dashboard.
                  </p>
                  <div className="mt-6">
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Tenant Management</li>
                      <li>• Payment Tracking</li>
                      <li>• Maintenance Requests</li>
                      <li>• Property Analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* For Property Owners */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-green-500 rounded-md shadow-lg">
                    <span className="text-2xl text-white">🏠</span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    For Property Owners
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Monitor your investments, track revenue, view detailed reports, and make informed decisions about your properties.
                  </p>
                  <div className="mt-6">
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Revenue Analytics</li>
                      <li>• Occupancy Reports</li>
                      <li>• Performance Metrics</li>
                      <li>• Investment Insights</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* For Tenants */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-orange-500 rounded-md shadow-lg">
                    <span className="text-2xl text-white">👥</span>
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    For Tenants
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Pay rent online, submit maintenance requests, track payment history, and communicate with property management.
                  </p>
                  <div className="mt-6">
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Online Rent Payment</li>
                      <li>• Maintenance Requests</li>
                      <li>• Payment History</li>
                      <li>• Direct Communication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Status */}
        {isAuthenticated && (
          <div className="mt-20 bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome back! 👋
            </h2>
            <p className="text-gray-600 mb-6">
              You're logged in as a <span className="font-semibold text-blue-600">{userRole}</span>
            </p>
            <Link
              to={getDashboardLink()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Access Your Dashboard
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 Property Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}