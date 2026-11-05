import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button, NeerpathLogo } from '../components/ui';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const handleOAuthCallback = async () => {
      try {
        // 1. Check if the URL has error queries (e.g. ?error=access_denied&error_description=...)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDesc = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          if (mounted) {
            setErrorMsg(errorDesc || error || 'Authentication was cancelled or failed.');
            setProcessing(false);
          }
          return;
        }

        // 2. If an authorization code is present in query parameters (PKCE flow), exchange it
        const code = urlParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[NEERPATH Auth] Code exchange error:', exchangeError);
            if (mounted) {
              setErrorMsg(exchangeError.message);
              setProcessing(false);
            }
            return;
          }
        }

        // 3. Confirm active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (mounted) {
            setErrorMsg(sessionError.message);
            setProcessing(false);
          }
          return;
        }

        if (session && session.user) {
          // Success: clean redirect to dashboard
          if (mounted) {
            setProcessing(false);
            navigate('/dashboard', { replace: true });
          }
        } else {
          // If no session found immediately, wait briefly for Supabase event or fallback to login
          setTimeout(async () => {
            const { data: retry } = await supabase.auth.getSession();
            if (retry.session && mounted) {
              navigate('/dashboard', { replace: true });
            } else if (mounted) {
              navigate('/login', { replace: true });
            }
          }, 800);
        }
      } catch (err: any) {
        console.error('[NEERPATH Auth] Callback processing exception:', err);
        if (mounted) {
          setErrorMsg(err?.message || 'Unexpected error completing OAuth sign in.');
          setProcessing(false);
        }
      }
    };

    handleOAuthCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#fecaca] rounded-[4px] p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#dc2626] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[#061b31]">
            Authentication Verification Error
          </h2>
          <p className="text-xs text-[#64748d] leading-relaxed">
            {errorMsg}
          </p>
          <div className="pt-2">
            <Button onClick={() => navigate('/login')} className="w-full justify-center">
              Return to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white border border-[#e5edf5] rounded-[4px] p-8 text-center space-y-4 shadow-xs">
        <div className="flex justify-center">
          <NeerpathLogo size="lg" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#061b31]">
            Connecting NEERPATH Account
          </h3>
          <p className="text-xs text-[#64748d] mt-1">
            Verifying Supabase authentication credentials & establishing secure session...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2 text-[#533afd] text-xs">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-medium">{processing ? 'Finalizing security tokens...' : 'Redirecting...'}</span>
        </div>
      </div>
    </div>
  );
};

