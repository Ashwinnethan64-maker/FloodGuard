import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Radio,
  Map as MapIcon,
  LayoutDashboard,
  Send,
  UserCheck,
  Settings,
  LogOut,
  LogIn,
  Menu,
  X,
  Cpu,
  Navigation,
  Truck,
  Play
} from 'lucide-react';
import { useState } from 'react';

export const Layout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Mangaluru GIS Map', to: '/map', icon: MapIcon },
    { name: 'Flood Routes', to: '/routing', icon: Navigation },
    { name: 'AI Intelligence', to: '/ai-engine', icon: Cpu },
    { name: 'Live Demo', to: '/demo', icon: Play },
    { name: 'Citizen Report', to: '/report', icon: Send },
    { name: 'Responder Console', to: '/responder', icon: Truck, responderOnly: true },
    { name: 'Admin Portal', to: '/admin', icon: UserCheck, adminOnly: true },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] px-4 py-1 text-center text-slate-400 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <span>
          <strong className="text-cyan-300">DEMO ENVIRONMENT:</strong> Mangaluru Monsoon Flood Intelligence Grid Active. Commuter routes are advisory.
        </span>
      </div>

      {/* Main Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                  NEERPATH
                </span>
                <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Mangaluru
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
                Know the road. Navigate the risk.
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'administrator') return null;
              if (item.responderOnly && user?.role !== 'responder' && user?.role !== 'administrator') return null;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile / Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/settings"
                  className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs font-semibold text-slate-200 leading-none">
                    {user?.full_name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mt-1">
                    {user?.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/60"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-slate-800 mt-3 flex flex-col gap-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'administrator') return null;
              if (item.responderOnly && user?.role !== 'responder' && user?.role !== 'administrator') return null;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            NEERPATH – AI-Powered Road Intelligence | Mangaluru, Karnataka
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Horizon Hacks</span>
            <span>•</span>
            <span className="text-cyan-400">Team Leader: Ashwin Nethan</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
