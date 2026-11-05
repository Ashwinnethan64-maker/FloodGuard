import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button, NeerpathLogo } from '../components/ui';

export const SignUpPage = () => {
  const { login, signInWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-[#e2e8f0]' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-[#dc2626]' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-[#d97706]' };
    return { score: 3, label: 'Strong', color: 'bg-[#059669]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must accept the terms of service and Mangaluru civic privacy policy.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email, 'resident');
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
            Create an account
          </h2>
          <p className="text-xs text-[#64748d]">
            Join Mangaluru's intelligent flood awareness & civic response network
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#e5edf5] rounded-[4px] p-8 shadow-xs space-y-5">
          {error && (
            <div className="p-3 rounded-[4px] bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#061b31] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kavitha Shenoy"
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] pl-9 pr-3.5 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
                />
              </div>
            </div>

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
                  placeholder="name@example.com"
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] pl-9 pr-3.5 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#061b31] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#64748d]">
                    <span>Password strength:</span>
                    <span className="font-semibold text-[#061b31]">{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-[#f1f5f9] rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-[#e2e8f0]'}`} />
                    <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : 'bg-[#e2e8f0]'}`} />
                    <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-[#e2e8f0]'}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#061b31] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748d] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-white border border-[#e5edf5] rounded-[4px] pl-9 pr-3.5 py-2 text-xs text-[#061b31] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd] transition-all"
                />
              </div>
            </div>

            <div className="flex items-start">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-[#50617a]">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded-[2px] border-[#e5edf5] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[11px] leading-snug">
                  I agree to the FLOODGUARD terms of service, civic privacy policy, and geospatial emergency advisory guidelines.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
              size="lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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

          {/* Login Link */}
          <div className="text-center pt-2 border-t border-[#f1f5f9]">
            <span className="text-xs text-[#64748d]">Already have an account? </span>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#533afd] hover:text-[#7389ff] transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Verification notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748d]">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>Resident accounts enable instant localized route hazard submissions</span>
        </div>
      </div>
    </div>
  );
};
