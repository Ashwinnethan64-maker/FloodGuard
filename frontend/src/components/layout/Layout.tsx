import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar, TopContentBar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ArrowRight, ShieldCheck, Menu } from 'lucide-react';
import { NeerpathLogo } from '../ui';

export const Layout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [landingMobileMenuOpen, setLandingMobileMenuOpen] = useState(false);

  // Minimal header for public landing page
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[#f8fafd] text-[#061b31] flex flex-col font-sans">
        {/* Landing Top Minimal Navbar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e5edf5] px-4 sm:px-8 py-3.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <NeerpathLogo size="md" className="group-hover:scale-105 shrink-0" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm tracking-tight text-[#061b31]">
                    FLOODGUARD
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-sm bg-[#e8e9ff] text-[#533afd]">
                    Mangaluru
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-[#64748d] leading-none hidden xs:inline">
                  Know the road. Navigate the risk.
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#50617a]">
              <a href="#problem" className="hover:text-[#533afd] transition-colors">Monsoon Challenge</a>
              <a href="#how-it-works" className="hover:text-[#533afd] transition-colors">Architecture</a>
              <a href="#gis-preview" className="hover:text-[#533afd] transition-colors">GIS Intelligence</a>
              <a href="#ai-engine" className="hover:text-[#533afd] transition-colors">AI Modeling</a>
              <a href="#routing" className="hover:text-[#533afd] transition-colors">Alternative Routes</a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-xs font-medium text-[#50617a] hover:text-[#061b31] px-2.5 py-1.5 rounded-sm transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#533afd] hover:bg-[#7389ff] text-white text-xs font-medium transition-colors shadow-xs"
              >
                <span>Live Grid</span>
                <ArrowRight className="w-3.5 h-3.5 hidden xs:inline" />
              </Link>
              <button
                onClick={() => setLandingMobileMenuOpen(!landingMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-sm text-[#64748d] hover:bg-[#f1f5f9] border border-[#e5edf5]"
                aria-label="Toggle mobile navigation menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Landing Page Mobile Navigation Drawer */}
          {landingMobileMenuOpen && (
            <div className="md:hidden pt-3 pb-2 border-t border-[#e5edf5] mt-3 space-y-2">
              <a
                href="#problem"
                onClick={() => setLandingMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-sm text-xs font-medium text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd]"
              >
                Monsoon Challenge
              </a>
              <a
                href="#how-it-works"
                onClick={() => setLandingMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-sm text-xs font-medium text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd]"
              >
                Architecture & Data Flow
              </a>
              <a
                href="#gis-preview"
                onClick={() => setLandingMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-sm text-xs font-medium text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd]"
              >
                GIS Spatial Intelligence
              </a>
              <a
                href="#ai-engine"
                onClick={() => setLandingMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-sm text-xs font-medium text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd]"
              >
                AI Modeling & Explainability
              </a>
              <a
                href="#routing"
                onClick={() => setLandingMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-sm text-xs font-medium text-[#50617a] hover:bg-[#e8e9ff] hover:text-[#533afd]"
              >
                Alternative Routes
              </a>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {/* Landing Page Footer */}
        <footer className="bg-white border-t border-[#e5edf5] py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <NeerpathLogo size="sm" />
                <span className="font-bold text-sm tracking-tight text-[#061b31]">FLOODGUARD</span>
              </div>
              <p className="text-xs text-[#64748d] leading-relaxed">
                AI-powered road-level flood intelligence and emergency route management for Mangaluru.
              </p>
              <div className="text-[11px] text-[#50617a]">
                Mangaluru Smart Monsoon Initiative
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider mb-3">Intelligence</h4>
              <ul className="space-y-2 text-xs text-[#64748d]">
                <li><Link to="/map" className="hover:text-[#533afd] transition-colors">Interactive GIS Map</Link></li>
                <li><Link to="/routes" className="hover:text-[#533afd] transition-colors">Flood-Aware Routing</Link></li>
                <li><Link to="/ai-intelligence" className="hover:text-[#533afd] transition-colors">FLOODGUARD AI Explanations</Link></li>
                <li><Link to="/live-demo" className="hover:text-[#533afd] transition-colors">Interactive Simulation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider mb-3">Operations</h4>
              <ul className="space-y-2 text-xs text-[#64748d]">
                <li><Link to="/citizen-reports" className="hover:text-[#533afd] transition-colors">Citizen Incident Reporting</Link></li>
                <li><Link to="/responder" className="hover:text-[#533afd] transition-colors">Responder Dispatch Console</Link></li>
                <li><Link to="/admin" className="hover:text-[#533afd] transition-colors">Disaster Cell Portal</Link></li>
                <li><Link to="/settings" className="hover:text-[#533afd] transition-colors">Alert Preferences</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider mb-3">Verification & Trust</h4>
              <p className="text-xs text-[#64748d] leading-relaxed mb-3">
                Strict separation between automated meteorological data, machine learning risk estimations, and human verified roadblock clearances.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#059669]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Hallucinated Road States</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#e5edf5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748d]">
            <span>© 2026 FLOODGUARD. Mangaluru Urban Road Flood Intelligence.</span>
            <div className="flex items-center gap-4">
              <span>Smart Disaster Resilience</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Full authenticated application with left sidebar and responsive bottom navigation
  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#061b31] flex flex-row font-sans overflow-x-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopContentBar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 flex flex-col p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Touch-Friendly Bottom Navigation for Mobile Devices */}
      <BottomNav />
    </div>
  );
};
