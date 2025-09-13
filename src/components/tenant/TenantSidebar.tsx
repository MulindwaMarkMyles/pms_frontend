import { useState } from 'react';
import { useFlexibleAuth } from '../../hooks/useFlexibleAuth';

export type TenantPage = 'dashboard' | 'payments' | 'complaints' | 'profile';

interface TenantSidebarProps {
  active: TenantPage;
  onChange: (val: TenantPage) => void;
}

const navItems: { key: TenantPage; label: string; icon: string }[] = [
  { key: 'dashboard',  label: 'Dashboard',   icon: 'space_dashboard' },
  { key: 'payments',   label: 'Payments',    icon: 'payments' },
  { key: 'complaints', label: 'Complaints',  icon: 'report_problem' },
];

export default function TenantSidebar({ active, onChange }: TenantSidebarProps) {
  const { user, logout } = useFlexibleAuth();
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const desktopWidth = collapsed ? 'w-[82px]' : 'w-72';

  return (
    <>
      {/* Toggles */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button
          onClick={() => setOpenMobile(o => !o)}
          className="p-3 rounded-xl backdrop-blur-md bg-white/70 shadow-lg border border-white/20 hover:scale-105 transition"
        >
          <span className="material-icons text-indigo-600">{openMobile ? 'close' : 'menu'}</span>
        </button>
        <button
          onClick={() => setCollapsed(c=>!c)}
          className="p-3 rounded-xl backdrop-blur-md bg-white/70 shadow-lg border border-white/20 hover:scale-105 transition"
        >
          <span className="material-icons text-indigo-600">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Mobile Overlay */}
      <div
        onClick={()=>setOpenMobile(false)}
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${
          openMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed top-0 left-0 h-full ${desktopWidth} flex flex-col
          bg-gradient-to-br from-white/80 to-white/30 backdrop-blur-xl border-r border-white/30
          shadow-2xl transition-all duration-500 z-50
          ${openMobile ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="relative p-4 border-b border-white/30 flex items-center gap-3">
          <div
            className={`p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0 ${
              collapsed ? 'mx-auto' : ''
            }`}
          >
            <span className="material-icons text-white">home</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-blue-800 bg-clip-text text-transparent truncate">
                Tenant Portal
              </h1>
              <p className="text-[11px] text-gray-600">Welcome</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {navItems.map(item => {
            const activeState = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => { onChange(item.key); setOpenMobile(false); }}
                className={`group relative w-full flex items-center ${
                  collapsed ? 'justify-center' : ''
                } gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                ${
                  activeState
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-xl'
                    : 'text-gray-600 hover:bg-white/60 backdrop-blur-sm border border-transparent hover:border-white/40'
                }`}
              >
                <span
                  className={`material-icons text-base ${
                    activeState ? 'text-white' : 'text-indigo-500 group-hover:scale-110 transition-transform'
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {activeState && !collapsed && (
                  <span className="ml-auto material-icons text-xs animate-pulse">chevron_right</span>
                )}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-[11px] bg-gray-900 text-white opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition whitespace-nowrap shadow">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Actions */}
        <div className="p-4 border-t border-white/30 bg-white/40 backdrop-blur-md">
          <div
            className={`mb-3 flex ${
              collapsed ? 'flex-col items-center gap-2' : 'items-center gap-3'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {user?.username?.slice(0,2).toUpperCase() || 'TN'}
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.username || 'Tenant'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'tenant@example.com'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`w-full flex ${collapsed ? 'justify-center' : 'justify-center'} items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-medium shadow hover:shadow-lg transition`}
          >
            <span className="material-icons text-sm">logout</span>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Spacer */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-500 ${desktopWidth}`} />
    </>
  );
}
