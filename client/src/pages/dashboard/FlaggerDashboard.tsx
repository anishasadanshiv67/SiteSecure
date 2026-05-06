import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import IncidentCard from '../../components/dashboard/IncidentCard';
import SubsiteMap from '../../components/dashboard/SubsiteMap';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Search,
  Loader2,
  AlertTriangle,
  QrCode,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Camera,
  MapPin,
  Send,
  History,
  Info,
  Edit3,
  Trash2,
  Navigation,
  X
} from 'lucide-react';

import API from '../../utils/api';
import jsQR from 'jsqr';

const API_URL = 'http://localhost:5000';

type ViewState = 'MENU' | 'SCAN' | 'SITE_LIST' | 'SUBSITE_LIST' | 'SUBSITE_DETAIL' | 'REPORT' | 'HISTORY';

const FlaggerDashboard: React.FC = () => {
  const [view, setView] = useState<ViewState>('MENU');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data States
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [subsites, setSubsites] = useState<any[]>([]);
  const [selectedSubsite, setSelectedSubsite] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  
  // Report Form States
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    severity: 'low',
    locationName: ''
  });
  const [reportPoint, setReportPoint] = useState<any[]>([]);
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [reportPreviews, setReportPreviews] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMyIncidents();
  }, []);

  const fetchMyIncidents = async () => {
    try {
      const { data } = await API.get('/incidents/my');
      setMyIncidents(data);
    } catch (err) {}
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/sites');
      setSites(data);
      
      // UX Improvement: If the user is assigned to exactly 1 site, skip to its subsites
      if (data.length === 1) {
        handleSiteSelect(data[0]);
      } else {
        setView('SITE_LIST');
      }
    } catch (err) {
      setError('Failed to fetch sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSelect = async (site: any) => {
    setSelectedSite(site);
    setLoading(true);
    try {
      const { data } = await API.get(`/sites/subsites/${site._id}`);
      setSubsites(data);
      setView('SUBSITE_LIST');
    } catch (err) {
      setError('Failed to fetch sub-zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubsiteSelect = async (subsite: any) => {
    setSelectedSubsite(subsite);
    setLoading(true);
    try {
      const { data } = await API.get(`/incidents/subsite/${subsite._id}`);
      setIncidents(data);
      setView('SUBSITE_DETAIL');
    } catch (err) {
      setError('Failed to fetch subsite data');
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const image = new Image();
      image.src = event.target?.result as string;
      image.onload = async () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return setLoading(false);
        
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          let subsiteId = code.data;
          // Robustness: Handle if the QR contains a full URL instead of just the ID
          if (subsiteId.includes('/')) {
            subsiteId = subsiteId.split('/').pop() || subsiteId;
          }
          
          try {
            const { data } = await API.get(`/sites/subsite/single/${subsiteId}`);
            handleSubsiteSelect(data);
          } catch (err) {
            setError('Subsite not found for this QR code');
            setLoading(false);
          }
        } else {
          setError('Could not detect a valid QR code in this image');
          setLoading(false);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...reportFiles, ...files].slice(0, 5); // Limit to 5
      setReportFiles(newFiles);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setReportPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...reportFiles];
    newFiles.splice(index, 1);
    setReportFiles(newFiles);

    const newPreviews = [...reportPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setReportPreviews(newPreviews);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportPoint.length === 0) return setError('Please select incident location on map');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('title', reportForm.title);
    formData.append('description', reportForm.description);
    formData.append('severity', reportForm.severity);
    formData.append('location', reportForm.locationName);
    formData.append('siteId', selectedSite?._id || selectedSubsite?.siteId);
    formData.append('subsiteId', selectedSubsite?._id);
    formData.append('lat', reportPoint[0].lat.toString());
    formData.append('lng', reportPoint[0].lng.toString());
    formData.append('x', reportPoint[0].x.toString());
    formData.append('y', reportPoint[0].y.toString());
    reportFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      if (editingId) {
        await API.put(`/incidents/${editingId}`, formData);
        setSuccess('Incident updated successfully!');
      } else {
        await API.post('/incidents', formData);
        setSuccess('Incident reported successfully!');
      }
      clearReportForm();
      setTimeout(() => {
        setSuccess('');
        if (view === 'HISTORY') fetchMyIncidents();
        else handleSubsiteSelect(selectedSubsite);
      }, 2000);
    } catch (err) {
      setError('Failed to process report');
    } finally {
      setLoading(false);
    }
  };

  const clearReportForm = () => {
    setReportForm({
      title: '',
      description: '',
      severity: 'low',
      locationName: ''
    });
    setReportPoint([]);
    setReportFiles([]);
    setReportPreviews([]);
    setEditingId(null);
  };

  const resetState = () => {
    setView('MENU');
    setSelectedSite(null);
    setSelectedSubsite(null);
    setError('');
    clearReportForm();
  };

  // Rendering Functions
  const renderMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="group relative bg-white/5 border border-white/10 rounded-[3rem] p-10 text-center hover:border-indigo-500/50 transition-all hover:-translate-y-2 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <QrCode className="w-40 h-40" />
        </div>
        <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 group-hover:scale-110 transition-transform">
          <QrCode className="w-12 h-12 text-indigo-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-4">Scan QR</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Upload a sub-zone QR code to instantly access the reporting dashboard.
        </p>
        <input type="file" ref={fileInputRef} onChange={handleQrUpload} className="hidden" accept="image/*" />
      </button>

      <button 
        onClick={fetchSites}
        className="group relative bg-white/5 border border-white/10 rounded-[3rem] p-10 text-center hover:border-rose-500/50 transition-all hover:-translate-y-2 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <MapIcon className="w-40 h-40" />
        </div>
        <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-500/20 group-hover:scale-110 transition-transform">
          <MapIcon className="w-12 h-12 text-rose-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-4">View Sites</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Browse all available facility locations and their specific sub-zones.
        </p>
      </button>

      <button 
        onClick={() => setView('HISTORY')}
        className="group relative bg-white/5 border border-white/10 rounded-[3rem] p-10 text-center hover:border-emerald-500/50 transition-all hover:-translate-y-2 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <History className="w-40 h-40" />
        </div>
        <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
          <History className="w-12 h-12 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-4">Report History</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Review all safety concerns you have reported and track their status.
        </p>
      </button>
    </div>
  );

  const renderSiteList = () => (
    <div className="space-y-6">
      <button onClick={resetState} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" /> Back to Menu
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map(site => (
          <div 
            key={site._id}
            onClick={() => handleSiteSelect(site)}
            className="group bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all"
          >
            <div className="h-40 bg-slate-900 overflow-hidden">
               <img src={`${API_URL}${site.mapImage}`} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="" />
            </div>
            <div className="p-8">
              <h3 className="text-xl font-black text-white mb-2">{site.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6">{site.description}</p>
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Facility Detail</span>
                 <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubsiteList = () => (
    <div className="space-y-6">
      <button onClick={() => setView('SITE_LIST')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
        <ChevronLeft className="w-5 h-5" /> Back to Sites
      </button>
      <div className="flex items-center gap-4 p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-500/20">
         <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <MapIcon className="w-8 h-8 text-white" />
         </div>
         <div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Selected Facility</p>
            <h2 className="text-2xl font-black text-white">{selectedSite?.name}</h2>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subsites.map(sub => (
          <div 
            key={sub._id}
            onClick={() => handleSubsiteSelect(sub)}
            className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex items-center justify-between cursor-pointer hover:border-rose-500/50 transition-all shadow-xl"
          >
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border border-white/10">
                  <img src={`${API_URL}${sub.mapImage}`} className="w-full h-full object-cover" alt="" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white mb-1">{sub.name}</h3>
                  <p className="text-slate-500 text-xs">{sub.location}</p>
               </div>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-rose-500 transition-all group-hover:shadow-lg group-hover:shadow-rose-500/30">
               <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubsiteDetail = () => {
    if (!selectedSubsite) return (
      <div className="py-40 text-center">
         <div className="animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
         <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Sub-Zone Data...</p>
      </div>
    );

    return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => setView('SUBSITE_LIST')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm">
          <ChevronLeft className="w-5 h-5" /> Site Overview
        </button>
        <button 
          onClick={() => setView('REPORT')}
          className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> Report New Hazard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl h-[500px]">
            <SubsiteMap 
              readOnly={true} 
              imageUrl={`${API_URL}${selectedSubsite?.mapImage}`} 
              height="100%"
              existingIncidents={incidents}
              singlePoint={true}
            />
          </div>
          <div className="flex items-start gap-4 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
             <Info className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
             <p className="text-xs text-amber-300 leading-relaxed font-medium">
               The map above shows current safety concerns marked with red icons. Check these before reporting to avoid duplicate submissions.
             </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-white px-4 flex items-center gap-3">
             <AlertTriangle className="w-6 h-6 text-rose-500" /> Active Hazards
          </h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {incidents.map(inc => (
              <div key={inc._id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-rose-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${
                        inc.severity === 'high' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>{inc.severity}</span>
                  </div>
                  <h4 className="font-black text-white mb-1 text-sm">{inc.title}</h4>
                  <p className="text-slate-400 text-[10px] mb-3 line-clamp-2 leading-relaxed">{inc.description}</p>
                  
                  {(inc.image || (inc.images && inc.images.length > 0)) && (
                    <div className={`grid gap-2 mb-3 ${inc.images && inc.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {inc.images && inc.images.length > 0 ? (
                        inc.images.map((img: string, idx: number) => (
                          <div 
                            key={idx}
                            className="rounded-xl overflow-hidden aspect-video border border-white/10 group/img cursor-zoom-in relative" 
                            onClick={() => setLightboxImage(`${API_URL}${img}`)}
                          >
                            <img src={`${API_URL}${img}`} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="" />
                          </div>
                        ))
                      ) : (
                        inc.image && (
                          <div className="rounded-xl overflow-hidden aspect-video border border-white/10 group/img cursor-zoom-in relative" onClick={() => setLightboxImage(`${API_URL}${inc.image}`)}>
                            <img src={`${API_URL}${inc.image}`} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="" />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold bg-white/5 p-2 rounded-lg">
                     <Navigation className="w-3 h-3 text-indigo-400" />
                     <span className="flex gap-2">
                        <span>LAT: {inc.location?.lat?.toFixed(4) || '0.0000'}</span>
                        <span>LNG: {inc.location?.lng?.toFixed(4) || '0.0000'}</span>
                     </span>
                  </div>
               </div>
            ))}
            {incidents.length === 0 && (
              <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-slate-700 text-[10px] font-black uppercase tracking-widest">
                 Safe Zone
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderReportForm = () => (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
       <button onClick={() => setView('SUBSITE_DETAIL')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm">
        <ChevronLeft className="w-5 h-5" /> Cancel Report
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
           <div className="p-8 bg-indigo-600 rounded-[3rem] shadow-xl shadow-indigo-500/20">
              <h2 className="text-3xl font-black text-white mb-2">Report Hazard</h2>
              <p className="text-indigo-200 text-sm font-medium">Provide detailed information about the safety concern.</p>
           </div>

           <form onSubmit={handleReportSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Incident Title</label>
                <input 
                  type="text" 
                  value={reportForm.title}
                  onChange={e => setReportForm({...reportForm, title: e.target.value})}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="Short, descriptive title"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Severity</label>
                  <select 
                    value={reportForm.severity}
                    onChange={e => setReportForm({...reportForm, severity: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-[2rem] px-8 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Exact Room/Area</label>
                  <input 
                    type="text" 
                    value={reportForm.locationName}
                    onChange={e => setReportForm({...reportForm, locationName: e.target.value})}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="e.g. Server Room B"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Evidence Photos (Up to 5)</label>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {reportPreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {reportFiles.length < 5 && (
                    <div className="contents">
                      <div 
                        onClick={() => document.getElementById('reportPhoto')?.click()}
                        className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group"
                      >
                        <Upload className="w-6 h-6 text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Upload</span>
                        <input type="file" id="reportPhoto" onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                      </div>

                      <div 
                        onClick={() => document.getElementById('cameraPhoto')?.click()}
                        className="aspect-square bg-indigo-500/10 border-2 border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-500/20 transition-all group"
                      >
                        <Camera className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest text-center">Capture<br/>Photo</span>
                        <input type="file" id="cameraPhoto" onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Detailed Description</label>
                <textarea 
                  value={reportForm.description}
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-8 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  placeholder="Explain the hazard in detail..."
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-rose-600 text-white font-black rounded-[2rem] shadow-2xl shadow-rose-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> Deploy Report</>}
              </button>
           </form>
        </div>

        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Point on Map</label>
              <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden h-[600px] shadow-2xl relative">
                <SubsiteMap 
                  coordinates={reportPoint}
                  onChange={setReportPoint}
                  imageUrl={`${API_URL}${selectedSubsite?.mapImage}`}
                  height="100%"
                  existingIncidents={incidents}
                  singlePoint={true}
                />
                
                {reportPoint.length === 0 ? (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] px-6 py-3 bg-slate-950/80 border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none">
                     <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Pinpoint the Exact Location</span>
                  </div>
                ) : (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] px-6 py-3 bg-indigo-600 border border-white/10 rounded-2xl flex flex-col items-center shadow-2xl">
                     <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Location Locked</span>
                     </div>
                     <div className="flex gap-3 text-[10px] font-mono text-indigo-100">
                        <span>LAT: {reportPoint[0].lat.toFixed(6)}</span>
                        <span>LNG: {reportPoint[0].lng.toFixed(6)}</span>
                     </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8 animate-fade-in">
       <button onClick={resetState} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm">
        <ChevronLeft className="w-5 h-5" /> Back to Menu
      </button>

      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-black text-white">Your Reporting History</h2>
         <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
            <StatCard label="Total" value={myIncidents.length} icon={FileText} color="blue" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {myIncidents.map(inc => (
          <IncidentCard 
            key={inc._id}
            id={inc._id}
            title={inc.title}
            description={inc.description}
            severity={inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1) as any}
            status={inc.status.charAt(0).toUpperCase() + inc.status.slice(1) as any}
            date={new Date(inc.createdAt).toLocaleDateString()}
            location={inc.location}
            image={inc.image}
            images={inc.images}
            onImageClick={setLightboxImage}
          />
        ))}
        {myIncidents.length === 0 && (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-700 text-xs font-black uppercase tracking-widest">
            No reports found in your records
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {success && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-2xl animate-fade-in-up flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6" /> {success}
        </div>
      )}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] px-8 py-4 bg-rose-500 text-white font-black rounded-2xl shadow-2xl animate-fade-in-up flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" /> {error}
        </div>
      )}

      {view === 'MENU' && renderMenu()}
      {view === 'SITE_LIST' && renderSiteList()}
      {view === 'SUBSITE_LIST' && renderSubsiteList()}
      {view === 'SUBSITE_DETAIL' && renderSubsiteDetail()}
      {view === 'REPORT' && renderReportForm()}
      {view === 'HISTORY' && renderHistory()}

      {loading && view !== 'MENU' && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
           <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setLightboxImage(null)}></div>
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-scale-in">
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-0 right-0 p-4 text-slate-400 hover:text-white z-10"
            >
              <X className="w-10 h-10" />
            </button>
            <img src={lightboxImage} alt="Expanded" className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FlaggerDashboard;
