import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import { Radio, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@neerpath.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('administrator');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col gap-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 mx-auto flex items-center justify-center shadow-lg shadow-cyan-900/40 mb-3">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">NEERPATH Authentication</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access Mangaluru Road Flood Intelligence Platform
          </p>
        </div>

        {/* Role Fast Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Select Access Role:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'administrator', label: 'Admin', desc: 'Disaster Cell' },
              { id: 'responder', label: 'Responder', desc: 'Traffic Patrol' },
              { id: 'resident', label: 'Resident', desc: 'Commuter' },
            ].map(r => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  setRole(r.id as UserRole);
                  if (r.id === 'administrator') setEmail('admin@neerpath.in');
                  else if (r.id === 'responder') setEmail('patrol.kadri@neerpath.in');
                  else setEmail('citizen.kavoor@gmail.com');
                }}
                className={`p-2 rounded-xl border text-center transition-all ${
                  role === r.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold block">{r.label}</span>
                <span className="text-[9px] text-slate-500 mt-0.5 block">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 mt-2"
          >
            <span>Authenticate Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 text-center">
          Demo accounts pre-configured with Supabase auth compatible profiles.
        </div>
      </div>
    </div>
  );
};
