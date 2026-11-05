import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Map as MapIcon,
  Navigation,
  Cpu,
  Play,
  Send,
  Truck,
  UserCheck,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';
import { cn } from '../ui/tokens';
import { NeerpathLogo } from '../ui';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Mangaluru GIS Map', to: '/map', icon: MapIcon },
        { name: 'Flood Routes', to: '/routes', icon: Navigation },
        { name: 'AI Intelligence', to: '/ai-intelligence', icon: Cpu },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Live Demo', to: '/live-demo', icon: Play },
        { name: 'Citizen Reports', to: '/citizen-reports', icon: Send },
        { name: 'Responder Console', to: '/responder', icon: Truck, responderOnly: true },
        { name: 'Admin Portal', to: '/admin', icon: UserCheck, adminOnly: true },
      ],
    },
    {
      group: 'PREFERENCES',
      items: [
        { name: 'Notifications', to: '/notifications', icon: Bell },
        { name: 'Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

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
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-[4px] bg-[#e8e9ff] text-[#533afd]">
                  Mangaluru
                </span>
              </div>
              <span className="text-[10px] text-[#64748d] truncate">
                AI Road Intelligence
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
        {navGroups.map((group) => {
          const filteredItems = group.items.filter((item) => {
            if (item.adminOnly && user?.role !== 'administrator') return false;
            if (item.responderOnly && user?.role !== 'responder' && user?.role !== 'administrator') return false;
            return true;
          });

          if (filteredItems.length === 0) return null;

          return (
            <div key={group.group} className="space-y-1">
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold text-[#64748d] uppercase tracking-wider mb-1">
                  {group.group}
                </div>
              )}
              {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={true}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-[4px] text-xs font-medium transition-colors group relative",
                        isActive
                          ? "bg-[#e8e9ff] text-[#533afd] font-semibold"
                          : "text-[#50617a] hover:text-[#061b31] hover:bg-[#f8fafd]",
                        collapsed && "justify-center px-2"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#533afd] rounded-r" />
                        )}
                        <Icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-[#533afd]" : "text-[#64748d] group-hover:text-[#061b31]"
                        )} />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom User Profile Section */}
      <div className={cn(
        "p-3 border-t border-[#e5edf5] bg-white transition-all",
        collapsed ? "px-2" : "px-4"
      )}>
        {user ? (
          <div className={cn("flex items-center justify-between gap-2", collapsed && "flex-col justify-center")}>
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-[4px] bg-[#f8fafd] border border-[#e5edf5] text-[#533afd] flex items-center justify-center font-bold text-xs shrink-0">
                {user.full_name ? user.full_name[0] : 'U'}
              </div>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-[#061b31] truncate leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-[#64748d] uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className={cn(
                "p-1.5 rounded-[4px] text-[#64748d] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-colors border border-transparent hover:border-[#fecaca] cursor-pointer",
                collapsed && "mt-1 w-full flex justify-center"
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-[4px] bg-[#533afd] hover:bg-[#7389ff] text-white text-xs font-medium transition-colors shadow-xs",
              collapsed && "px-2"
            )}
          >
            <User className="w-3.5 h-3.5" />
            {!collapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:block shrink-0 sticky top-0 h-screen transition-all duration-200 z-30",
          collapsed ? "w-16" : "w-[250px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#061b31]/40 backdrop-blur-xs z-50 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-[270px] bg-white z-50 md:hidden shadow-xl transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-4 right-4 z-10 md:hidden">
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-[4px] text-[#64748d] hover:text-[#061b31] hover:bg-[#f8fafd]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
};

export const TopContentBar = ({
  onOpenMobile,
}: {
  onOpenMobile: () => void;
}) => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageInfo = (path: string) => {
    if (path.startsWith('/dashboard')) return { title: 'Operational Dashboard', breadcrumb: 'Dashboard' };
    if (path.startsWith('/map')) return { title: 'Mangaluru GIS Spatial Grid', breadcrumb: 'GIS Map' };
    if (path.startsWith('/routing')) return { title: 'Flood-Aware Alternative Routing', breadcrumb: 'Routes' };
    if (path.startsWith('/ai-engine')) return { title: 'AI Flood Intelligence & Explanations', breadcrumb: 'AI Engine' };
    if (path.startsWith('/demo')) return { title: 'Monsoon Scenario Live Demonstration', breadcrumb: 'Live Demo' };
    if (path.startsWith('/report')) return { title: 'Citizen Incident Reporting Desk', breadcrumb: 'Reporting' };
    if (path.startsWith('/responder')) return { title: 'Tactical Responder Dispatch Console', breadcrumb: 'Responder' };
    if (path.startsWith('/admin')) return { title: 'Disaster Cell Verification Portal', breadcrumb: 'Admin Portal' };
    if (path.startsWith('/incidents')) return { title: 'Incident Investigation Dossier', breadcrumb: 'Incidents' };
    if (path.startsWith('/settings')) return { title: 'Settings & Push Alerts', breadcrumb: 'Settings' };
    if (path.startsWith('/login')) return { title: 'Security Authentication', breadcrumb: 'Sign In' };
    return { title: 'Mangaluru Road Intelligence', breadcrumb: 'Overview' };
  };

  const pageInfo = getPageInfo(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-[#e5edf5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="md:hidden p-1.5 rounded-[4px] text-[#64748d] hover:text-[#061b31] hover:bg-[#f8fafd] border border-[#e5edf5]"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748d]">
            <Link to="/" className="hover:text-[#533afd] transition-colors">FLOODGUARD</Link>
            <span>/</span>
            <span className="text-[#061b31] font-medium">{pageInfo.breadcrumb}</span>
          </div>
          <h1 className="text-sm font-semibold text-[#061b31] tracking-tight hidden sm:block">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Indicator Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#ecfdf5] border border-[#a7f3d0] text-[11px] text-[#059669]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          <span className="font-medium">Mangaluru Monsoon Grid Online</span>
        </div>

        {/* Notifications Shortcut */}
        <Link
          to="/settings#notifications"
          className="p-2 rounded-[4px] text-[#64748d] hover:text-[#061b31] hover:bg-[#f8fafd] border border-transparent hover:border-[#e5edf5] transition-colors relative"
          title="Push Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#533afd]" />
        </Link>

        {/* User badge */}
        {user && (
          <Link
            to="/settings"
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-[4px] hover:bg-[#f8fafd] border border-transparent hover:border-[#e5edf5] transition-colors"
          >
            <div className="w-6 h-6 rounded-[4px] bg-[#e8e9ff] text-[#533afd] text-[11px] font-bold flex items-center justify-center">
              {user.full_name ? user.full_name[0] : 'U'}
            </div>
            <span className="text-xs font-medium text-[#061b31] hidden sm:inline">
              {user.full_name.split(' ')[0]}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
};
