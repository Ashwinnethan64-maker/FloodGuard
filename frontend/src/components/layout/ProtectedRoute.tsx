import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { Activity, ShieldAlert } from 'lucide-react';
import { Button } from '../ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-[#64748d]">
        <Activity className="w-6 h-6 animate-spin text-[#533afd]" />
        <span className="text-xs font-medium">Verifying database permissions & cryptographic token...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account status verification (Suspended accounts cannot access any protected view)
  if (user.account_status === 'suspended') {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#fecaca] rounded-md p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#dc2626] mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#061b31]">
              Account Suspended
            </h2>
            <p className="text-xs text-[#64748d] mt-2 leading-relaxed">
              Your account has been restricted by a disaster cell administrator. If you believe this is an error, contact administrative support.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => {
                localStorage.removeItem('neerpath_user');
                window.location.href = '/login';
              }}
              className="w-full justify-center"
            >
              Sign In with Another Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role authorization check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If citizen tries to access admin or responder, redirect to their home
    if (user.role === 'resident') {
      return <Navigate to="/dashboard" replace />;
    }
    // If responder tries to access admin, redirect to responder dashboard
    if (user.role === 'responder') {
      return <Navigate to="/responder" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
