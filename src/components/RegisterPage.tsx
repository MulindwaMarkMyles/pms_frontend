import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../services/apiSlice';
import { useAppDispatch } from '../store';
import { setCredentials } from '../services/authSlice';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface RegistrationData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  role: 'tenant' | 'manager' | 'owner';
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    role: 'tenant'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [register, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await register(formData).unwrap();
      
      // Show success message
      setShowSuccess(true);
      
      // Wait 30 seconds before redirecting
      setTimeout(() => {
        // Set credentials from registration response
        dispatch(setCredentials({
          access: result.tokens.access,
          refresh: result.tokens.refresh,
          user: {
            ...result.user,
            ...result.profile
          }
        }));
        
        // Role-based routing after registration
        switch (formData.role) {
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
            navigate('/tenant');
        }
      }, 30000);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  // If success message is showing, display it instead of form
  if (showSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-white">
        <div className="relative w-1/2 flex flex-col backdrop-blur-xl bg-blue/70">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
            <div className="absolute -bottom-44 -right-40 w-[560px] h-[560px] bg-emerald-500/25 rounded-full blur-3xl" />
          </div>
          <div className="relative flex-1 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  Registration Successful!
                </h2>
                <p className="text-lg text-indigo-100/90 mb-6">
                  An email with further instructions has been sent to{' '}
                  <span className="font-semibold text-emerald-300">
                    {formData.email}
                  </span>
                </p>
                <p className="text-sm text-indigo-200/70">
                  Please check your inbox (and spam folder) to verify your account.
                  You will be redirected shortly...
                </p>
                <div className="mt-8">
                  <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/2 relative flex items-center justify-center overflow-hidden">
          <div className="relative z-10 max-w-xl px-10">
            <div className="flex flex-col items-start text-shadow-lg">
              <div className="mb-10">
                <img
                  src="/logo.png"
                  alt="Edith Estates Logo"
                  className="w-80 h-40 object-cover rounded-2xl shadow-2xl shadow-emerald-500/20 ring-2 ring-white/10 backdrop-blur"
                />
              </div>
            </div>
          </div>
          <div className="absolute top-10 right-16 w-40 h-40 bg-emerald-400/25 blur-3xl rounded-full animate-pulse" />
          <div className="absolute bottom-10 left-10 w-52 h-52 bg-indigo-500/25 blur-3xl rounded-full animate-pulse delay-150" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex text-white">
      <div className="w-1/2 relative flex items-center justify-center overflow-hidden opacity-100">
        {/* <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900" />
          <div className="absolute inset-0 mix-blend-overlay opacity-40 bg-[radial-gradient(circle_at_20%_25%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,transparent_60%),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_100%,36px_36px,36px_36px]" />
        </div> */}
        <div className="relative z-10 max-w-xl px-10">
          <div className="flex flex-col items-start text-shadow-lg">
            <div className="mb-10">
              <img
                src="/logo.png"
                alt="Edith Estates Logo"
                className="w-80 h-40 object-cover rounded-2xl shadow-2xl shadow-emerald-500/20 ring-2 ring-white/10 backdrop-blur"
              />
            </div>
            <h2 className="text-5xl font-extrabold">
              Welcome to Edith Estates
            </h2>
            <p className="mt-6 text-lg text-indigo-100/85 leading-relaxed max-w-md">
              Create a unified account that empowers you to manage properties,
              collaborate with stakeholders, and stay ahead of every detail.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              {[
                'Guided role-specific onboarding',
                'Secure document and communication hub',
                'Automated reminders and workflows',
                'Insightful dashboards tailored to you'
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
                  Unified
                </span>
              </div>
              <div className="h-14 w-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
                <span className="text-xs font-semibold tracking-wide text-indigo-100">
                  Secure
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
        <div className="absolute top-10 right-16 w-40 h-40 bg-emerald-400/25 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-10 left-10 w-52 h-52 bg-indigo-500/25 blur-3xl rounded-full animate-pulse delay-150" />
      </div>
      <div className="relative w-1/2 flex flex-col backdrop-blur-xl bg-blue/70">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-44 -right-40 w-[560px] h-[560px] bg-emerald-500/25 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.06),transparent_65%)]" />
        </div>
        <div className="relative flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-white/0 to-white/10 pointer-events-none" />
              <form className="relative space-y-7" onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="username" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                        Username *
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500"
                        placeholder="Choose a username"
                      />
                      <span className="mt-1 block text-[11px] text-indigo-200/70">
                        Pick a unique handle for the portal
                      </span>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500"
                        placeholder="you@example.com"
                      />
                      <span className="mt-1 block text-[11px] text-indigo-200/70">
                        We&apos;ll send updates and notifications here
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner"
                        placeholder="Choose a secure password"
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
                      Use at least 8 characters with a mix of symbols
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="first_name" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                        First Name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone_number" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                        Phone Number
                      </label>
                      <input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500"
                        placeholder="+256700123456"
                      />
                      <span className="mt-1 block text-[11px] text-indigo-200/70">
                        Include your country code for verification
                      </span>
                    </div>
                    <div>
                      <label htmlFor="role" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                        Role *
                      </label>
                      <select
                        id="role"
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner"
                      >
                        <option value="tenant">Tenant</option>
                        {/* <option value="manager">Property Manager</option>
                        <option value="owner">Property Owner</option> */}
                      </select>
                      <span className="mt-1 block text-[11px] text-indigo-200/70">
                        Tailors the experience to your responsibilities
                      </span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-100 mb-2">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/15 border border-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 text-black shadow-inner placeholder:text-neutral-500 min-h-[96px]"
                      placeholder="123 Main Street, Kampala"
                    />
                    <span className="mt-1 block text-[11px] text-indigo-200/70">
                      Helps managers connect you to the right properties
                    </span>
                  </div>
                </div>
                {error && (
                  <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-sm text-rose-100">
                    Registration failed. Please check your information and try again.
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
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </span>
                </button>
                <div className="pt-2">
                  <p className="text-center我的 text-sm text-indigo-100">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
                    >
                      Sign in here
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
    </div>
  );
}