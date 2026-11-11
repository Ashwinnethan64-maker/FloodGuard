import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Map as MapIcon,
  Navigation,
  Cpu,
  Play,
  Send,
  Truck,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  ShieldAlert,
  ClipboardList,
  FileCheck2,
  HelpCircle,
  FolderCheck,
  Menu
} from 'lucide-react';
import { cn } from '../ui/tokens';
import { NeerpathLogo } from '../ui';

export const TopContentBar = ({ onOpenMobile }: { onOpenMobile: () => void }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'resident';

  const roleBadge = {
    administrator: { label: 'Admin', color: 'bg-[#533afd] text-white' },
    responder: { label: 'Responder', color: 'bg-[#d97706] text-white' },
    resident: { label: 'Citizen', color: 'bg-[#059669] text-white' }
  }[userRole];

  return (
    <div className="h-14 bg-white border-b border-[#e5edf5] px-3 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation sidebar"
          className="p-2 rounded-sm hover:bg-[#f8fafd] text-[#64748d] hover:text-[#061b31] border border-[#e5edf5] md:hidden touch-manipulation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-[#061b31] truncate max-w-[150px] xs:max-w-none">
            FLOODGUARD <span className="hidden xs:inline">Mangaluru</span>
          </span>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0", roleBadge.color)}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#50617a] bg-[#f8fafd] border border-[#e5edf5] px-2 sm:px-2.5 py-1 rounded-sm max-w-40 sm:max-w-60 truncate">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse shrink-0"></span>
          <span className="font-mono text-[11px] truncate">{user?.email || 'Public'}</span>
        </div>
      </div>
    </div>
  );
};

export const Sidebar = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userRole = user?.role || 'resident';

  // Role-specific navigation hierarchies
  const adminNavGroups = [
    {
      group: 'COMMAND CENTER',
      items: [
        { name: 'Command Overview', to: '/admin', icon: LayoutDashboard },
        { name: 'Mangaluru GIS Map', to: '/map', icon: MapIcon },
      ],
    },
    {
      group: 'INCIDENTS & CORRIDORS',
      items: [
        { name: 'Incident Review', to: '/admin#incidents', icon: ClipboardList },
        { name: 'Road Management', to: '/admin#roads', icon: Navigation },
        { name: 'Citizen Reports', to: '/citizen-reports', icon: Send },
        { name: 'AI Intelligence', to: '/ai-intelligence', icon: Cpu },
      ],
    },
    {
      group: 'TACTICAL DISPATCH',
      items: [
        { name: 'Responder Management', to: '/admin#responders', icon: Truck },
        { name: 'Emergency Alerts', to: '/notifications', icon: ShieldAlert },
        { name: 'Simulation Console', to: '/live-demo', icon: Play },
      ],
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { name: 'User Management', to: '/admin#users', icon: Users },
        { name: 'Platform Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  const responderNavGroups = [
    {
      group: 'TACTICAL FIELD DESK',
      items: [
        { name: 'Field Overview', to: '/responder', icon: LayoutDashboard },
        { name: 'Assigned Incidents', to: '/responder#assigned', icon: ClipboardList },
        { name: 'Operational GIS Map', to: '/map', icon: MapIcon },
      ],
    },
    {
      group: 'FIELD ACTION',
      items: [
        { name: 'Field Verification', to: '/responder#verification', icon: FileCheck2 },
        { name: 'Road Condition Updates', to: '/responder#roads', icon: Navigation },
        { name: 'Emergency Broadcasts', to: '/notifications', icon: Bell },
        { name: 'Completed Tasks', to: '/responder#completed', icon: FolderCheck },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'Preferences & Audio', to: '/settings', icon: Settings },
      ],
    },
  ];

  const citizenNavGroups = [
    {
      group: 'PUBLIC MONITORING',
      items: [
        { name: 'City Overview', to: '/dashboard', icon: LayoutDashboard },
        { name: 'Mangaluru GIS Map', to: '/map', icon: MapIcon },
        { name: 'Flood-Aware Routes', to: '/routes', icon: Navigation },
      ],
    },
    {
      group: 'CITIZEN REPORTING',
      items: [
        { name: 'Report Flooding', to: '/citizen-reports', icon: Send },
        { name: 'Emergency Assistance', to: '/dashboard#emergency', icon: HelpCircle },
        { name: 'Monsoon Alerts', to: '/notifications', icon: Bell },
      ],
    },
    {
      group: 'PREFERENCES',
      items: [
        { name: 'Preferences', to: '/settings', icon: Settings },
      ],
    },
  ];

  const navGroups = userRole === 'administrator' 
    ? adminNavGroups 
    : userRole === 'responder' 
      ? responderNavGroups 
      : citizenNavGroups;

  const roleBadge = {
    administrator: { label: 'Admin', color: 'bg-[#533afd] text-white' },
    responder: { label: 'Responder', color: 'bg-[#d97706] text-white' },
    resident: { label: 'Citizen', color: 'bg-[#059669] text-white' }
  }[userRole];

  /**
   * Deterministic active-route evaluator:
   * Guarantees EXACTLY ONE item is active by comparing both path and hash.
   */
  const currentPath = location.pathname;
  const currentHash = location.hash; // e.g. '#incidents' or empty ''

  const isItemActive = (to: string): boolean => {
    const [targetPath, targetHash] = to.split('#');
    const normalizedTargetHash = targetHash ? `#${targetHash}` : '';

    // If target has a specific hash (e.g. /admin#incidents)
    if (normalizedTargetHash) {
      return currentPath === targetPath && currentHash === normalizedTargetHash;
    }

    // If target has NO hash (e.g. /admin, /responder, /dashboard)
    // Only active if the current URL has NO hash on that path
    if (currentHash && currentHash !== '') {
      return false;
    }

    return currentPath === targetPath;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#e5edf5] select-none">
      {/* Brand Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-[#e5edf5] px-4 justify-between transition-all duration-200",
        collapsed ? "px-3 justify-center" : "px-5"
      )}>
        <Link to="/" className="flex items-center gap-3 overflow-hidden group">
          <NeerpathLogo size="sm" className="group-hover:scale-105" />
          {!collapsed && (
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#061b31]">
                  FLOODGUARD
                </span>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded uppercase", roleBadge.color)}>
                  {roleBadge.label}
                </span>
              </div>
              <span className="text-[10px] text-[#64748d] truncate">
                Mangaluru Urban Corridor
              </span>
            </div>
          )}
        </Link>

        {/* Desktop collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-sm hover:bg-[#f8fafd] text-[#64748d] hover:text-[#061b31] border border-transparent hover:border-[#e5edf5] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold text-[#64748d] uppercase tracking-wider mb-1">
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-sm text-xs font-medium transition-all group relative',
                    active
                      ? 'bg-[#533afd] text-white shadow-2xs font-semibold'
                      : 'text-[#50617a] hover:bg-[#e8e9ff]/50 hover:text-[#533afd]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      active ? 'text-white' : 'text-[#64748d] group-hover:text-[#533afd]',
                      collapsed && 'mx-auto'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-[#e5edf5] bg-[#f8fafd]">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-semibold text-[#061b31] block truncate">
                  {user?.full_name || 'Public User'}
                </span>
                <span className="text-[10px] text-[#64748d] block truncate font-mono">
                  {user?.email || 'unauthenticated'}
                </span>
              </div>
              <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0", roleBadge.color)}>
                {roleBadge.label}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-sm bg-white border border-[#e5edf5] text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2] hover:border-[#fecaca] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-sm text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-200 z-30',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#061b31]/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-200 md:hidden flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
};
