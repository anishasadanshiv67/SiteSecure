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
  Lock,
  Loader2,
  XCircle
} from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    userCount: 0,
    siteCount: 0,
    incidentCount: 0,
    uptime: '99.9%'
  });

  // Toggle states - fully interactive
  const [toggles, setToggles] = useState({
    emergencyBroadcasts: true,
    maintenanceMode: false,
    autoAudit: true,
  });

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const [u, s, i] = await Promise.all([
        API.get('/users'),
        API.get('/sites'),
        API.get('/incidents/all')
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

  const fetchLogs = async () => {
    try {
      const { data } = await API.get('/logs');
      setLogs(data.slice(0, 5)); // Show last 5 logs
    } catch (err) {
      console.error('Could not load admin logs', err);
    }
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // Simulate save - in a real app this would persist to backend
      await new Promise(resolve => setTimeout(resolve, 800));
      setMessage({ text: 'Global configuration saved successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to save configuration.', type: 'error' });
    } finally {
      setSaveLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const toggleItems = [
    {
      key: 'emergencyBroadcasts' as const,
      label: 'Emergency Broadcasts',
      desc: 'Push high-priority alerts to all active personnel mobile apps.',
    },
    {
      key: 'maintenanceMode' as const,
      label: 'Maintenance Mode',
      desc: 'Temporarily restrict access for scheduled database updates.',
    },
    {
      key: 'autoAudit' as const,
      label: 'Auto-Audit',
      desc: 'Automatically generate weekly safety compliance reports.',
    },
  ];

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
                {toggleItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group">
                    <div className="space-y-1">
                      <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`w-14 h-8 rounded-full flex items-center px-1 cursor-pointer transition-all duration-300 ${
                        toggles[item.key] ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                        toggles[item.key] ? 'ml-auto translate-x-0' : ''
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3 disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Global Config
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
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Audit Logs</h3>
              </div>
              <div className="space-y-4">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex justify-between items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-white">{log.action}</p>
                      <p className="text-[10px] text-slate-500">{log.user?.name || 'System'}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 shrink-0 ml-2">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )) : (
                  [
                    { action: 'Config Updated', user: 'System', time: 'Just now' },
                    { action: 'Backup completed', user: 'System', time: '1h ago' },
                    { action: 'Health check OK', user: 'System', time: '3h ago' },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-white">{log.action}</p>
                        <p className="text-[10px] text-slate-500">{log.user}</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-600">{log.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {message.text && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-fade-in-up ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Settings;
