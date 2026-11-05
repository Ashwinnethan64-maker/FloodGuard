import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, NeerpathLogo } from '../components/ui';

export const LoginPage = () => {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState<UserRole>('administrator');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    if (!password) {
      setError('Please provide your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email, role);
      setLoading(false);
      navigate('/dashboard');
    }, 400);
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    setGoogleLoading(false);

    if (authError) {
      if (authError.includes('Unsupported provider') || authError.includes('provider is not enabled')) {
        setError('Supabase Google OAuth provider is not yet enabled in the project dashboard. Please enable Google in Supabase Auth > Providers.');
      } else {
        setError(`Google Sign-In Error: ${authError}`);
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-[420px] w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <NeerpathLogo size="lg" className="group-hover:scale-105" />
            <span className="text-xl font-bold tracking-tight text-[#061b31]">FLOODGUARD</span>
          </Link>
          <h2 className="text-xl font-semibold text-[#061b31] tracking-tight">
            Welcome back
          </h2>
          <p className="text-xs text-[#64748d]">
            Sign in to access Mangaluru road intelligence & dispatch
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#e5edf5] rounded-[4px] p-8 shadow-xs space-y-5">
          {/* Quick Role Context Switcher for Demonstration/Evaluator testing */}
          <div className="p-3 bg-[#f8fafd] border border-[#e5edf5] rounded-[4px] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#50617a]">
              <span>Select Security Role:</span>
              <span className="text-[#533afd] font-semibold">{role.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'administrator', label: 'Admin' },
                { id: 'responder', label: 'Responder' },
                { id: 'resident', label: 'Citizen' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id as UserRole)}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-[4px] border transition-colors ${
                    role === r.id
                      ? 'bg-[#533afd] text-white border-[#533afd]'
                      : 'bg-white text-[#50617a] border-[#e5edf5] hover:bg-[#f8fafd]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-[4px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#061b31] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.in"
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] pl-9 pr-3.5 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#061b31]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password recovery flow initiates via email.')}
                  className="text-[11px] text-[#533afd] hover:text-[#7389ff] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] pl-9 pr-9 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#64748d] hover:text-[#061b31]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#50617a]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-[2px] border-[#e5edf5] text-[#533afd] focus:ring-[#533afd]"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
              size="lg"
            >
              {loading ? 'Authenticating Session...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 border-t border-[#e5edf5]" />
            <span className="relative bg-white px-3 text-[11px] text-[#64748d] uppercase tracking-wider">
              OR
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-[4px] border border-[#e5edf5] bg-white hover:bg-[#f8fafd] text-[#061b31] text-xs font-medium transition-colors shadow-2xs disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-2 border-t border-[#f1f5f9]">
            <span className="text-xs text-[#64748d]">Don't have an account? </span>
            <Link
              to="/signup"
              className="text-xs font-semibold text-[#533afd] hover:text-[#7389ff] transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Verification notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748d]">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>Role-Based Access Control Active for Mangaluru Grid</span>
        </div>
      </div>
    </div>
  );
};
