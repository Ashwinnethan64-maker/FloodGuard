import { Outlet, Link } from 'react-router-dom';
import { NeerpathLogo } from '../ui';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#061b31] flex flex-col font-sans">
      {/* Standalone Minimal Auth Header */}
      <header className="border-b border-[#e5edf5] bg-white/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <NeerpathLogo size="md" className="group-hover:scale-105" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#061b31]">
                  FLOODGUARD
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-sm bg-[#e8e9ff] text-[#533afd]">
                  Mangaluru
                </span>
              </div>
              <span className="text-[10px] text-[#64748d] leading-none">
                Know the road. Navigate the risk.
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="text-xs font-medium text-[#50617a] hover:text-[#533afd] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Auth Content Area (Centered Card without Dashboard Sidebar) */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Clean Auth Footer */}
      <footer className="border-t border-[#e5edf5] bg-white py-4 px-6 text-center text-xs text-[#64748d]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 FLOODGUARD. Mangaluru Urban Road Flood Intelligence.</span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#059669]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Authentication & Session Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

