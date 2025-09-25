import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

// Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
// import NavigationGuard from './components/NavigationGuard';
import { ManagerRoute, OwnerRoute, TenantRoute, RoleBasedRedirect } from './components/ProtectedRoute';
import { UnauthorizedAccess } from './components/NavigationGuard';

// Dashboard Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import ReportsPage from './pages/owner/ReportsPage';
import TenantDashboard from './pages/tenant/TenantDashboard';

// Public Pages
// import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import BackgroundCarousel from './components/background';
// import BG from './components/spline_background';

function App() {
  return (
    <Provider store={store}>
      {/* <NavigationGuard /> - Temporarily disabled to fix redirect issue */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'all', overflow: 'hidden' }}>
        {/* <BG /> */}
        <BackgroundCarousel
        images={['/bg-1.jpg','/bg-2.jpg','/bg-3.jpg','/bg-4.jpg','/bg-5.jpg']}
        autoplay
        intervalMs={6000}
        fadeMs={1000}
        // pauseOnHover
        // showIndicators
        // showArrows
        // enableKeyboard
        // enableSwipe
        />
      </div>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/unauthorized" element={<UnauthorizedAccess />} />

        {/* Role-based Dashboard Routes */}
        
        {/* Manager Routes */}
        <Route 
          path="/manager/*" 
          element={
            <ManagerRoute>
              <ManagerDashboard />
            </ManagerRoute>
          } 
        />

        {/* Owner Routes */}
        <Route 
          path="/owner" 
          element={
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          } 
        />
        <Route 
          path="/owner/reports" 
          element={
            <OwnerRoute>
              <ReportsPage />
            </OwnerRoute>
          } 
        />

        {/* Tenant Routes */}
        <Route 
          path="/tenant/*" 
          element={
            <TenantRoute>
              <TenantDashboard />
            </TenantRoute>
          } 
        />

        {/* Auto-redirect based on user role */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Provider>
  );
}

export default App;
