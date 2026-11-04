import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  ArrowRight, 
  CloudRain, 
  Radio
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-6 shadow-lg shadow-cyan-950/40">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Mangaluru Smart Monsoon Initiative — Horizon Hacks</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Know the road. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Navigate the risk.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            AI-powered, GIS-based road-level flood intelligence and emergency route management platform specifically designed for Mangaluru's heavy monsoon realities.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-900/40"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/map"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              <MapIcon className="w-4 h-4 text-cyan-400" />
              <span>Interactive GIS Map</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
            <div className="text-center p-2">
              <span className="text-xl sm:text-2xl font-bold text-white block">100%</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">PostGIS Corridors</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xl sm:text-2xl font-bold text-cyan-400 block">7 Key Zones</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Mangaluru Hotspots</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xl sm:text-2xl font-bold text-amber-400 block">Strict Triage</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Verified vs Unverified</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 block">Real-Time</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">AWS Rainfall Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-16 max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Built for Coastal Karnataka Monsoon Realities
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Why generic navigation apps fail during Mangaluru's heavy localized downpours
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <MapIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">GIS Road Inundation Tracking</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                PostGIS linestring overlays of known bottleneck corridors including Kottara Chowki underpass, Pumpwell junction, and Car Street.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-cyan-400 font-medium">
              4-Tier Status: Open, Caution, Blocked, Unverified
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Strict Safety & Provenance Rules</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Zero automated closures on unverified rumors. Citizen reports remain clearly tagged as unverified until verified by local patrol units.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-amber-400 font-medium">
              Source Attributed & Audit Logged
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <CloudRain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Open-Meteo Weather Synchronization</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Live precipitation rates (mm/hr), 24h accumulation, and WMO monsoon alert levels calibrated directly for Mangaluru coordinates.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-blue-400 font-medium">
              Real-time Coastal DK District Grid
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
