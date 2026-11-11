import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Button, NeerpathLogo } from '../components/ui';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const redirectTo = new URL('/auth/callback?type=recovery', window.location.origin).toString();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-[420px] w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center mb-1">
            <NeerpathLogo size="lg" />
          </div>
          <h1 className="text-2xl font-light text-[#061b31] tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-[#64748d]">
            Enter your email to receive recovery instructions for your FLOODGUARD account.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-[#e5edf5] rounded-sm p-6 sm:p-8 shadow-xs space-y-5">
          {error && (
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-sm text-xs text-[#dc2626] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-sm text-xs text-[#059669] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Password reset link sent</strong>
                  Check your inbox for <strong>{email}</strong> for instructions to reset your password.
                </div>
              </div>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Return to Sign In</span>
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#061b31] mb-1.5">
                  Account Email
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="md"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Send Reset Link</span>
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#533afd] hover:text-[#7389ff] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

