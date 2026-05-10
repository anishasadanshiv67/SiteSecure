import { useState, useEffect } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { 
  Shield, 
  History as HistoryIcon, 
  Search, 
  Loader2, 
  AlertTriangle,
  Activity,
  Clock,
  X,
  Download,
  CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SecurityLog = () => {
  const { t } = useTranslation(['dashboard']);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      if (logs.length > 0) setRefreshing(true);
      else setLoading(true);
      
      const { data } = await API.get('/logs');
      setLogs(data);
      if (logs.length > 0) {
        setMessage({ text: t('common:success.refresh', { defaultValue: 'Logs updated successfully' }), type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    } catch (err: any) {
      setError(t('security.fetchError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.incident?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'all' || 
      (filterAction === 'approved' && log.action?.includes('Approved')) ||
      (filterAction === 'rejected' && log.action?.includes('Rejected')) ||
      (filterAction === 'other' && !log.action?.includes('Approved') && !log.action?.includes('Rejected'));
    
    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const csvContent = [
      [
        t('security.columns.timestamp'),
        t('security.columns.user'),
        t('security.columns.action'),
        t('security.columns.incidentRef')
      ],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user?.name || t('common.unknown', { defaultValue: 'Unknown' }),
        log.action || '',
        log.incident?.title || t('security.unknownIncident')
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Shield className="text-purple-500" /> {t('security.title')}
          </h1>
          <p className="text-slate-400 mt-1">
            {t('security.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('security.searchPlaceholder', { defaultValue: 'Search logs...' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 transition-colors w-52"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none"
          >
            <option value="all" className="bg-slate-900">{t('security.filters.all', { defaultValue: 'All Actions' })}</option>
            <option value="approved" className="bg-slate-900">{t('security.filters.approvals', { defaultValue: 'Approvals' })}</option>
            <option value="rejected" className="bg-slate-900">{t('security.filters.rejections', { defaultValue: 'Rejections' })}</option>
            <option value="other" className="bg-slate-900">{t('security.filters.other', { defaultValue: 'Other' })}</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-600 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export as CSV"
          >
            <Download className="w-4 h-4" />
            {t('security.export', { defaultValue: 'Export' })}
          </button>

          <button 
            onClick={fetchLogs} 
            disabled={loading || refreshing}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('common:refresh', { defaultValue: 'Refresh' })}
          >
            <Activity className={`w-5 h-5 ${refreshing || (loading && logs.length === 0) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed bottom-8 right-8 z-[2000] px-8 py-4 rounded-2xl border flex items-center gap-4 animate-fade-in-up shadow-2xl ${
          message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 backdrop-blur-xl' : 'bg-rose-500/20 border-rose-500/30 text-rose-400 backdrop-blur-xl'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-black text-xs uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      {/* Results count */}
      {(searchTerm || filterAction !== 'all') && !loading && (
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">
          {t('security.showingEntries', { count: filteredLogs.length, total: logs.length, defaultValue: `Showing ${filteredLogs.length} of ${logs.length} entries` })}
        </p>
      )}

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
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">{t('security.columns.timestamp')}</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">{t('security.columns.user')}</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">{t('security.columns.action')}</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">{t('security.columns.incidentRef')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
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
                          {log.user?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-semibold text-white">{log.user?.name || t('common.unknown', { defaultValue: 'Unknown' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        log.action?.includes('Approved') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        log.action?.includes('Rejected') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors font-medium">
                        {log.incident?.title || t('security.unknownIncident')}
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
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm || filterAction !== 'all' ? t('security.noMatchingLogs', { defaultValue: 'No matching logs' }) : t('security.noLogs')}
            </h3>
            <p className="text-slate-500">
              {searchTerm || filterAction !== 'all' 
                ? t('security.noMatchingLogsSubtitle', { defaultValue: 'Try adjusting your search or filter.' }) 
                : t('security.noLogsSubtitle')}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SecurityLog;
