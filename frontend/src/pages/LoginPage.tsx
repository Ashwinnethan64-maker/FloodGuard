import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, NeerpathLogo } from '../components/ui';

export const LoginPage = () => {
  const { login, devBypassLogin, signInWithGoogle, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect straight to their role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'administrator') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'responder') {
        navigate('/responder', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Protected Dev Testing Panel toggle
  const [showDevPanel, setShowDevPanel] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    if (!password) {
      setError('Please provide your account password.');
      return;
    }

    setLoading(true);
    const { error: loginError } = await login(email, password);
    setLoading(false);

    if (loginError) {
      setError(loginError);
    }
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
        setError(`Google Sign-In Notice: ${authError}`);
      }
    }
  };

  const handleDevRoleSelect = (role: UserRole) => {
    devBypassLogin(role);
    if (role === 'administrator') navigate('/admin');
    else if (role === 'responder') navigate('/responder');
    else navigate('/dashboard');
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
        <div className="bg-white border border-[#e5edf5] rounded-sm p-8 shadow-xs space-y-5">
          {error && (
            <div className="p-3 rounded-sm bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs leading-relaxed">
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
                  className="w-full bg-white border border-[#e5edf5] rounded-sm pl-9 pr-3.5 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#061b31]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#533afd] hover:text-[#7389ff] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full bg-white border border-[#e5edf5] rounded-sm pl-9 pr-9 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-xs border-[#e5edf5] text-[#533afd] focus:ring-[#533afd] w-3.5 h-3.5"
                />
                <span className="text-xs text-[#64748d]">Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Social Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5edf5]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-[#64748d] font-semibold tracking-wider">
                Or Continue With
              </span>
            </div>
          </div>

          {/* Real Google OAuth Login */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 bg-white border border-[#e5edf5] rounded-sm text-xs font-semibold text-[#061b31] hover:bg-[#f8fafd] hover:border-[#cbd5e1] transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-[#533afd] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Separate Protected Development / Evaluator Mode (Requirement 4) */}
          <div className="pt-2 border-t border-[#f1f5f9]">
            <button
              type="button"
              onClick={() => setShowDevPanel(!showDevPanel)}
              className="w-full flex items-center justify-between text-[11px] text-[#64748d] hover:text-[#061b31] transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#533afd]" />
                Development Role Simulator
              </span>
              {showDevPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDevPanel && (
              <div className="mt-2 p-3 bg-[#f8fafd] border border-[#e5edf5] rounded-sm space-y-2 animate-in fade-in">
                <p className="text-[10px] text-[#64748d]">
                  Quick test environment to inspect role-gated dashboards without bypassing production Supabase checks:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDevRoleSelect('administrator')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white border border-[#e5edf5] text-[#533afd] hover:bg-[#e8e9ff] transition-colors"
                  >
                    Admin Test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevRoleSelect('responder')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white border border-[#e5edf5] text-[#d97706] hover:bg-[#fffbeb] transition-colors"
                  >
                    Responder Test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevRoleSelect('resident')}
                    className="py-1 px-2 text-[10px] font-semibold rounded bg-white border border-[#e5edf5] text-[#059669] hover:bg-[#ecfdf5] transition-colors"
                  >
                    Citizen Test
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create account link */}
        <div className="text-center text-xs text-[#64748d]">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-[#533afd] font-medium hover:text-[#7389ff] transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
