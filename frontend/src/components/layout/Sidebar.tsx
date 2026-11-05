import { NavLink, Link, useNavigate } from 'react-router-dom';
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
    <div className="h-14 bg-white border-b border-[#e5edf5] px-4 sm:px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 rounded-[4px] hover:bg-[#f8fafd] text-[#64748d] hover:text-[#061b31] border border-[#e5edf5] md:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#061b31]">FLOODGUARD Mangaluru</span>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded uppercase", roleBadge.color)}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#50617a] bg-[#f8fafd] border border-[#e5edf5] px-2.5 py-1 rounded-[4px]">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
          <span className="font-mono text-[11px]">{user?.email || 'Public'}</span>
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
          className="hidden md:flex p-1.5 rounded-[4px] hover:bg-[#f8fafd] text-[#64748d] hover:text-[#061b31] border border-transparent hover:border-[#e5edf5] transition-colors"
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
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.includes('#') ? false : true}
                  onClick={onCloseMobile}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[4px] text-xs font-medium transition-all group relative',
                      isActive
                        ? 'bg-[#533afd] text-white shadow-2xs font-semibold'
                        : 'text-[#50617a] hover:bg-[#f8fafd] hover:text-[#061b31]'
                    )
                  }
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      collapsed && 'mx-auto'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
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
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-[4px] bg-white border border-[#e5edf5] text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2] hover:border-[#fecaca] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-[4px] text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
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
          className="fixed inset-0 bg-[#061b31]/40 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
};
