import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoginMutation } from '../services/apiSlice';
import { useAppDispatch } from '../store';
import { setCredentials } from '../services/authSlice';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [credentials, setCredentialsState] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentialsState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Login to get tokens
      const loginResult = await login(credentials).unwrap();
      console.log('Login successful:', loginResult);
      
      // Now fetch user profile with the token
      try {
        const profileResponse = await fetch('http://127.0.0.1:8000/api/profile/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginResult.access}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Profile data:', profileData);
          
          // Update credentials with complete user data
          dispatch(setCredentials({
            access: loginResult.access,
            refresh: loginResult.refresh,
            user: profileData
          }));
          
          // Also save to localStorage for immediate access
          localStorage.setItem('access_token', loginResult.access);
          localStorage.setItem('refresh_token', loginResult.refresh);
          localStorage.setItem('user_profile', JSON.stringify(profileData));
          
          console.log('Saved to localStorage:');
          console.log('- access_token:', !!localStorage.getItem('access_token'));
          console.log('- user_profile:', localStorage.getItem('user_profile'));
          
          // Immediate navigation based on role
          const userRole = profileData.role;
          console.log('User role:', userRole);
          
          // Force navigation using window.location for immediate redirect
          let targetPath = '/tenant'; // default
          switch (userRole?.toLowerCase()) {
            case 'manager':
              targetPath = '/manager';
              break;
              case 'owner':
                targetPath = '/owner';
                break;
                case 'tenant':
                  targetPath = '/tenant';
                  break;
                }
                
                console.log('Redirecting to:', targetPath);
                
          // Use window.location for immediate redirect
          window.location.href = targetPath;
        } else {
          console.error('Failed to fetch user profile');
          window.location.href = '/tenant'; // Fallback
        }
      } catch (profileError) {
        console.error('Profile fetch error:', profileError);
        window.location.href = '/tenant'; // Fallback
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden  text-white" style={{ backgroundImage: 'url(/login_bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Decorative gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-[480px] h-[480px] bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-24 w-[520px] h-[520px] bg-emerald-500/30 rounded-full blur-3xl animate-pulse delay-150" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_60%)]" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex items-center justify-center" style={{ width: '250px', height: '100px' }}>
            {/* <span className="text-2xl font-extrabold tracking-wider">EE</span> */}
            <img src="/logo.png" alt="Edith Estates Logo" className="rounded-2xl" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
            Edith Estates
          </h1>
          <p className="mt-2 text-sm text-indigo-100">
            Secure access to your property management portal
          </p>
        </div>

        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/25 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-white/0 to-white/10 pointer-events-none" />

            <form onSubmit={handleSubmit} className="relative space-y-7">
              <div className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-xs font-medium uppercase tracking-wide text-indigo-100 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={credentials.username}
                    onChange={handleInputChange}
                    className="peer w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner"
                    placeholder="Username"
                  />
                  <span className="mt-1 block text-[11px] text-indigo-200/70">
                    Enter your registered username
                  </span>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-indigo-100 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={credentials.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner"
                      placeholder="Password"
                    />
                    {/* Show/hide password toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-[11px] text-indigo-100 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="mt-1 block text-[11px] text-indigo-200/70">
                    Keep your credentials confidential
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-sm text-rose-100">
                  Authentication failed. Check credentials.
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold tracking-wide shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition" />
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="pt-2 space-y-4">
                {/* <p className="text-center text-[11px] text-indigo-100">
                  Demo roles supported: tenant / manager / owner
                </p> */}
                <p className="text-center text-sm text-indigo-100">
                  Need an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-[10px] tracking-wide text-indigo-200/70">
            © {new Date().getFullYear()} Edith Estates • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}