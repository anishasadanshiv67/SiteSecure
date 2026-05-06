import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Layout, Users, FileText, CheckCircle } from 'lucide-react';
import API from '../../utils/api';

interface CreateDriveModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDriveModal = ({ onClose, onSuccess }: CreateDriveModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [subsites, setSubsites] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inspectionType: 'Daily Safety Inspection',
    siteId: '',
    subsiteIds: [] as string[],
    assignedInspectors: [] as string[],
    dueDate: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data } = await API.get('/sites');
      setSites(data);
    } catch (err) {
      console.error('Failed to fetch sites');
    }
  };

  const handleSiteChange = async (siteId: string) => {
    setFormData({ ...formData, siteId, subsiteIds: [], assignedInspectors: [] });
    try {
      const [subsResp, usersResp] = await Promise.all([
        API.get(`/sites/subsites/${siteId}`),
        API.get(`/users/site/${siteId}`)
      ]);
      setSubsites(subsResp.data);
      setInspectors(usersResp.data.filter((u: any) => u.role === 'flagger'));
    } catch (err) {
      console.error('Failed to fetch site details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId || formData.subsiteIds.length === 0 || formData.assignedInspectors.length === 0) {
      alert('Please fill all required fields and select at least one subsite and inspector.');
      return;
    }

    try {
      setLoading(true);
      await API.post('/inspections/drive', formData);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <Plus className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Create Inspection Drive</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Safety & Compliance Cycle</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Inspection Title
              </label>
              <input 
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Weekly Fire Safety Audit"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-3 h-3" /> Inspection Type
              </label>
              <select 
                required
                value={formData.inspectionType}
                onChange={(e) => setFormData({...formData, inspectionType: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="Daily Safety Inspection">Daily Safety Inspection</option>
                <option value="Weekly Compliance Audit">Weekly Compliance Audit</option>
                <option value="Fire Safety Inspection">Fire Safety Inspection</option>
                <option value="Electrical Inspection">Electrical Inspection</option>
                <option value="Equipment Inspection">Equipment Inspection</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Layout className="w-3 h-3" /> Select Site
              </label>
              <select 
                required
                value={formData.siteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site._id} value={site._id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Due Date
              </label>
              <input 
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {formData.siteId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Select Sub-Zones ({subsites.length})
                </label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 h-40 overflow-y-auto space-y-2 custom-scrollbar">
                  {subsites.map(sub => (
                    <label key={sub._id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.subsiteIds.includes(sub._id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...formData.subsiteIds, sub._id]
                            : formData.subsiteIds.filter(id => id !== sub._id);
                          setFormData({...formData, subsiteIds: ids});
                        }}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
                      />
                      <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{sub.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3 h-3" /> Assign Inspectors ({inspectors.length})
                </label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 h-40 overflow-y-auto space-y-2 custom-scrollbar">
                  {inspectors.map(ins => (
                    <label key={ins._id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.assignedInspectors.includes(ins._id)}
                        onChange={(e) => {
                          const ids = e.target.checked 
                            ? [...formData.assignedInspectors, ins._id]
                            : formData.assignedInspectors.filter(id => id !== ins._id);
                          setFormData({...formData, assignedInspectors: ids});
                        }}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
                      />
                      <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{ins.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Initialize Inspection Cycle
          </button>
        </form>
      </div>
    </div>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
  </svg>
);

export default CreateDriveModal;
