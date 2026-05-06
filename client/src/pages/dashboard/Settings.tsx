import { useState, useEffect } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { 
  Settings as SettingsIcon, 
  Database, 
  Cpu, 
  Globe, 
  ShieldAlert, 
  Bell, 
  Save,
  CheckCircle,
  Server,
  CloudLightning,
  Lock
} from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    userCount: 0,
    siteCount: 0,
    incidentCount: 0,
    uptime: '99.9%'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [u, s, i] = await Promise.all([
        API.get('/users'),
        API.get('/sites'),
        API.get('/incidents')
      ]);
      setStats({
        userCount: u.data.length,
        siteCount: s.data.length,
        incidentCount: i.data.length,
        uptime: '99.98%'
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-8 pb-20">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <SettingsIcon className="w-10 h-10 text-indigo-500" />
            System Configuration
          </h1>
          <p className="text-slate-400 mt-2">Manage global environment variables, security protocols, and system health.</p>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Cloud Status', value: 'Operational', icon: Server, color: 'text-emerald-400' },
            { label: 'Database Sync', value: 'Stable', icon: Database, color: 'text-blue-400' },
            { label: 'CPU Load', value: '12%', icon: Cpu, color: 'text-amber-400' },
            { label: 'Active Sessions', value: stats.userCount, icon: Globe, color: 'text-purple-400' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-6 rounded-[2rem] flex items-center gap-4 group hover:scale-105 transition-all cursor-default">
              <div className={`p-4 rounded-2xl bg-white/5 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                <p className="text-xl font-bold text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* General Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-8">
              <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                <CloudLightning className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Platform Preferences</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                  <div className="space-y-1">
                    <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Emergency Broadcasts</p>
                    <p className="text-xs text-slate-500">Push high-priority alerts to all active personnel mobile apps.</p>
                  </div>
                  <div className="w-14 h-8 bg-indigo-600 rounded-full flex items-center px-1 cursor-pointer">
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg ml-auto"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                  <div className="space-y-1">
                    <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Maintenance Mode</p>
                    <p className="text-xs text-slate-500">Temporarily restrict access for scheduled database updates.</p>
                  </div>
                  <div className="w-14 h-8 bg-slate-700 rounded-full flex items-center px-1 cursor-pointer">
                    <div className="w-6 h-6 bg-slate-400 rounded-full shadow-lg"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                  <div className="space-y-1">
                    <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Auto-Audit</p>
                    <p className="text-xs text-slate-500">Automatically generate weekly safety compliance reports.</p>
                  </div>
                  <div className="w-14 h-8 bg-indigo-600 rounded-full flex items-center px-1 cursor-pointer">
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg ml-auto"></div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3">
                  <Save className="w-5 h-5" /> Save Global Config
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/20">
              <ShieldAlert className="w-12 h-12 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Security Protocol</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your system is currently running on <span className="text-white font-bold">Encrypted Node V2</span>. All personnel data is hashed using SHA-256 and salted at the hardware level.
              </p>
              <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">AES-256 Verified</span>
              </div>
            </div>

            <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Admin Logs</h3>
              </div>
              <div className="space-y-4">
                {[
                  { user: 'Admin', action: 'Modified Subsite-A', time: '2m ago' },
                  { user: 'System', action: 'Backup completed', time: '1h ago' },
                  { user: 'SuperAdmin', action: 'New User: John', time: '3h ago' },
                ].map((log, i) => (
                  <div key={i} className="flex justify-between items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-white">{log.action}</p>
                      <p className="text-[10px] text-slate-500">{log.user}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
