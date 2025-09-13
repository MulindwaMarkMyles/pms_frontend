import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthRedirectProps {
  to: string;
  replace?: boolean;
}

export const AuthRedirect: React.FC<AuthRedirectProps> = ({ to, replace = true }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Force navigation
    navigate(to, { replace });
    
    // Fallback: force page refresh if navigation doesn't work
    const timer = setTimeout(() => {
      window.location.href = to;
    }, 1000);

    return () => clearTimeout(timer);
  }, [to, replace, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default AuthRedirect;