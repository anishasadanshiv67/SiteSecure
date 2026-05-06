import { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import IncidentCard from '../../components/dashboard/IncidentCard';
import SubsiteMap from '../../components/dashboard/SubsiteMap';
import jsQR from 'jsqr';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle,
  Wrench,
  ShieldCheck,
  ClipboardCheck,
  Clock,
  ChevronRight,
  ChevronLeft,
  Map as MapIcon,
  Eye,
  Send,
  Building2,
  Layers,
  ArrowRight,
  History as HistoryIcon,
  Info,
  Navigation,
  Camera,
  Upload,
  X,
  QrCode
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000';

type ViewState = 'SITES' | 'SUBSITES' | 'INCIDENTS' | 'DETAIL' | 'HISTORY';

const ResolverDashboard = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>('SITES');
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Selection States
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedSubsite, setSelectedSubsite] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  // Form States
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Geofencing States
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceToIncident, setDistanceToIncident] = useState<number | null>(null);
  const [bypassGeofence, setBypassGeofence] = useState(false);

  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const resolutionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Distance Calculation
  useEffect(() => {
    if (selectedIncident && userLocation) {
      const dist = calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        selectedIncident.location?.lat || 0, 
        selectedIncident.location?.lng || 0
      );
      setDistanceToIncident(dist);
    } else {
      setDistanceToIncident(null);
    }
  }, [selectedIncident, userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [verifiedResp, allResp] = await Promise.all([
        API.get('/incidents/verified'),
        API.get('/incidents/all')
      ]);
      setActiveTasks(verifiedResp.data);
      setHistory(allResp.data.filter((inc: any) => inc.status === 'resolved'));
    } catch (err: any) {
      setError('Failed to fetch resolution tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              handleScanSuccess(code.data);
            } else {
              setError('No QR code found in image');
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanSuccess = async (data: string) => {
    try {
      setLoading(true);
      let subsiteId = data;
      if (subsiteId.includes('/')) {
        subsiteId = subsiteId.split('/').pop() || subsiteId;
      }

      const response = await API.get(`/sites/subsite/single/${subsiteId}`);
      const subsite = response.data;
      
      const incidentsResp = await API.get(`/incidents/subsite/${subsiteId}`);
      const filteredIncidents = incidentsResp.data.filter((inc: any) => inc.status === 'verified');

      const sites = getSitesWithTasks();
      const actualSiteId = (subsite.siteId?._id || subsite.siteId).toString();
      const existingSite = sites.find(s => s._id === actualSiteId);

      setSelectedSite(existingSite || { 
        _id: actualSiteId, 
        name: subsite.siteId?.name || 'Scanned Site',
        count: filteredIncidents.length 
      });

      setSelectedSubsite({ 
        _id: subsite._id, 
        name: subsite.name,
        count: filteredIncidents.length,
        incidents: filteredIncidents
      });
      
      setView('INCIDENTS');
    } catch (err) {
      setError('Invalid QR Code or Subsite not found');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes || selectedFiles.length === 0) {
      setMessage({ text: 'Notes and image proof are required', type: 'error' });
      return;
    }
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('notes', resolutionNotes);
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      await API.put(`/incidents/${selectedIncident._id}/resolve`, formData);
      setMessage({ text: 'Hazard resolved successfully!', type: 'success' });
      setSelectedIncident(null);
      setResolutionNotes('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setView('INCIDENTS');
      fetchData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files].slice(0, 5);
      setSelectedFiles(newFiles);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previewUrls];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);
  };

  // Grouping Logic
  const getSitesWithTasks = () => {
    const sitesMap = new Map();
    activeTasks.forEach(inc => {
      const siteId = inc.siteId?._id || inc.siteId;
      if (!siteId) return;
      const siteIdStr = siteId.toString();
      if (!sitesMap.has(siteIdStr)) {
        sitesMap.set(siteIdStr, {
          _id: siteIdStr,
          name: inc.siteName || 'Unknown Site',
          count: 0,
          incidents: []
        });
      }
      const site = sitesMap.get(siteIdStr);
      site.count++;
      site.incidents.push(inc);
    });
    return Array.from(sitesMap.values());
  };

  const getSubsitesWithTasks = (siteId: string) => {
    const subsitesMap = new Map();
    const siteIdStr = siteId?.toString();
    activeTasks.filter(inc => (inc.siteId?._id || inc.siteId)?.toString() === siteIdStr).forEach(inc => {
      const subsiteId = inc.subsiteId?._id || inc.subsiteId;
      if (!subsiteId) return;
      const subsiteIdStr = subsiteId.toString();
      if (!subsitesMap.has(subsiteIdStr)) {
        subsitesMap.set(subsiteIdStr, {
          _id: subsiteIdStr,
          name: inc.subsiteName || 'Unknown Subsite',
          count: 0,
          incidents: []
        });
      }
      const sub = subsitesMap.get(subsiteIdStr);
      sub.count++;
      sub.incidents.push(inc);
    });
    return Array.from(subsitesMap.values());
  };

  // Rendering Functions
  const renderSites = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {getSitesWithTasks().map(site => (
        <button 
          key={site._id}
          onClick={() => {
            setSelectedSite(site);
            setView('SUBSITES');
          }}
          className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left hover:bg-white/10 hover:border-blue-500/50 transition-all duration-500 shadow-2xl"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <div className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <span className="text-xs font-black text-blue-400 tracking-widest uppercase">{site.count} Tasks</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">{site.name}</h3>
          <p className="text-slate-400 text-sm mb-6">Manage resolution tasks across this site.</p>
          <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
            View Sub-Zones <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      ))}
      {getSitesWithTasks().length === 0 && !loading && (
        <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Workspace Clear</h3>
          <p className="text-slate-500">All assigned hazards have been resolved.</p>
        </div>
      )}
    </div>
  );

  const renderSubsites = () => (
    <div className="space-y-8">
      <button onClick={() => setView('SITES')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4" /> Back to Sites
      </button>
      
      <div className="flex items-center gap-6 p-8 bg-blue-600 rounded-[2.5rem] shadow-xl shadow-blue-500/20 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Building2 className="w-32 h-32" />
         </div>
         <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
            <Building2 className="w-10 h-10 text-white" />
         </div>
         <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-1">Assigned Facility</p>
            <h2 className="text-3xl font-black text-white tracking-tight">{selectedSite?.name}</h2>
            <p className="text-blue-100/60 text-xs font-bold mt-1 uppercase tracking-widest">{selectedSite?.count} Pending Resolutions</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getSubsitesWithTasks(selectedSite?._id).map(sub => (
          <button 
            key={sub._id}
            onClick={() => {
              setSelectedSubsite(sub);
              setView('INCIDENTS');
            }}
            className="group flex items-center gap-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 text-left hover:border-blue-500/50 transition-all"
          >
            <div className="p-4 bg-blue-500/10 rounded-2xl">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-black text-white">{sub.name}</h4>
              <p className="text-slate-500 text-sm">{sub.count} pending tasks</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div className="space-y-8">
      <button onClick={() => setView('SUBSITES')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest">
        <ChevronLeft className="w-4 h-4" /> Back to {selectedSite?.name}
      </button>

      <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] p-8 relative overflow-hidden group">
         <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden border border-white/10 shrink-0 relative shadow-xl">
               <img 
                 src={selectedSubsite?.incidents[0]?.subsiteMapImage ? `${API_URL}${selectedSubsite.incidents[0].subsiteMapImage}` : ''} 
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                 alt="" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
               <button onClick={() => setLightboxImage(selectedSubsite?.incidents[0]?.subsiteMapImage ? `${API_URL}${selectedSubsite.incidents[0].subsiteMapImage}` : null)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-sm">
                 <Eye className="w-6 h-6 text-white" />
               </button>
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Operational Task Zone</p>
               </div>
               <h2 className="text-4xl font-black text-white tracking-tight mb-2">{selectedSubsite?.name}</h2>
               <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> {selectedSubsite?.count} Tasks Found</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span className="flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5" /> {selectedSite?.name}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedSubsite?.incidents.map((inc: any) => (
          <div key={inc._id} onClick={() => { setSelectedIncident(inc); setView('DETAIL'); }} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <IncidentCard 
              id={inc._id}
              title={inc.title}
              description={inc.description}
              severity={inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1) as any}
              status={inc.status.charAt(0).toUpperCase() + inc.status.slice(1) as any}
              date={new Date(inc.createdAt).toLocaleDateString()}
              location={inc.location}
              onImageClick={setLightboxImage}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedIncident) return null;
    return (
      <div className="space-y-8 animate-fade-in">
        <button onClick={() => setView('INCIDENTS')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" /> Back to Tasks
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  selectedIncident.severity === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  selectedIncident.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {selectedIncident.severity}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white mb-4">{selectedIncident.title}</h2>
              <p className="text-slate-400 leading-relaxed mb-8">{selectedIncident.description}</p>
              
              <div className="space-y-4 pt-6 border-t border-white/5 text-[11px] font-bold uppercase tracking-widest">
                <div className="flex justify-between">
                   <span className="text-slate-500">Location</span>
                   <span className="text-white">{selectedIncident.location?.address || 'Map Point'}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolution Proof</h4>
              
              <textarea 
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe resolution details..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-all resize-none min-h-[100px]"
              />

              <div className="grid grid-cols-2 gap-4">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {selectedFiles.length < 5 && (
                  <div className="contents">
                    <div 
                      onClick={() => resolutionFileInputRef.current?.click()}
                      className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group overflow-hidden relative"
                    >
                      <Upload className="w-8 h-8 text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Upload Proof</span>
                    </div>

                    <div 
                      onClick={() => document.getElementById('resCamera')?.click()}
                      className="aspect-video bg-indigo-500/10 border-2 border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-500/20 transition-all group"
                    >
                      <Camera className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest text-center">Capture<br/>Proof</span>
                      <input type="file" id="resCamera" onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={resolutionFileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />

              <button 
                type="submit"
                disabled={submitting || (!bypassGeofence && (distanceToIncident === null || distanceToIncident > 10))}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex flex-col items-center justify-center gap-1 ${
                  bypassGeofence || (distanceToIncident !== null && distanceToIncident <= 10)
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                    : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                }`}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Complete & Resolve</span>}
                {bypassGeofence ? (
                  <span className="text-[8px] text-blue-200 animate-pulse">Demo Bypass Active</span>
                ) : (
                  <>
                    {distanceToIncident !== null && (
                       <span className={`text-[8px] ${distanceToIncident <= 10 ? 'text-blue-200' : 'text-rose-400'}`}>
                         {distanceToIncident <= 10 ? `In Range (${distanceToIncident.toFixed(1)}m)` : `Out of Range (${distanceToIncident.toFixed(1)}m)`}
                       </span>
                    )}
                  </>
                )}
              </button>
              
              <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Demo Mode</span>
                <button 
                  type="button"
                  onClick={() => setBypassGeofence(!bypassGeofence)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                    bypassGeofence ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  Bypass Geofence: {bypassGeofence ? 'ON' : 'OFF'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-white">Incident Evidence</span>
                <span className="text-[10px] font-bold text-slate-500">{(selectedIncident.images?.length || (selectedIncident.image ? 1 : 0))} Files</span>
              </div>
              
              <div className={`grid gap-4 ${selectedIncident.images?.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {selectedIncident.images && selectedIncident.images.length > 0 ? (
                  selectedIncident.images.map((img: string, idx: number) => (
                    <div 
                      key={idx}
                      className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl aspect-video group cursor-zoom-in relative"
                      onClick={() => setLightboxImage(`${API_URL}${img}`)}
                    >
                      <img 
                        src={`${API_URL}${img}`} 
                        alt={`Evidence ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ))
                ) : (
                  selectedIncident.image && (
                    <div 
                      className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl aspect-video group cursor-zoom-in relative"
                      onClick={() => setLightboxImage(`${API_URL}${selectedIncident.image}`)}
                    >
                      <img 
                        src={`${API_URL}${selectedIncident.image}`} 
                        alt="Evidence" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden h-[400px]">
               <SubsiteMap 
                  readOnly={true}
                  imageUrl={selectedIncident.subsiteMapImage ? `${API_URL}${selectedIncident.subsiteMapImage}` : null}
                  coordinates={selectedIncident.location ? [selectedIncident.location] : []}
                  height="100%"
               />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
             <Wrench className="w-10 h-10 text-blue-500" /> Resolution Center
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Manage and formally close assigned site hazards.</p>
        </div>

        <div className="flex items-center gap-4">
          {(view === 'SITES' || view === 'SUBSITES' || view === 'INCIDENTS') && (
            <>
              <button onClick={() => qrFileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                <QrCode className="w-4 h-4" /> Upload QR Code
              </button>
              <input type="file" ref={qrFileInputRef} onChange={handleQrUpload} className="hidden" accept="image/*" />
            </>
          )}
        </div>
      </div>

      {loading && !activeTasks.length ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading Tasks...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {view === 'SITES' && renderSites()}
          {view === 'SUBSITES' && renderSubsites()}
          {view === 'INCIDENTS' && renderIncidents()}
          {view === 'DETAIL' && renderDetail()}
        </div>
      )}

      {/* Lightbox & Toasts */}
      {message.text && (
        <div className={`fixed bottom-8 right-8 z-[2000] px-8 py-4 rounded-2xl border flex items-center gap-4 animate-fade-in-up shadow-2xl ${
          message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 backdrop-blur-xl' : 'bg-rose-500/20 border-rose-500/30 text-rose-400 backdrop-blur-xl'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-black text-xs uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-8" onClick={() => setLightboxImage(null)}>
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"></div>
          <img src={lightboxImage} alt="Expanded" className="relative max-w-full max-h-full object-contain rounded-3xl shadow-2xl animate-scale-in" />
        </div>
      )}
    </DashboardLayout>
  );
};

export default ResolverDashboard;
