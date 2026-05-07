import { useState, useEffect } from 'react';
import API from '../../utils/api';
import CreateDriveModal from './CreateDriveModal';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import IncidentTimeline from '../../components/incidents/IncidentTimeline';
import { 
  ShieldAlert, 
  CheckCircle, 
  History as HistoryIcon,
  Search, 
  Loader2, 
  AlertTriangle,
  ClipboardList,
  Eye,
  X,
  FileCheck,
  RotateCcw,
  MessageSquare,
  Activity,
  Plus,
  Calendar,
  Layout,
  BarChart3,
  CheckSquare,
  Users,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

const ComplianceDashboard = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<any[]>([]);
  const [inspectionStats, setInspectionStats] = useState<any>({});
  const [inspectionDrives, setInspectionDrives] = useState<any[]>([]);
  const [view, setView] = useState<'QUEUE' | 'HISTORY' | 'INSPECTIONS'>('QUEUE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [summaryTasks, setSummaryTasks] = useState<any[]>([]);
  const [inspectionView, setInspectionView] = useState<'DRIVES' | 'SUMMARY' | 'DETAILS'>('DRIVES');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateDriveModal, setShowCreateDriveModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [complianceNotes, setComplianceNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (view === 'QUEUE') {
      fetchComplianceIncidents();
    } else if (view === 'HISTORY') {
      fetchHistory();
    } else {
      fetchInspectionData();
    }
  }, [view]);

  const fetchComplianceIncidents = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/incidents/compliance');
      setIncidents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch compliance incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/incidents/all?status=closed');
      setHistoryIncidents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectionData = async () => {
    try {
      setLoading(true);
      const [statsResp, drivesResp] = await Promise.all([
        API.get('/inspections/stats'),
        API.get('/inspections/drives')
      ]);
      setInspectionStats(statsResp.data);
      setInspectionDrives(drivesResp.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch inspection data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/inspections/summary');
      setSummaryTasks(data);
      setInspectionView('SUMMARY');
    } catch (err: any) {
      setError('Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reinspect') => {
    if (!complianceNotes.trim()) {
      alert('Please provide compliance notes before proceeding.');
      return;
    }

    try {
      setActionLoading(true);
      const endpoint = action === 'approve' ? 'compliance-approve' : 'reinspect';
      await API.put(`/incidents/${id}/${endpoint}`, { notes: complianceNotes });
      
      setSelectedIncident(null);
      setShowDetailModal(false);
      setComplianceNotes('');
      fetchComplianceIncidents();
    } catch (err: any) {
      alert('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderInspections = () => {
    if (inspectionView === 'SUMMARY') return renderWeeklySummary();
    if (inspectionView === 'DETAILS') return renderDriveDetails();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-8 pt-4">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setInspectionView('DRIVES')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  inspectionView === 'DRIVES' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Inspection Cycles
              </button>
              <button 
                onClick={fetchSummary}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  inspectionView === 'SUMMARY' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Weekly Summary
              </button>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Synchronizing Drives...</p>
            </div>
          ) : inspectionDrives.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-indigo-400" />
              </div>
              <h4 className="text-white font-bold text-lg">No Active Drives</h4>
              <p className="text-slate-500 text-sm">Create your first inspection cycle to start monitoring site safety.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.01]">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspection Drive</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Facility</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inspectionDrives.map((drive) => (
                  <tr key={drive._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { setSelectedDrive(drive); setInspectionView('DETAILS'); }}>
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">{drive.title}</p>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">{drive.inspectionType}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 text-xs font-bold">{drive.siteId?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {drive.completedTasks}/{drive.totalTasks} Done
                          </span>
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            {drive.totalTasks > 0 ? Math.round((drive.completedTasks / drive.totalTasks) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-1000" 
                            style={{ width: `${drive.totalTasks > 0 ? (drive.completedTasks / drive.totalTasks) * 100 : 0}%` }}
                          />
                        </div>
                        {drive.issuesFound > 0 && (
                          <p className="text-[8px] text-rose-400 font-black uppercase tracking-widest mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> {drive.issuesFound} Incidents Raised
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-slate-400 text-[10px] font-mono flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(drive.dueDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        drive.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {drive.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-xl group/btn">
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderWeeklySummary = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
       <button onClick={() => setInspectionView('DRIVES')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
         <ChevronLeft className="w-4 h-4" /> Back to Cycles
       </button>
       
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-black text-white uppercase tracking-tight">Weekly Compliance Summary</h2>
             <p className="text-slate-500 text-sm mt-1">Institutional safety audit performance for the last 7 days.</p>
          </div>
          <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">
             Export Report
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Areas Inspected', value: summaryTasks.length, icon: Layout, color: 'indigo' },
            { label: 'Safe Zones', value: summaryTasks.filter(t => t.status === 'completed' && !t.issueFound).length, icon: CheckCircle, color: 'emerald' },
            { label: 'Incidents Raised', value: summaryTasks.filter(t => t.issueFound).length, icon: AlertTriangle, color: 'rose' },
            { label: 'Compliance Rate', value: `${summaryTasks.length > 0 ? Math.round((summaryTasks.filter(t => t.status === 'completed').length / summaryTasks.length) * 100) : 0}%`, icon: Activity, color: 'amber' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
               <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400 opacity-20`} />
               </div>
            </div>
          ))}
       </div>

       <div className="space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Inspector Remarks & Evidence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {summaryTasks.filter(t => t.status === 'completed').map((task, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-400" />
                         </div>
                         <div>
                            <p className="text-white text-xs font-bold">{task.assignedTo?.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">{task.subsiteId?.name}</p>
                         </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.issueFound ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                         {task.issueFound ? 'Issue Found' : 'Clear'}
                      </span>
                   </div>
                   <p className="text-slate-400 text-xs italic leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                      &ldquo;{task.remarks}&rdquo;
                   </p>
                   {task.uploadedImages?.length > 0 && (
                      <div className="flex gap-2">
                         {task.uploadedImages.map((img: string, i: number) => (
                            <img key={i} src={`${API_URL}${img}`} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="" />
                         ))}
                      </div>
                   )}
                   {task.linkedIncidentId && (
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase text-indigo-400">
                         <AlertTriangle className="w-3 h-3" /> Linked Incident: {task.linkedIncidentId.title}
                      </div>
                   )}
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  const renderDriveDetails = () => (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
       <button onClick={() => setInspectionView('DRIVES')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
         <ChevronLeft className="w-4 h-4" /> Back to Cycles
       </button>

       <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <CheckSquare className="w-8 h-8 text-indigo-400" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md">Safety Audit Drive</span>
                   <span className="text-slate-500 font-mono text-[10px]">D-{selectedDrive._id.slice(-6)}</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{selectedDrive.title}</h2>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right mr-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date</p>
                <p className="text-white text-sm font-bold">{new Date(selectedDrive.dueDate).toLocaleDateString()}</p>
             </div>
             <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                selectedDrive.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20'
             }`}>
                {selectedDrive.status}
             </span>
          </div>
       </div>

       <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-white/[0.01]">
                   <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-Zone</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspector</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Finding</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                   <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted At</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {/* We'll need an endpoint to fetch tasks for a specific drive if we want real data here, 
                   but for now we can assume it's integrated or we fetch it when selecting drive. 
                   For simplicity, I'll update the fetchInspectionData to include drive tasks or just reuse summary if filtered.
                */}
                <tr className="bg-white/5 border-b border-white/5"><td colSpan={5} className="px-8 py-4 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest italic">Drive Progress Tracking Enabled</td></tr>
             </tbody>
          </table>
       </div>
    </div>
  );

  const stats = {
    pending: incidents.length,
    highSeverity: incidents.filter(i => i.severity === 'high').length,
    closedTotal: historyIncidents.length, 
  };

  return (
    <DashboardLayout title="Compliance & Safety">
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {view === 'INSPECTIONS' ? (
             <>
               <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <Activity className="w-20 h-20 text-indigo-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Active Drives</p>
                  <div className="flex items-end gap-3">
                     <h2 className="text-5xl font-black text-white">{inspectionStats.activeDrives || 0}</h2>
                     <span className="text-indigo-400 text-xs font-bold mb-2 uppercase tracking-widest">Cycles</span>
                  </div>
               </div>
               <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <BarChart3 className="w-20 h-20 text-rose-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Issues Found</p>
                  <div className="flex items-end gap-3">
                     <h2 className="text-5xl font-black text-rose-500">{inspectionStats.issuesFound || 0}</h2>
                     <span className="text-rose-400 text-xs font-bold mb-2 uppercase tracking-widest">Incidents</span>
                  </div>
               </div>
               <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <CheckCircle className="w-20 h-20 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Safe Areas</p>
                  <div className="flex items-end gap-3">
                     <h2 className="text-5xl font-black text-emerald-500">{inspectionStats.safeAreas || 0}</h2>
                     <span className="text-emerald-400 text-xs font-bold mb-2 uppercase tracking-widest">Verified</span>
                  </div>
               </div>
             </>
           ) : (
             <>
               <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <ShieldAlert className="w-20 h-20 text-indigo-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Pending Review</p>
                  <div className="flex items-end gap-3">
                     <h2 className="text-5xl font-black text-white">{stats.pending}</h2>
                     <span className="text-indigo-400 text-xs font-bold mb-2 uppercase tracking-widest">Hazards</span>
                  </div>
               </div>
               <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <AlertTriangle className="w-20 h-20 text-rose-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">High Severity</p>
                  <div className="flex items-end gap-3">
                     <h2 className="text-5xl font-black text-rose-500">{stats.highSeverity}</h2>
                     <span className="text-rose-400 text-xs font-bold mb-2 uppercase tracking-widest">Critical</span>
                  </div>
               </div>
               <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                     <CheckCircle className="w-20 h-20 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Closed Hazards</p>
                  <div className="flex items-end gap-3">
                     <h2 className="text-5xl font-black text-emerald-500">{stats.closedTotal || 0}</h2>
                     <span className="text-emerald-400 text-xs font-bold mb-2 uppercase tracking-widest">Compliant</span>
                  </div>
               </div>
             </>
           )}
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
           <button 
             onClick={() => setView('QUEUE')}
             className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
               view === 'QUEUE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
             }`}
           >
              <ClipboardList className="w-4 h-4" /> Pending Queue
           </button>
           <button 
             onClick={() => setView('HISTORY')}
             className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
               view === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
             }`}
           >
              <HistoryIcon className="w-4 h-4" /> Closure History
           </button>
           <button 
             onClick={() => setView('INSPECTIONS')}
             className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
               view === 'INSPECTIONS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
             }`}
           >
              <CheckSquare className="w-4 h-4" /> Safety Inspections
           </button>
        </div>

        {/* Incident List */}
        <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                {view === 'QUEUE' ? <ClipboardList className="text-indigo-500 w-6 h-6" /> : 
                 view === 'HISTORY' ? <HistoryIcon className="text-emerald-500 w-6 h-6" /> :
                 <CheckSquare className="text-indigo-400 w-6 h-6" />}
                {view === 'QUEUE' ? 'Safety Review Queue' : 
                 view === 'HISTORY' ? 'Compliance History' :
                 'Inspection Drives'}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {view === 'QUEUE' 
                  ? 'Review verified resolutions and authorize site safety closure.' 
                  : view === 'HISTORY' 
                  ? 'Registry of all authorized safety closures and compliance audits.'
                  : 'Manage safety inspection cycles and monitor field inspector progress.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
               {view === 'INSPECTIONS' && (
                 <button 
                  onClick={() => setShowCreateDriveModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                 >
                   <Plus className="w-4 h-4" /> Create Drive
                 </button>
               )}
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all w-64"
                 />
               </div>
            </div>
          </div>

          {view === 'INSPECTIONS' ? renderInspections() : (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Synchronizing Queue...</p>
                </div>
              ) : (view === 'QUEUE' ? incidents : historyIncidents).length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    {view === 'QUEUE' ? <CheckCircle className="w-10 h-10 text-emerald-500" /> : <HistoryIcon className="w-10 h-10 text-emerald-500" />}
                  </div>
                  <h4 className="text-white font-bold text-lg">{view === 'QUEUE' ? 'All Clear' : 'No History'}</h4>
                  <p className="text-slate-500 text-sm">
                    {view === 'QUEUE' 
                      ? 'No incidents currently awaiting compliance review.' 
                      : 'No safety closures have been recorded yet.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.01]">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Incident</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Facility Location</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{view === 'QUEUE' ? 'Resolved At' : 'Closed At'}</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(view === 'QUEUE' ? incidents : historyIncidents).map((inc) => (
                      <tr key={inc._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { setSelectedIncident(inc); setShowDetailModal(true); }}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className={`w-2 h-2 rounded-full ${inc.severity === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} />
                             <div>
                                <p className="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">{inc.title}</p>
                                <p className="text-[10px] font-mono text-slate-500 mt-0.5 uppercase">ID: {inc._id.slice(-8)}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                 {inc.subsiteMapImage ? (
                                    <img src={`${API_URL}${inc.subsiteMapImage}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="" />
                                 ) : (
                                    <ShieldAlert className="w-4 h-4 text-slate-600" />
                                 )}
                              </div>
                              <div>
                                 <p className="text-white text-xs font-bold">{inc.siteName}</p>
                                 <p className="text-slate-500 text-[10px] uppercase tracking-wider">{inc.subsiteName}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            inc.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            inc.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-slate-400 text-[10px] font-mono flex items-center gap-2">
                             <HistoryIcon className="w-3 h-3 text-indigo-400" />
                             {new Date(view === 'QUEUE' ? (inc.resolution?.resolvedAt || inc.updatedAt) : (inc.closedAt || inc.updatedAt)).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-indigo-500/10">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showDetailModal && selectedIncident && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => !actionLoading && setShowDetailModal(false)} />
           
           <div className="relative bg-slate-900 border border-white/10 w-full max-w-5xl h-full max-h-[90vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-500/10 rounded-2xl">
                       <ShieldAlert className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md">Safety Review</span>
                          <span className="text-slate-600 font-mono text-[10px]">INC-{selectedIncident._id.slice(-8)}</span>
                       </div>
                       <h2 className="text-2xl font-black text-white tracking-tight">{selectedIncident.title}</h2>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowDetailModal(false)}
                   className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Left: Info & Timeline */}
                    <div className="lg:col-span-2 space-y-12">
                       {/* Timeline Component */}
                       <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Workflow Status</h4>
                          <IncidentTimeline currentStatus={selectedIncident.status} />
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Initial Incident Data</h4>
                             <p className="text-slate-300 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                                {selectedIncident.description}
                             </p>
                          </div>
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Resolution Proof</h4>
                             <p className="text-slate-300 text-sm leading-relaxed bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 italic">
                                &ldquo;{selectedIncident.resolution?.notes || 'No resolution notes provided.'}&rdquo;
                             </p>
                          </div>
                       </div>

                       {/* Image Gallery */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Gallery</h4>
                          <div className="grid grid-cols-4 gap-4">
                             {/* Original Images */}
                             {selectedIncident.images?.map((img: string, idx: number) => (
                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setLightboxImage(`${API_URL}${img}`)}>
                                   <img src={`${API_URL}${img}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Incident" />
                                   <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/80 rounded text-[8px] font-black text-white uppercase backdrop-blur-md">Initial</div>
                                </div>
                             ))}
                             {/* Resolution Images */}
                             {selectedIncident.resolution?.images?.map((img: string, idx: number) => (
                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/20 group cursor-pointer" onClick={() => setLightboxImage(`${API_URL}${img}`)}>
                                   <img src={`${API_URL}${img}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Resolution" />
                                   <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-600/80 rounded text-[8px] font-black text-white uppercase backdrop-blur-md">Resolution</div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Right: Actions & Notes */}
                    <div className="space-y-8">
                       {view === 'QUEUE' ? (
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6">
                           <div className="flex items-center gap-3 text-indigo-400">
                              <MessageSquare className="w-5 h-5" />
                              <h4 className="text-sm font-black uppercase tracking-widest">Officer Remarks</h4>
                           </div>
                           <textarea 
                             value={complianceNotes}
                             onChange={(e) => setComplianceNotes(e.target.value)}
                             placeholder="Detail your findings or reasons for re-inspection..."
                             className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 min-h-[200px] transition-all"
                           />
                           
                           <div className="space-y-3 pt-4 border-t border-white/5">
                              <button 
                                onClick={() => handleAction(selectedIncident._id, 'approve')}
                                disabled={actionLoading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                              >
                                 {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                                 Authorize Site Closure
                              </button>
                              <button 
                                onClick={() => handleAction(selectedIncident._id, 'reinspect')}
                                disabled={actionLoading}
                                className="w-full py-4 bg-white/5 text-slate-400 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                              >
                                 <RotateCcw className="w-4 h-4" />
                                 Request Re-Inspection
                              </button>
                           </div>
                        </div>
                       ) : (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 space-y-6">
                           <div className="flex items-center gap-3 text-emerald-400">
                              <FileCheck className="w-5 h-5" />
                              <h4 className="text-sm font-black uppercase tracking-widest">Closure Approval</h4>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Remarks</p>
                              <p className="text-slate-300 text-xs italic">&ldquo;{selectedIncident.complianceReview?.notes || 'No remarks provided.'}&rdquo;</p>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized By</p>
                              <p className="text-white text-xs font-bold">{selectedIncident.complianceReview?.reviewedBy?.name || 'Authorized Officer'}</p>
                              <p className="text-slate-500 text-[10px]">{new Date(selectedIncident.closedAt).toLocaleString()}</p>
                           </div>
                        </div>
                       )}

                       <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem]">
                          <div className="flex items-start gap-4">
                             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                             <div>
                                <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Standard Operating Procedure</h5>
                                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                   Compliance closure legally signifies that all safety hazards have been mitigated according to institutional standards.
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-2xl animate-in zoom-in duration-300" onClick={() => setLightboxImage(null)}>
           <button className="absolute top-8 right-8 p-4 text-white/50 hover:text-white transition-colors">
              <X className="w-10 h-10" />
           </button>
           <img src={lightboxImage} className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" alt="Fullscreen" />
        </div>
      )}
      {/* Create Drive Modal */}
      {showCreateDriveModal && (
        <CreateDriveModal 
          onClose={() => setShowCreateDriveModal(false)}
          onSuccess={() => {
            setShowCreateDriveModal(false);
            fetchInspectionData();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default ComplianceDashboard;
