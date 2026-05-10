import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import IncidentCard from '../../components/dashboard/IncidentCard';
import { Search, ClipboardList, Loader2, AlertTriangle, ChevronLeft, SlidersHorizontal, X } from 'lucide-react';

const MyReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/incidents/my');
      setReports(data);
    } catch (err: any) {
      setError('Failed to load your reports.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const activeFilterCount = (filterSeverity !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              My Incident Reports
            </h1>
            <p className="text-slate-400 mt-1">
              Track and manage your submitted safety incidents.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search my reports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors w-56"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 border rounded-xl transition-colors relative ${
                showFilters || activeFilterCount > 0
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute right-0 top-12 z-50 bg-slate-900 border border-white/10 rounded-2xl p-4 w-60 shadow-2xl space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Severity</label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all" className="bg-slate-900">All Severities</option>
                    <option value="high" className="bg-slate-900">High</option>
                    <option value="medium" className="bg-slate-900">Medium</option>
                    <option value="low" className="bg-slate-900">Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="all" className="bg-slate-900">All Statuses</option>
                    <option value="reported" className="bg-slate-900">Reported</option>
                    <option value="approved" className="bg-slate-900">Approved</option>
                    <option value="verified" className="bg-slate-900">Verified</option>
                    <option value="resolved" className="bg-slate-900">Resolved</option>
                    <option value="closed" className="bg-slate-900">Closed</option>
                    <option value="rejected" className="bg-slate-900">Rejected</option>
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterSeverity('all'); setFilterStatus('all'); }}
                    className="w-full py-2 text-xs font-black text-rose-400 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results summary */}
      {(searchTerm || activeFilterCount > 0) && !loading && (
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">
          Showing {filteredReports.length} of {reports.length} reports
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="lg:col-span-2 flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="lg:col-span-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <IncidentCard 
              key={report._id}
              id={report._id}
              title={report.title}
              description={report.description}
              severity={report.severity.charAt(0).toUpperCase() + report.severity.slice(1) as any}
              status={report.status.charAt(0).toUpperCase() + report.status.slice(1) as any}
              date={new Date(report.createdAt).toLocaleDateString()}
              location={report.location}
              image={report.image}
              images={report.images}
              onDetail={() => setSelectedReport(report)}
            />
          ))
        ) : (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
            <ClipboardList className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">
              {searchTerm || activeFilterCount > 0 ? 'No matching reports' : 'No reports found'}
            </h3>
            <p className="text-slate-400">
              {searchTerm || activeFilterCount > 0 
                ? 'Try adjusting your search or filters.' 
                : "You haven't submitted any incident reports yet."}
            </p>
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedReport(null)}></div>
          <div className="relative bg-slate-900 border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in custom-scrollbar">
             <div className="sticky top-0 right-0 p-6 flex justify-end z-10">
                <button onClick={() => setSelectedReport(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
                   <X className="w-6 h-6" />
                </button>
             </div>
             <div className="px-10 pb-12 space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        selectedReport.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        selectedReport.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {selectedReport.severity} SEVERITY
                      </span>
                      <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Report ID: {selectedReport._id}</span>
                   </div>
                   <h2 className="text-4xl font-black text-white tracking-tight">{selectedReport.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</h4>
                         <p className="text-slate-300 leading-relaxed text-sm italic">"{selectedReport.description}"</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Location</h4>
                            <p className="text-white font-bold text-sm">{selectedReport.location?.address || 'Site Blueprint Point'}</p>
                         </div>
                         <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</h4>
                            <p className="text-indigo-400 font-black text-sm uppercase tracking-widest">{selectedReport.status}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Gallery</h4>
                      <div className="grid grid-cols-2 gap-4">
                         {(selectedReport.images && selectedReport.images.length > 0) ? (
                            selectedReport.images.map((img: string, i: number) => (
                               <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                                  <img src={`http://localhost:5000${img}`} className="w-full h-full object-cover" alt="" />
                               </div>
                            ))
                         ) : selectedReport.image && (
                            <div className="col-span-2 aspect-video rounded-2xl overflow-hidden border border-white/10">
                               <img src={`http://localhost:5000${selectedReport.image}`} className="w-full h-full object-cover" alt="" />
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyReports;
