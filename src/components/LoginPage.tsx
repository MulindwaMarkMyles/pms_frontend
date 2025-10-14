import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLoginMutation } from '../services/apiSlice';
import { useAppDispatch } from '../store';
import { setCredentials } from '../services/authSlice';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

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
      const loginResult = await login(credentials).unwrap();
      try {
        const profileResponse = await axios.get('/api/profile/', {
          baseURL: 'http://localhost:8000',
          headers: {
            'Authorization': `Bearer ${loginResult.access}`,
            'Content-Type': 'application/json',
          },
        });
        const profileData = profileResponse.data;
        dispatch(setCredentials({
          access: loginResult.access,
          refresh: loginResult.refresh,
          user: profileData
        }));
        localStorage.setItem('access_token', loginResult.access);
        localStorage.setItem('refresh_token', loginResult.refresh);
        localStorage.setItem('user_profile', JSON.stringify(profileData));
        const userRole = profileData.role;
        let targetPath = '/tenant';
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
        window.location.href = targetPath;
      } catch {
        window.location.href = '/tenant';
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen w-full flex  text-white">
      {/* Left (Form) - Desktop Only */}
      <div className="relative w-1/2 flex flex-col backdrop-blur-xl bg-blue/70">
        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-44 -right-40 w-[560px] h-[560px] bg-emerald-500/25 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.06),transparent_65%)]" />
        </div>

        <div className="relative flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-white/0 to-white/10 pointer-events-none" />
              
              <form onSubmit={handleSubmit} className="relative space-y-7">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="username" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500"
                      placeholder="Enter username"
                    />
                    <span className="mt-1 block text-[11px] text-indigo-200/70">
                      Use your portal handle
                    </span>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
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
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-indigo-100 hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="mt-1 block text-[11px] text-indigo-200/70">
                      Keep credentials secure
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
                  className="w-full relative group overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold"
                  style={{ backgroundColor: '#267ec6c4' }}
                >
                  <span className="absolute inset-0" />
                  <span className="relative text-white">
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </span>
                </button>

                <div className="pt-2 space-y-4">
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

            <div className="mt-8 text-center">
              <p className="text-[10px] tracking-wide text-indigo-200/60">
                © {new Date().getFullYear()} Edith Estates • All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right (Brand / Hero) - Desktop Only */}
      <div className="w-1/2 relative flex items-center justify-center overflow-hidden opacity-100">
        {/* Layered background */}
        <div className="absolute inset-0">
          {/* <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900" />
          <div className="absolute inset-0 mix-blend-overlay opacity-40 bg-[radial-gradient(circle_at_20%_25%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,transparent_60%),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_100%,36px_36px,36px_36px]" /> */}

        </div>

        <div className="relative z-10 max-w-xl px-10">
          <div className="flex flex-col items-start text-shadow-lg">
            <div className="mb-10">
              <img
                src="/logo.png"
                alt="Edith Estates Logo"
                className="w-80 h-40 object-cover rounded-2xl shadow-2xl shadow-emerald-500/20 ring-2 ring-white/10 backdrop-blur"
              />
            </div>
            <h2 className="text-5xl font-extrabold ">
              Edith Estates
            </h2>
            <p className="mt-6 text-lg text-indigo-100/85 leading-relaxed max-w-md">
              Streamlined property management for owners, tenants, and managers.
              Insight, automation, and clarity in one secure portal.
            </p>

            <ul className="mt-8 space-y-4 text-sm">
              {[
                'Real-time portfolio insights',
                'Secure tenant communication',
                'Automated task workflows',
                'Role-based personalized dashboards'
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </span>
                  <span className="text-indigo-100/90">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex gap-6">
              <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
                <span className="text-xs font-semibold tracking-wide text-indigo-100">
                  Secure
                </span>
              </div>
              <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
                <span className="text-xs font-semibold tracking-wide text-indigo-100">
                  Smart
                </span>
              </div>
              <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
                <span className="text-xs font-semibold tracking-wide text-indigo-100">
                  Scalable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating accent orbs */}
        <div className="absolute top-10 right-16 w-40 h-40 bg-emerald-400/25 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-10 left-10 w-52 h-52 bg-indigo-500/25 blur-3xl rounded-full animate-pulse delay-150" />
      </div>
    </div>
  );
}