import { useState, useEffect } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { 
  Shield, 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle,
  User,
  Activity,
  Clock
} from 'lucide-react';

const SecurityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/logs');
      setLogs(data);
    } catch (err: any) {
      setError('Failed to fetch security logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="text-purple-500" /> Audit Logs
          </h1>
          <p className="text-slate-400 mt-1">
            System-wide security and action tracking for compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-40 text-center text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{error}</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Timestamp</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">User</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Action</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Incident Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {log.user?.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-white">{log.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        log.action.includes('Approved') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        log.action.includes('Rejected') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors font-medium">
                        {log.incident?.title || 'Unknown Incident'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-40 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto mb-6 text-slate-700" />
            <h3 className="text-xl font-bold text-white mb-2">No audit logs found</h3>
            <p className="text-slate-500">System actions will appear here once they occur.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SecurityLog;
