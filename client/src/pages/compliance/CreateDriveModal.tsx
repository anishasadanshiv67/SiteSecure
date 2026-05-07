import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Layout, Users, FileText, CheckCircle, Plus, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API from '../../utils/api';

interface CreateDriveModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDriveModal = ({ onClose, onSuccess }: CreateDriveModalProps) => {
  const { t } = useTranslation(['dashboard', 'common']);
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
    dueDate: '',
    checklist: [] as string[]
  });

  const [customQuestion, setCustomQuestion] = useState('');

  const questionLibrary = [
    { category: 'Fire Safety', questions: [
      'Emergency exits clear and unobstructed',
      'Fire extinguishers present and serviced',
      'Fire alarm system functional',
      'Exit signs illuminated',
      'No storage of flammable materials near heat sources'
    ]},
    { category: 'Electrical', questions: [
      'No exposed wiring or damaged cables',
      'Electrical panels accessible and locked',
      'No overloading of power strips',
      'Equipment grounded properly',
      'Lighting functional in all areas'
    ]},
    { category: 'General Safety', questions: [
      'Walkways free of tripping hazards',
      'Spills cleaned and marked',
      'Guardrails/Handrails secure',
      'First aid kits stocked and accessible',
      'Proper signage for hazards'
    ]},
    { category: 'Security', questions: [
      'Entry/Exit points secure',
      'CCTV cameras operational',
      'Unauthorized personnel restricted',
      'ID badges visible on staff'
    ]},
    { category: 'Environmental', questions: [
      'Waste disposed of correctly',
      'No leakage of chemicals/fluids',
      'Proper ventilation in work areas',
      'Temperature/Humidity within safe levels'
    ]}
  ];

  useEffect(() => {
    fetchSites();
  }, []);

  const toggleQuestion = (q: string) => {
    const newChecklist = formData.checklist.includes(q)
      ? formData.checklist.filter(item => item !== q)
      : [...formData.checklist, q];
    setFormData({ ...formData, checklist: newChecklist });
  };

  const addCustomQuestion = () => {
    if (customQuestion.trim()) {
      setFormData({ ...formData, checklist: [...formData.checklist, customQuestion.trim()] });
      setCustomQuestion('');
    }
  };

  const removeQuestion = (q: string) => {
    setFormData({ ...formData, checklist: formData.checklist.filter(item => item !== q) });
  };

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
    if (formData.checklist.length === 0) {
      alert('Please select at least one checklist item.');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-6xl h-full max-h-[95vh] rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <Plus className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{t('compliance.createDrive.title')}</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{t('compliance.createDrive.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Section: Details & Assignment */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3" /> {t('compliance.createDrive.inspectionTitle')}
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder={t('compliance.createDrive.titlePlaceholder')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" /> {t('compliance.createDrive.inspectionType')}
                  </label>
                  <select 
                    required
                    value={formData.inspectionType}
                    onChange={(e) => setFormData({...formData, inspectionType: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all [&>option]:bg-slate-900"
                  >
                    <option value="Daily Safety Inspection">{t('compliance.createDrive.types.daily')}</option>
                    <option value="Weekly Compliance Audit">{t('compliance.createDrive.types.weekly')}</option>
                    <option value="Fire Safety Inspection">{t('compliance.createDrive.types.fire')}</option>
                    <option value="Electrical Inspection">{t('compliance.createDrive.types.electrical')}</option>
                    <option value="Equipment Inspection">{t('compliance.createDrive.types.equipment')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" /> {t('compliance.createDrive.selectSite')}
                  </label>
                  <select 
                    required
                    value={formData.siteId}
                    onChange={(e) => handleSiteChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all [&>option]:bg-slate-900"
                  >
                    <option value="">{t('compliance.createDrive.selectSitePlaceholder')}</option>
                    {sites.map(site => (
                      <option key={site._id} value={site._id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> {t('compliance.createDrive.dueDate')}
                  </label>
                  <input 
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {formData.siteId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" /> {t('compliance.createDrive.selectSubzones', { count: subsites.length })}
                    </label>
                    <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {subsites.map(sub => (
                        <label key={sub._id} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-white/5 rounded-lg transition-all">
                          <input 
                            type="checkbox"
                            checked={formData.subsiteIds.includes(sub._id)}
                            onChange={(e) => {
                              const ids = e.target.checked 
                                ? [...formData.subsiteIds, sub._id]
                                : formData.subsiteIds.filter(id => id !== sub._id);
                              setFormData({...formData, subsiteIds: ids});
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-slate-950 text-indigo-500 focus:ring-0"
                          />
                          <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-3 h-3" /> {t('compliance.createDrive.assignInspectors', { count: inspectors.length })}
                    </label>
                    <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {inspectors.map(ins => (
                        <label key={ins._id} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-white/5 rounded-lg transition-all">
                          <input 
                            type="checkbox"
                            checked={formData.assignedInspectors.includes(ins._id)}
                            onChange={(e) => {
                              const ids = e.target.checked 
                                ? [...formData.assignedInspectors, ins._id]
                                : formData.assignedInspectors.filter(id => id !== ins._id);
                              setFormData({...formData, assignedInspectors: ids});
                            }}
                            className="w-4 h-4 rounded border-white/10 bg-slate-950 text-indigo-500 focus:ring-0"
                          />
                          <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{ins.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> {t('compliance.createDrive.checklistTitle')}
                </label>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
                  {t('compliance.createDrive.selectedCount', { count: formData.checklist.length })}
                </span>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder={t('compliance.createDrive.customQuestionPlaceholder')}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())}
                />
                <button 
                  type="button"
                  onClick={addCustomQuestion}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Question Library */}
              <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {/* Selected Questions Chip Area */}
                {formData.checklist.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                    {formData.checklist.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-500/20 group">
                        <span className="max-w-[150px] truncate">{q}</span>
                        <button type="button" onClick={() => removeQuestion(q)} className="hover:text-rose-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {questionLibrary.map((cat, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-3 bg-indigo-500/50 rounded-full" /> {cat.category}
                    </h4>
                    <div className="space-y-2">
                      {cat.questions.map((q, qIdx) => (
                        <label key={qIdx} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                          <input 
                            type="checkbox"
                            checked={formData.checklist.includes(q)}
                            onChange={() => toggleQuestion(q)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-0"
                          />
                          <span className={`text-[11px] font-medium transition-colors ${formData.checklist.includes(q) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                            {q}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {t('compliance.createDrive.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDriveModal;
