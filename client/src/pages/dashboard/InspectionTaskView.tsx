import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle, Camera, Upload, AlertTriangle, FileText } from 'lucide-react';
import API from '../../utils/api';

interface InspectionTaskViewProps {
  task: any;
  onClose: () => void;
  onSuccess: () => void;
  onRaiseIncident: (task: any) => void;
}

const API_URL = 'http://localhost:5000';

const InspectionTaskView = ({ task, onClose, onSuccess, onRaiseIncident }: InspectionTaskViewProps) => {
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [checklist, setChecklist] = useState(
    task.checklistResults && task.checklistResults.length > 0 
      ? task.checklistResults 
      : [
          { question: 'Emergency exits clear and unobstructed', checked: false },
          { question: 'No visible wiring damage or exposed electricals', checked: false },
          { question: 'Safety signs and instructions clearly present', checked: false },
          { question: 'Equipment appears safe and maintained', checked: false },
          { question: 'Area clean and free of hazardous obstruction', checked: false },
        ]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles].slice(0, 5));
    const newPreviews = selectedFiles.map(f => URL.createObjectURL(f));
    setPreviews([...previews, ...newPreviews].slice(0, 5));
  };

  const toggleCheck = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx].checked = !newChecklist[idx].checked;
    setChecklist(newChecklist);
  };

  const handleMarkSafe = async () => {
    if (checklist.some(item => !item.checked)) {
      alert('Please complete all checklist items before marking as safe.');
      return;
    }
    if (files.length === 0) {
       alert('Please upload at least one image as evidence.');
       return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('checklistResults', JSON.stringify(checklist));
      formData.append('remarks', remarks || 'Area inspected and confirmed safe.');
      formData.append('issueFound', 'false');
      files.forEach(file => formData.append('images', file));

      await API.put(`/inspections/tasks/${task._id}/submit`, formData);
      onSuccess();
    } catch (err) {
      alert('Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-white/10 w-full max-w-6xl h-full max-h-[95vh] rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-indigo-500/10 rounded-2xl hidden md:block">
              <CheckCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md">Safety Audit</span>
                <span className="text-slate-600 font-mono text-[10px] uppercase">{task.inspectionDriveId?.inspectionType}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{task.subsiteId?.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-400" /> Inspection Checklist
                </h3>
                <div className="space-y-4">
                  {checklist.map((item, idx) => (
                    <label key={idx} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-pointer group hover:bg-white/[0.08] transition-all">
                      <input 
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleCheck(idx)}
                        className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-emerald-500 focus:ring-0 transition-all"
                      />
                      <span className={`text-sm font-medium transition-colors ${item.checked ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                        {item.question}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Camera className="w-5 h-5 text-indigo-400" /> Evidence Collection
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {previews.map((p, idx) => (
                    <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-white/10 relative group">
                      <img src={p} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                  {files.length < 5 && (
                    <button 
                      onClick={() => document.getElementById('inspectUpload')?.click()}
                      className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <Upload className="w-6 h-6 text-slate-600 mb-2" />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Upload</span>
                      <input type="file" id="inspectUpload" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-xl aspect-video">
                 <img src={`${API_URL}${task.subsiteId?.mapImage}`} className="w-full h-full object-cover" alt="Map" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Inspector Remarks</label>
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all min-h-[150px] resize-none"
                  placeholder="Describe findings..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => onRaiseIncident(task)}
                  className="py-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                >
                  <AlertTriangle className="w-4 h-4" /> Raise Incident
                </button>
                <button 
                  onClick={handleMarkSafe}
                  disabled={loading}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Mark Area Safe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InspectionTaskView;
