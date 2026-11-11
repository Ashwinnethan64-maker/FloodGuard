import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Map as MapIcon,
  Navigation,
  Send,
  Bell,
  Truck,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../ui/tokens';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role || 'resident';

  // Role-customized high frequency bottom actions (4 to 5 icons maximum for thumb reach)
  const navItems = (() => {
    if (userRole === 'administrator') {
      return [
        { label: 'Admin', to: '/admin', icon: LayoutDashboard },
        { label: 'Map', to: '/map', icon: MapIcon },
        { label: 'Routes', to: '/routes', icon: Navigation },
        { label: 'Report', to: '/citizen-reports', icon: Send },
        { label: 'Alerts', to: '/notifications', icon: Bell },
      ];
    }
    if (userRole === 'responder') {
      return [
        { label: 'Dispatch', to: '/responder', icon: Truck },
        { label: 'Map', to: '/map', icon: MapIcon },
        { label: 'Routes', to: '/routes', icon: Navigation },
        { label: 'Report', to: '/citizen-reports', icon: Send },
        { label: 'Alerts', to: '/notifications', icon: Bell },
      ];
    }
    // Resident / Citizen default
    return [
      { label: 'Grid', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Map', to: '/map', icon: MapIcon },
      { label: 'Routes', to: '/routes', icon: Navigation },
      { label: 'Report', to: '/citizen-reports', icon: ShieldAlert },
      { label: 'Alerts', to: '/notifications', icon: Bell },
    ];
  })();

  const currentPath = location.pathname;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e5edf5] px-2 py-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-2 rounded-sm min-w-[56px] transition-colors relative touch-manipulation',
                isActive
                  ? 'text-[#533afd]'
                  : 'text-[#64748d] hover:text-[#061b31] active:bg-[#f1f5f9]'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#533afd] rounded-full" />
                )}
              </div>
              <span className={cn('text-[10px] mt-0.5 tracking-tight font-medium', isActive && 'font-semibold text-[#533afd]')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

