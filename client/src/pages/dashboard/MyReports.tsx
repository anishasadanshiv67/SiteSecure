import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import IncidentCard from '../../components/dashboard/IncidentCard';
import { Search, Filter, ClipboardList, Loader2, AlertTriangle, ChevronLeft } from 'lucide-react';

const MyReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

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
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <IncidentCard 
              key={report._id}
              id={report._id}
              title={report.title}
              description={report.description}
              severity={report.severity.charAt(0).toUpperCase() + report.severity.slice(1) as any}
              status={report.status.charAt(0).toUpperCase() + report.status.slice(1) as any}
              date={new Date(report.createdAt).toLocaleDateString()}
              location={report.location}
            />
          ))
        ) : (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl text-center">
            <ClipboardList className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-1">No reports found</h3>
            <p className="text-slate-400">You haven't submitted any incident reports yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyReports;
