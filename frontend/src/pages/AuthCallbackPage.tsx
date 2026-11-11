import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { userApiClient } from '../services/api';
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
            console.error('[FLOODGUARD Auth] Code exchange error:', exchangeError);
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
          const authUser = session.user;
          let role = 'resident';
          let status = 'active';

          // Query verified role from trusted database
          try {
            const serverProfile = await userApiClient.getMyProfile(authUser.id);
            if (serverProfile) {
              role = serverProfile.role || 'resident';
              status = serverProfile.account_status || 'active';
            }
          } catch (e) {
            const appMeta = authUser.app_metadata || {};
            role = appMeta.role || 'resident';
            status = appMeta.account_status || 'active';
          }

          if (status === 'suspended') {
            await supabase.auth.signOut();
            if (mounted) {
              setErrorMsg('Your account has been suspended by an administrator. Access denied.');
              setProcessing(false);
            }
            return;
          }

          // Automatic role-based redirection
          let targetPath = '/dashboard';
          if (role === 'administrator') {
            targetPath = '/admin';
          } else if (role === 'responder') {
            targetPath = '/responder';
          } else {
            targetPath = '/dashboard';
          }

          if (mounted) {
            setProcessing(false);
            navigate(targetPath, { replace: true });
          }
        } else {
          // Fallback retry
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
        console.error('[FLOODGUARD Auth] Callback processing exception:', err);
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
        <div className="max-w-md w-full bg-white border border-[#fecaca] rounded-sm p-6 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#dc2626] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[#061b31]">
            Authentication Verification Notice
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
      <div className="max-w-sm w-full bg-white border border-[#e5edf5] rounded-sm p-8 text-center space-y-4 shadow-xs">
        <div className="flex justify-center">
          <NeerpathLogo size="lg" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#061b31]">
            Authenticating Google Account
          </h3>
          <p className="text-xs text-[#64748d] mt-1">
            Verifying cryptographic token & loading database role permissions...
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2 text-[#533afd] text-xs">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-medium">{processing ? 'Determining role-based route...' : 'Redirecting to command center...'}</span>
        </div>
      </div>
    </div>
  );
};
