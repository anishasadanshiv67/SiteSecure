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
  ShieldCheck,
  ClipboardCheck,
  Clock,
  ClipboardList,
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
  Edit3,
  Trash2,
  Navigation,
  Camera,
  Upload,
  X,
  QrCode
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000';

type ViewState = 'SITES' | 'SUBSITES' | 'INCIDENTS' | 'DETAIL' | 'HISTORY' | 'SCAN';

const VerificationDashboard = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewState>('SITES');
  const [allReported, setAllReported] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Selection States
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedSubsite, setSelectedSubsite] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceToIncident, setDistanceToIncident] = useState<number | null>(null);
  const [bypassGeofence, setBypassGeofence] = useState(false);

  // Scanner Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardFileInputRef = useRef<HTMLInputElement>(null);

  const isOnlineVerifier = user?.role === 'online_verifier';

  useEffect(() => {
    fetchData();
    if (!isOnlineVerifier) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.error('GPS Error:', err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [user?.role]);

  // UX Improvement: If there's only one site available, skip directly to its subsites
  useEffect(() => {
    if (view === 'SITES' && allReported.length > 0) {
      const sites = getSitesWithIncidents();
      if (sites.length === 1) {
        setSelectedSite(sites[0]);
        setView('SUBSITES');
      }
    }
  }, [allReported, view]);

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
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
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

  // QR Scanning Logic
  const startScan = async () => {
    setView('SCAN');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      setError('Could not access camera');
      setView('SITES');
    }
  };

  const stopScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code) {
            stopScan();
            handleScanSuccess(code.data);
            return;
          }
        }
      }
    }
    if (view === 'SCAN') {
      requestAnimationFrame(tick);
    }
  };

  const handleScanSuccess = async (data: string) => {
    try {
      setLoading(true);
      let subsiteId = data;
      // Robustness: Handle if the QR contains a full URL instead of just the ID
      if (subsiteId.includes('/')) {
        subsiteId = subsiteId.split('/').pop() || subsiteId;
      }

      // Data is subsiteId
      const response = await API.get(`/sites/subsite/single/${subsiteId}`);
      const subsite = response.data;
      
      // Also fetch all incidents for this subsite
      const incidentsResp = await API.get(`/incidents/subsite/${subsiteId}`);
      const filteredIncidents = incidentsResp.data.filter((inc: any) => 
        isOnlineVerifier ? inc.status === 'reported' : inc.status === 'approved'
      );

      // Find the site in our current list to get the incident count
      const sites = getSitesWithIncidents();
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
      setView('SITES');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = isOnlineVerifier ? '/incidents/reported' : '/incidents/approved';
      const [incResp, histResp] = await Promise.all([
        API.get(endpoint),
        API.get('/incidents/all')
      ]);
      setAllReported(incResp.data);
      setHistory(histResp.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'verify' | 'escalate') => {
    try {
      setLoading(true);
      await API.put(`/incidents/${id}/${action}`);
      setMessage({ 
        text: `Incident ${action === 'escalate' ? 'escalated to resolver' : action + 'd'} successfully`, 
        type: action === 'reject' ? 'error' : 'success' 
      });
      
      // Go back to subsite view after action
      setSelectedIncident(null);
      setView('INCIDENTS');
      
      fetchData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err: any) {
      setMessage({ text: 'Action failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Grouping Logic
  const getSitesWithIncidents = () => {
    const sitesMap = new Map();
    allReported.forEach(inc => {
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

  const getSubsitesWithIncidents = (siteId: string) => {
    const subsitesMap = new Map();
    const siteIdStr = siteId?.toString();
    
    allReported.filter(inc => {
      const incSiteId = inc.siteId?._id || inc.siteId;
      return incSiteId?.toString() === siteIdStr;
    }).forEach(inc => {
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

  const renderSites = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {getSitesWithIncidents().map(site => (
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
            <div className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-full">
              <span className="text-xs font-black text-rose-400 tracking-widest uppercase">{site.count} Pending</span>
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">{site.name}</h3>
          <p className="text-slate-400 text-sm mb-6">Review hazards across this site's subsites.</p>
          <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
            View Subsites <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      ))}
      {getSitesWithIncidents().length === 0 && !loading && (
        <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">System Clear</h3>
          <p className="text-slate-500">All reported incidents have been processed.</p>
        </div>
      )}
    </div>
  );

  const renderSubsites = () => (
    <div className="space-y-8">
      <button 
        onClick={() => setView('SITES')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Sites
      </button>
      
      <div className="flex items-center gap-6 p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Building2 className="w-32 h-32" />
         </div>
         <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
            <Building2 className="w-10 h-10 text-white" />
         </div>
         <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Facility Overview</p>
            <h2 className="text-3xl font-black text-white tracking-tight">{selectedSite?.name}</h2>
            <p className="text-indigo-100/60 text-xs font-bold mt-1 uppercase tracking-widest">{selectedSite?.count} Pending Reported Hazards</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getSubsitesWithIncidents(selectedSite?._id).map(sub => (
          <button 
            key={sub._id}
            onClick={() => {
              setSelectedSubsite(sub);
              setView('INCIDENTS');
            }}
            className="group flex items-center gap-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 text-left hover:border-emerald-500/50 transition-all"
          >
            <div className="p-4 bg-emerald-500/10 rounded-2xl">
              <Layers className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-black text-white">{sub.name}</h4>
              <p className="text-slate-500 text-sm">{sub.count} reported hazards</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div className="space-y-8">
      <button 
        onClick={() => setView('SUBSITES')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
      >
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
               <button 
                 onClick={() => setLightboxImage(selectedSubsite?.incidents[0]?.subsiteMapImage ? `${API_URL}${selectedSubsite.incidents[0].subsiteMapImage}` : null)}
                 className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-sm"
               >
                 <Eye className="w-6 h-6 text-white" />
               </button>
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Active Subsite Monitoring</p>
               </div>
               <h2 className="text-4xl font-black text-white tracking-tight mb-2">{selectedSubsite?.name}</h2>
               <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {selectedSubsite?.count} Hazards Found</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span className="flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5" /> {selectedSite?.name}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedSubsite?.incidents.map((inc: any) => (
          <div 
            key={inc._id}
            onClick={() => {
              setSelectedIncident(inc);
              setView('DETAIL');
            }}
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
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
        <button 
          onClick={() => setView('INCIDENTS')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Incidents
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Details Column */}
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
                <span className="text-xs text-slate-500 font-bold">#{selectedIncident._id.slice(-6)}</span>
              </div>

              <h2 className="text-3xl font-black text-white mb-4">{selectedIncident.title}</h2>
              <p className="text-slate-400 leading-relaxed mb-8">{selectedIncident.description}</p>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Reported By</span>
                  <span className="text-white font-bold">{selectedIncident.createdBy?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Location</span>
                  <span className="text-white font-bold">{selectedIncident.location?.address || 'Pointed on Map'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Time</span>
                  <span className="text-white font-bold">{new Date(selectedIncident.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Verification Actions */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Verification Actions</h4>
              
              {isOnlineVerifier ? (
                <>
                  <button 
                    onClick={() => handleAction(selectedIncident._id, 'approve')}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-5 h-5" /> Approve for Ground
                  </button>
                  <button 
                    onClick={() => handleAction(selectedIncident._id, 'escalate')}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Send className="w-5 h-5" /> Send to Resolver
                  </button>
                  <button 
                    onClick={() => handleAction(selectedIncident._id, 'reject')}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-rose-500 font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <XCircle className="w-5 h-5" /> Reject Report
                  </button>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Demo Mode</span>
                    <button 
                      onClick={() => setBypassGeofence(!bypassGeofence)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        bypassGeofence ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
                      }`}
                    >
                      Bypass Geofence: {bypassGeofence ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleAction(selectedIncident._id, 'verify')}
                    disabled={!bypassGeofence && (distanceToIncident === null || distanceToIncident > 10)}
                    className={`w-full flex flex-col items-center justify-center gap-1 py-4 font-black rounded-2xl transition-all shadow-lg ${
                      bypassGeofence || (distanceToIncident !== null && distanceToIncident <= 10)
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5" /> Mark as Verified
                    </div>
                    {bypassGeofence ? (
                      <span className="text-[9px] uppercase tracking-widest text-emerald-200 animate-pulse">Demo Bypass Active</span>
                    ) : (
                      <>
                        {distanceToIncident !== null && (
                          <span className={`text-[9px] uppercase tracking-widest ${distanceToIncident <= 10 ? 'text-emerald-200' : 'text-rose-400'}`}>
                            {distanceToIncident <= 10 
                              ? `Within Range (${distanceToIncident.toFixed(1)}m)` 
                              : `Too Far (${distanceToIncident.toFixed(1)}m away)`}
                          </span>
                        )}
                        {distanceToIncident === null && (
                          <span className="text-[9px] uppercase tracking-widest text-amber-400 animate-pulse">Detecting GPS...</span>
                        )}
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleAction(selectedIncident._id, 'reject')}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-rose-500 font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <XCircle className="w-5 h-5" /> Reject Report
                  </button>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between px-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Demo Mode</span>
                    <button 
                      onClick={() => setBypassGeofence(!bypassGeofence)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                        bypassGeofence ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
                      }`}
                    >
                      Bypass Geofence: {bypassGeofence ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Evidence Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Gallery</span>
                <span className="text-[10px] font-bold text-slate-600">{(selectedIncident.images?.length || (selectedIncident.image ? 1 : 0))} Files</span>
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
                  selectedIncident.image ? (
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
                  ) : (
                    <div className="w-full h-64 flex flex-col items-center justify-center text-slate-600 bg-slate-900/50 rounded-[2.5rem] border border-white/10">
                      <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest">No Image Evidence Provided</p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl h-[400px]">
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

  const renderScan = () => (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="absolute top-8 left-8">
        <button 
          onClick={() => { stopScan(); setView('SITES'); }}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all border border-white/10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      
      <div className="w-full max-w-md aspect-square relative rounded-[3rem] overflow-hidden border-4 border-indigo-500 shadow-2xl shadow-indigo-500/20">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-3xl pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent animate-scan-line"></div>
      </div>
      
      <div className="mt-12 text-center">
        <h3 className="text-2xl font-black text-white mb-2">Scan Subsite QR</h3>
        <p className="text-slate-400 font-medium mb-8">Point your camera at a subsite QR code to see local hazards</p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all border border-white/10"
        >
          <Upload className="w-5 h-5" /> Upload QR Image
        </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8">
       <button 
        onClick={() => setView('SITES')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="overflow-hidden bg-white/5 border border-white/10 rounded-[2.5rem] shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="px-8 py-6">Incident Details</th>
              <th className="px-8 py-6">Site / Subsite</th>
              <th className="px-8 py-6">Severity</th>
              <th className="px-8 py-6">Current Status</th>
              <th className="px-8 py-6">Reported At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history
              .filter(item => item.status !== 'reported')
              .map((item) => (
              <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6">
                  <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{item.title}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">By {item.createdBy?.name}</div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-xs font-bold text-slate-300">{item.siteName}</div>
                  <div className="text-[10px] text-slate-500">{item.subsiteName || 'General'}</div>
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                    item.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    item.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'approved' ? 'bg-blue-400 animate-pulse' :
                        item.status === 'rejected' ? 'bg-rose-400' :
                        item.status === 'verified' ? 'bg-indigo-400' :
                        item.status === 'resolved' ? 'bg-emerald-400' :
                        'bg-slate-400'
                      }`} />
                      <span className={`text-xs font-bold capitalize ${
                        item.status === 'approved' ? 'text-blue-400' :
                        item.status === 'rejected' ? 'text-rose-400' :
                        item.status === 'verified' ? 'text-indigo-400' :
                        item.status === 'resolved' ? 'text-emerald-400' :
                        'text-slate-400'
                      }`}>
                        {item.status === 'verified' ? 'Escalated to Resolver' : 
                         item.status === 'approved' ? 'Approved (Ground Team)' : 
                         item.status}
                      </span>
                   </div>
                </td>
                <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.filter(item => item.status !== 'reported').length === 0 && !loading && (
          <div className="py-20 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
            No verifier actions recorded yet.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      {view !== 'SCAN' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
              {isOnlineVerifier ? (
                <><ShieldCheck className="w-10 h-10 text-blue-500" /> Online Verification</>
              ) : (
                <><ClipboardCheck className="w-10 h-10 text-emerald-500" /> Ground Verification</>
              )}
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              {isOnlineVerifier 
                ? 'Review reported hazards and determine verification workflow.' 
                : 'Complete on-site verification for approved incidents.'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!isOnlineVerifier && (view === 'SITES' || view === 'SUBSITES' || view === 'INCIDENTS') && (
              <>
                <button 
                  onClick={() => dashboardFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <QrCode className="w-4 h-4" /> Upload QR Code
                </button>
                <input 
                  type="file" 
                  ref={dashboardFileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </>
            )}
            {view === 'SITES' && (
              <button 
                onClick={() => setView('HISTORY')}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                <HistoryIcon className="w-4 h-4" /> View History
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading && !allReported.length ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Loading System Data...</p>
        </div>
      ) : (
        <div className="animate-fade-in">
          {view === 'SITES' && renderSites()}
          {view === 'SUBSITES' && renderSubsites()}
          {view === 'INCIDENTS' && renderIncidents()}
          {view === 'DETAIL' && renderDetail()}
          {view === 'HISTORY' && renderHistory()}
          {view === 'SCAN' && renderScan()}
        </div>
      )}

      {/* Toasts */}
      {message.text && (
        <div className={`fixed bottom-8 right-8 z-[2000] px-8 py-4 rounded-2xl border flex items-center gap-4 animate-fade-in-up shadow-2xl ${
          message.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 backdrop-blur-xl' 
            : 'bg-rose-500/20 border-rose-500/30 text-rose-400 backdrop-blur-xl'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-black text-xs uppercase tracking-widest">{message.text}</span>
        </div>
      )}

      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] px-8 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-2xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" /> {error}
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

export default VerificationDashboard;
