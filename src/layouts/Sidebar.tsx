import { NavLink, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavItems = () => {
    if (currentPath.startsWith('/manager')) {
      return [
        { to: '/manager/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/manager/estates', label: 'Properties', icon: '🏢' },
        { to: '/manager/tenants', label: 'Tenants', icon: '👥' },
        { to: '/manager/complaints', label: 'Complaints', icon: '📋' },
        { to: '/manager/payments', label: 'Payments', icon: '📋' },
      ];
    }
    if (currentPath.startsWith('/owner')) {
      return [
        { to: '/owner/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/owner/reports', label: 'Reports', icon: '📑' },
      ];
    }
    if (currentPath.startsWith('/tenant')) {
      return [
        { to: '/tenant/dashboard', label: 'Dashboard', icon: '📊' },
        { to: '/tenant/payments', label: 'Payments', icon: '💰' },
        { to: '/tenant/complaints', label: 'Complaints', icon: '📋' },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <aside className="bg-white border-gray-200 border" style={{ width: '16rem' }}>
      <div className="p-4 text-xl font-bold text-blue-600">PMS</div>
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <div className="pt-4 mt-4 border-gray-200 border-t">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Switch Role</div>
          <NavLink to="/manager" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
            <span>👨‍💼</span>
            <span>Manager</span>
          </NavLink>
          <NavLink to="/owner" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
            <span>🏠</span>
            <span>Owner</span>
          </NavLink>
          <NavLink to="/tenant" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">
            <span>🏡</span>
            <span>Tenant</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
