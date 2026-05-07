import { useState, useEffect } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  MapPin,
  AlertTriangle,
  Activity,
  CheckCircle,
  TrendingUp,
  Settings,
  UserPlus,
  ExternalLink,
  Loader2,
  Building2,
  ClipboardList,
  ChevronRight,
  Globe,
  Cpu,
  BarChart3,
  Eye,
  ShieldCheck,
  Lock,
  Zap,
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const SuperAdminControlPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [sitesResp, usersResp, incidentsResp] = await Promise.all([
        API.get('/sites'),
        API.get('/users'),
        API.get('/incidents/all'),
      ]);
      setSites(sitesResp.data);
      setAllUsers(usersResp.data);
      setAllIncidents(incidentsResp.data);
    } catch (err) {
      console.error('Failed to fetch system data', err);
    } finally {
      setLoading(false);
    }
  };

  // Computed metrics
  const openIncidents = allIncidents.filter(i => !['closed', 'compliance_approved'].includes(i.status));
  const closedIncidents = allIncidents.filter(i => ['closed', 'compliance_approved'].includes(i.status));
  const highSeverity = openIncidents.filter(i => i.severity === 'high');
  const complianceRate = allIncidents.length > 0
    ? Math.round((closedIncidents.length / allIncidents.length) * 100)
    : 100;

  const roleDistribution = [
    { role: 'flagger', label: 'Flaggers', color: 'indigo' },
    { role: 'ground_verifier', label: 'Ground Verifiers', color: 'amber' },
    { role: 'online_verifier', label: 'Online Verifiers', color: 'cyan' },
    { role: 'resolver', label: 'Resolvers', color: 'emerald' },
    { role: 'compliance_officer', label: 'Compliance Officers', color: 'purple' },
    { role: 'site_admin', label: 'Site Admins', color: 'orange' },
  ].map(r => ({ ...r, count: allUsers.filter(u => u.role === r.role).length }));

  const systemStats = [
    {
      label: 'Total Facilities',
      value: sites.length,
      sub: 'Across all regions',
      icon: Building2,
      color: 'indigo',
      glow: 'shadow-indigo-500/20',
    },
    {
      label: 'Active Personnel',
      value: allUsers.length,
      sub: `${roleDistribution.find(r => r.role === 'site_admin')?.count || 0} site admins`,
      icon: Users,
      color: 'violet',
      glow: 'shadow-violet-500/20',
    },
    {
      label: 'Open Hazards',
      value: openIncidents.length,
      sub: `${highSeverity.length} critical`,
      icon: AlertTriangle,
      color: highSeverity.length > 0 ? 'rose' : 'amber',
      glow: highSeverity.length > 0 ? 'shadow-rose-500/20' : 'shadow-amber-500/20',
    },
    {
      label: 'Compliance Rate',
      value: `${complianceRate}%`,
      sub: `${closedIncidents.length} resolved total`,
      icon: ShieldCheck,
      color: complianceRate >= 80 ? 'emerald' : 'amber',
      glow: complianceRate >= 80 ? 'shadow-emerald-500/20' : 'shadow-amber-500/20',
    },
  ];

  const quickActions = [
    {
      label: 'User Management',
      desc: 'Create, assign & manage all system accounts',
      icon: UserPlus,
      path: '/dashboard/users',
      color: 'indigo',
    },
    {
      label: 'System Config',
      desc: 'Configure platform settings and policies',
      icon: Settings,
      path: '/dashboard/settings',
      color: 'slate',
    },
    {
      label: 'Compliance Desk',
      desc: 'Review site safety closures and inspections',
      icon: ClipboardList,
      path: '/dashboard/compliance',
      color: 'emerald',
    },
    {
      label: 'Security Log',
      desc: 'Full audit trail of all system events',
      icon: Eye,
      path: '/dashboard/security',
      color: 'purple',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="System Control Panel">
        <div className="flex items-center justify-center py-40">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Cpu className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              <div className="absolute -inset-2 rounded-[2rem] border border-indigo-500/20 animate-ping opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-white font-black text-lg uppercase tracking-widest">Initializing Control Panel</p>
              <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Fetching system data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="System Control Panel">
      <div className="space-y-10 animate-in fade-in duration-700">

        {/* ── Header ── */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Super Admin · Director Access
              </span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-none">
              System Control<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Panel</span>
            </h1>
            <p className="text-slate-400 mt-3 text-sm max-w-lg">
              Full institutional oversight — manage all facilities, personnel, and safety operations across the organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">System Online</span>
            </div>
            <button
              onClick={fetchSystemData}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Refresh"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── System Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {systemStats.map((stat, i) => (
            <div
              key={i}
              className={`relative bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 overflow-hidden group hover:border-${stat.color}-500/30 transition-all duration-300 hover:shadow-2xl ${stat.glow}`}
            >
              {/* Glow orb */}
              <div className={`absolute -top-6 -right-6 w-32 h-32 bg-${stat.color}-500/10 blur-3xl rounded-full group-hover:opacity-150 transition-opacity`} />
              <div className={`absolute top-6 right-6 p-3 bg-${stat.color}-500/10 rounded-2xl border border-${stat.color}-500/20`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
              <p className={`text-5xl font-black text-${stat.color === 'indigo' ? 'white' : stat.color + '-400'} leading-none mb-2`}>
                {stat.value}
              </p>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── Facilities Overview ── */}
          <div className="xl:col-span-2 bg-slate-900/50 border border-white/10 rounded-[3rem] overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-400" /> Facility Registry
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">{sites.length} total facilities under management</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
              >
                Manage <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {sites.length === 0 ? (
                <div className="py-20 text-center">
                  <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-600 text-xs font-black uppercase tracking-widest">No facilities registered</p>
                </div>
              ) : sites.map((site) => {
                const siteIncidents = allIncidents.filter(i => i.siteId === site._id || i.siteName === site.name);
                const sitePersonnel = allUsers.filter(u => u.siteIds?.some((s: any) => (s._id || s) === site._id));
                const siteOpen = siteIncidents.filter(i => !['closed', 'compliance_approved'].includes(i.status));
                return (
                  <div
                    key={site._id}
                    className="flex items-center gap-6 px-8 py-5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => navigate('/dashboard/admin')}
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                      {site.mapImage
                        ? <img src={`${API_URL}${site.mapImage}`} alt={site.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <Building2 className="w-6 h-6 text-slate-600 m-auto mt-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base truncate group-hover:text-indigo-400 transition-colors">{site.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-slate-500 text-xs truncate">{site.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-white font-black text-lg">{sitePersonnel.length}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Staff</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-black text-lg ${siteOpen.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{siteOpen.length}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Hazards</p>
                      </div>
                      <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        siteOpen.length === 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {siteOpen.length === 0 ? 'Safe' : 'Active'}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-8">

            {/* Quick Actions */}
            <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left"
                  >
                    <div className={`p-2.5 bg-${action.color}-500/10 rounded-xl border border-${action.color}-500/20 shrink-0 group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold group-hover:text-indigo-300 transition-colors">{action.label}</p>
                      <p className="text-slate-500 text-[10px] truncate">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Role Breakdown */}
            <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" /> Personnel Breakdown
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {roleDistribution.map((r) => (
                  <div key={r.role}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.label}</span>
                      <span className={`text-${r.color}-400 font-black text-sm`}>{r.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${r.color}-500 rounded-full transition-all duration-1000`}
                        style={{ width: allUsers.length > 0 ? `${(r.count / allUsers.length) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Incident Status Pipeline ── */}
        <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-400" /> System-Wide Incident Pipeline
              </h2>
              <p className="text-slate-500 text-xs mt-1">Real-time status across all {sites.length} facilities</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Flagged', status: 'open', color: 'amber' },
              { label: 'Under Review', status: 'under_review', color: 'blue' },
              { label: 'Verified', status: 'verified', color: 'indigo' },
              { label: 'In Resolution', status: 'resolved', color: 'violet' },
              { label: 'Compliance', status: 'compliance_review', color: 'purple' },
              { label: 'Closed', status: 'closed', color: 'emerald' },
            ].map((stage) => {
              const count = allIncidents.filter(i =>
                stage.status === 'closed'
                  ? ['closed', 'compliance_approved'].includes(i.status)
                  : i.status === stage.status
              ).length;
              return (
                <div key={stage.status} className={`bg-${stage.color}-500/5 border border-${stage.color}-500/20 rounded-2xl p-5 text-center`}>
                  <p className={`text-3xl font-black text-${stage.color}-400 mb-1`}>{count}</p>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stage.label}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default SuperAdminControlPanel;
