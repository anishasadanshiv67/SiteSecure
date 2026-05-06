import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  Shield,
  ChevronRight,
  Settings,
  History as HistoryIcon,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active }) => (
  <Link
    to={path}
    className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 ${active
        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white border border-white/10 shadow-lg shadow-blue-500/10'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 transition-colors duration-300 ${active ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
      <span className="font-medium tracking-wide">{label}</span>
    </div>
    {active && <ChevronRight className="w-4 h-4 text-blue-400" />}
  </Link>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth(); // Use reactive user from context

  const getMenuItems = () => {
    if (!user || !user.role) return [];
    
    if (user.role === 'flagger') {
      return [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/flagger' },
        { icon: AlertTriangle, label: 'Report Incident', path: '/dashboard/flagger/report' },
        { icon: ClipboardList, label: 'My Reports', path: '/dashboard/flagger/my-reports' },
      ];
    } else if (user.role === 'online_verifier' || user.role === 'ground_verifier') {
      return [
        { icon: LayoutDashboard, label: 'Verification', path: '/dashboard/verification' },
        { icon: Shield, label: 'Security Log', path: '/dashboard/security' },
      ];
    } else if (user.role === 'resolver') {
      return [
        { icon: LayoutDashboard, label: 'Resolution', path: '/dashboard/resolution' },
        { icon: HistoryIcon, label: 'Audit Log', path: '/dashboard/security' },
      ];
    } else if (user.role === 'site_admin' || user.role === 'super_admin') {
      const items = [
        { icon: LayoutDashboard, label: 'Control Panel', path: '/dashboard/admin' },
        { icon: Settings, label: 'System Config', path: '/dashboard/admin' },
      ];

      if (user.role === 'super_admin') {
        items.push({ icon: Users, label: 'User Management', path: '/dashboard/users' });
      }

      return items;
    } else if (user.role === 'compliance_officer') {
      return [
        { icon: LayoutDashboard, label: 'Compliance', path: '/dashboard/compliance' },
        { icon: Shield, label: 'Safety Audit', path: '/dashboard/security' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="p-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight text-white">
          SiteSecure<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">.</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 px-4">
          Main Menu
        </div>
        {menuItems.map((item) => (
          <SidebarItem
            key={`${item.path}-${item.label}`}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={location.pathname === item.path}
          />
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
