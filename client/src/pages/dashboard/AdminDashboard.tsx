import { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import SubsiteMap from '../../components/dashboard/SubsiteMap';
import { 
  Users, 
  Map as MapIcon, 
  Shield, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  X, 
  Upload, 
  ChevronLeft, 
  QrCode,
  MapPin,
  Activity,
  UserPlus,
  User,
  Download,
  AlertTriangle,
  Clock,
  Edit2,
  Maximize2,
  ExternalLink,
  Mail,
  Key,
  ShieldCheck
} from 'lucide-react';

type ViewType = 'LIST' | 'DETAIL';
type AssignTab = 'EXISTING' | 'NEW';

const AdminDashboard = () => {
  const [view, setView] = useState<ViewType>('LIST');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data State
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [subsites, setSubsites] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  
  // Modals
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showSubsiteModal, setShowSubsiteModal] = useState(false);
  const [showEditSiteModal, setShowEditSiteModal] = useState(false);
  const [showEditSubsiteModal, setShowEditSubsiteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [assignTab, setAssignTab] = useState<AssignTab>('EXISTING');
  const [activeSubsite, setActiveSubsite] = useState<any>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Form States
  const [newSite, setNewSite] = useState({ name: '', description: '', location: '' });
  const [newSubsite, setNewSubsite] = useState({ name: '', description: '', location: '', coordinates: [] as any[] });
  const [assignData, setAssignData] = useState({ userId: '', role: '' });
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'flagger' });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSites();
    fetchAllUsers();
  }, []);

  // UX Improvement: If there's only one site assigned to this admin, skip to detail view
  useEffect(() => {
    if (sites.length === 1 && view === 'LIST') {
      fetchSiteDetails(sites[0]._id);
    }
  }, [sites, view]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/sites');
      setSites(data);
    } catch (err) {
      showToast('Failed to fetch sites.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data } = await API.get('/users');
      setAllUsers(data);
    } catch (err) {}
  };

  const fetchSiteDetails = async (siteId: string) => {
    try {
      setLoading(true);
      const [siteResp, subsitesResp, personnelResp, incidentsResp] = await Promise.all([
        API.get(`/sites/${siteId}`),
        API.get(`/sites/subsites/${siteId}`),
        API.get(`/users/site/${siteId}`),
        API.get(`/incidents/all?siteId=${siteId}`)
      ]);
      setSelectedSite(siteResp.data);
      setSubsites(subsitesResp.data);
      setPersonnel(personnelResp.data);
      setIncidents(incidentsResp.data);
      setView('DETAIL');
    } catch (err) {
      showToast('Failed to fetch site details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return showToast('Please upload a map.', 'error');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', newSite.name);
    formData.append('description', newSite.description);
    formData.append('location', newSite.location);
    formData.append('mapImage', selectedFile);
    try {
      await API.post('/sites', formData);
      showToast('Site created successfully!', 'success');
      setShowSiteModal(false);
      resetForms();
      fetchSites();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create site.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', newSite.name);
    formData.append('description', newSite.description);
    formData.append('location', newSite.location);
    if (selectedFile) formData.append('mapImage', selectedFile);
    try {
      await API.put(`/sites/${selectedSite._id}`, formData);
      showToast('Site updated successfully!', 'success');
      setShowEditSiteModal(false);
      resetForms();
      fetchSiteDetails(selectedSite._id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update site.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!window.confirm('Are you sure you want to delete this site and all its sub-zones?')) return;
    try {
      await API.delete(`/sites/${siteId}`);
      showToast('Site removed successfully.', 'success');
      setView('LIST');
      fetchSites();
    } catch (err) {
      showToast('Failed to delete site.', 'error');
    }
  };

  const handleCreateSubsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedSite) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('siteId', selectedSite._id);
    formData.append('name', newSubsite.name);
    formData.append('description', newSubsite.description);
    formData.append('location', newSubsite.location);
    formData.append('coordinates', JSON.stringify(newSubsite.coordinates));
    formData.append('mapImage', selectedFile);
    try {
      await API.post('/sites/subsites', formData);
      showToast('Subsite created successfully!', 'success');
      setShowSubsiteModal(false);
      resetForms();
      fetchSiteDetails(selectedSite._id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create subsite.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubsite || !selectedSite) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', newSubsite.name);
    formData.append('description', newSubsite.description);
    formData.append('location', newSubsite.location);
    formData.append('coordinates', JSON.stringify(newSubsite.coordinates));
    if (selectedFile) formData.append('mapImage', selectedFile);
    try {
      await API.put(`/sites/subsites/${activeSubsite._id}`, formData);
      showToast('Subsite updated!', 'success');
      setShowEditSubsiteModal(false);
      resetForms();
      fetchSiteDetails(selectedSite._id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubsite = async (subsiteId: string) => {
    if (!window.confirm('Delete this sub-zone?')) return;
    try {
      await API.delete(`/sites/subsites/${subsiteId}`);
      showToast('Subsite removed.', 'success');
      if (selectedSite) fetchSiteDetails(selectedSite._id);
    } catch (err) {
      showToast('Failed to delete subsite.', 'error');
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;
    setSubmitting(true);
    try {
      if (assignTab === 'EXISTING') {
        if (selectedUserIds.length === 0) throw new Error('Please select at least one user');
        await API.put(`/users/bulk-assign-site`, { 
          siteId: selectedSite._id,
          userIds: selectedUserIds
        });
      } else {
        const { data: user } = await API.post('/users', {
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role
        });
        await API.put(`/users/${user._id}/assign-site`, { 
          siteId: selectedSite._id
        });
      }
      showToast('Personnel assigned successfully!', 'success');
      setShowAssignModal(false);
      setAssignData({ userId: '', role: '' });
      setSelectedRoleForAssign('');
      setSelectedUserIds([]);
      setNewUser({ name: '', email: '', password: '', role: 'flagger' });
      fetchSiteDetails(selectedSite._id);
      fetchAllUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Action failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadQR = (qrData: string, subsiteName: string) => {
    const link = document.createElement('a');
    link.href = qrData;
    link.download = `QR-${subsiteName.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForms = () => {
    setNewSite({ name: '', description: '', location: '' });
    setNewSubsite({ name: '', description: '', location: '', coordinates: [] });
    setSelectedFile(null);
    setPreviewUrl(null);
    setActiveSubsite(null);
  };

  const API_URL = 'http://localhost:5000';

  return (
    <DashboardLayout>
      {view === 'LIST' ? (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Industrial Sites</h1>
              <p className="text-slate-400 mt-2">Manage and monitor all operational facility locations.</p>
            </div>
            <button 
              onClick={() => setShowSiteModal(true)}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-5 h-5" />
              Add New Site
            </button>
          </div>

          {/* Sites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sites.map((site) => (
              <div 
                key={site._id} 
                className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/50 transition-all hover:bg-white/10"
              >
                <div className="h-48 relative overflow-hidden cursor-pointer" onClick={() => fetchSiteDetails(site._id)}>
                  <img src={`${API_URL}${site.mapImage}`} alt={site.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-6">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{site.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3 h-3" /> {site.location}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4">{site.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => { setSelectedSite(site); setNewSite({ name: site.name, description: site.description, location: site.location }); setPreviewUrl(`${API_URL}${site.mapImage}`); setShowEditSiteModal(true); }}
                        className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                    </div>
                    <button onClick={() => fetchSiteDetails(site._id)} className="text-xs font-bold text-indigo-400 group-hover:text-white transition-colors flex items-center gap-1">
                      Manage <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-12">
          {/* Detail View Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setView('LIST')}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">{selectedSite?.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-slate-400 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-indigo-500" /> {selectedSite?.location}
                  </p>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                  <p className="text-indigo-400 text-sm font-black uppercase tracking-widest">{subsites.length} Active Zones</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                onClick={() => { setNewSite({ name: selectedSite.name, description: selectedSite.description, location: selectedSite.location }); setPreviewUrl(`${API_URL}${selectedSite.mapImage}`); setShowEditSiteModal(true); }}
                className="p-4 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-2xl transition-all"
               >
                 <Edit2 className="w-5 h-5" />
               </button>
            </div>
          </div>

          {/* Top Hero Overview */}
          <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/5 blur-[120px] -z-10"></div>
             <div className="flex flex-col xl:flex-row gap-12">
               <div className="w-full xl:w-[400px] h-64 rounded-[2rem] overflow-hidden border border-white/10 shrink-0 relative group shadow-2xl">
                 <img src={`${API_URL}${selectedSite?.mapImage}`} alt={selectedSite?.name} className="w-full h-full object-cover" />
                 <button 
                   onClick={() => setLightboxImage(`${API_URL}${selectedSite?.mapImage}`)}
                   className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm"
                 >
                   <Maximize2 className="w-10 h-10" />
                 </button>
               </div>
               <div className="flex-1 space-y-6">
                 <div>
                   <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Facility Overview</h2>
                   <p className="text-xl text-slate-300 leading-relaxed font-medium">{selectedSite?.description}</p>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Staff</p>
                      <p className="text-2xl font-black text-white">{personnel.length}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hazards</p>
                      <p className="text-2xl font-black text-rose-500">{incidents.length}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sub-Zones</p>
                      <p className="text-2xl font-black text-indigo-400">{subsites.length}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-2xl font-black text-emerald-500">Active</p>
                    </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Column 1: Subsites */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <QrCode className="text-indigo-500 w-6 h-6" /> Subsite Management
                </h2>
                <button 
                  onClick={() => setShowSubsiteModal(true)}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {subsites.map((sub) => (
                  <div key={sub._id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col gap-6 group hover:border-white/20 transition-all">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 relative group/map shadow-xl">
                        <img src={`${API_URL}${sub.mapImage}`} alt={sub.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setLightboxImage(`${API_URL}${sub.mapImage}`)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/map:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white text-lg">{sub.name}</h3>
                          <div className="flex items-center gap-1">
                             <button 
                              onClick={() => { 
                                setActiveSubsite(sub); 
                                setNewSubsite({ 
                                  name: sub.name, 
                                  description: sub.description, 
                                  location: sub.location,
                                  coordinates: sub.coordinates || []
                                }); 
                                setPreviewUrl(`${API_URL}${sub.mapImage}`); 
                                setShowEditSubsiteModal(true); 
                              }}
                              className="text-slate-500 hover:text-indigo-400 p-1"
                             >
                               <Edit2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{sub.description}</p>
                      </div>
                    </div>
                    
                    {sub.coordinates && sub.coordinates.length > 0 && (
                      <div className="space-y-4">
                        <div className="rounded-2xl overflow-hidden border border-white/5 h-48 bg-slate-950 relative">
                          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Spatial Map View</span>
                          </div>
                          <SubsiteMap 
                            coordinates={sub.coordinates} 
                            readOnly={true} 
                            height="100%" 
                            imageUrl={`${API_URL}${sub.mapImage}`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {sub.coordinates.map((coord: any, i: number) => (
                            <div key={i} className="px-3 py-2 bg-white/5 border border-white/5 rounded-xl flex flex-col">
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Point {i+1}</span>
                              <span className="text-[10px] font-mono text-slate-400 truncate">{coord.lat.toFixed(4)}, {coord.lng.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg p-1">
                          <img src={sub.qrCode} alt="QR" className="w-full h-full" />
                        </div>
                        <div>
                          <p className="text-xs font-mono text-white/70">{sub._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadQR(sub.qrCode, sub.name)}
                        className="p-2 text-indigo-400 hover:text-white transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Personnel */}
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                    <Users className="text-indigo-500 w-6 h-6" /> Personnel
                  </h2>
               </div>
               
               <button 
                  onClick={() => setShowAssignModal(true)}
                  className="w-full py-6 bg-indigo-600/10 border-2 border-dashed border-indigo-600/30 rounded-[2rem] text-indigo-400 hover:bg-indigo-600/20 hover:border-indigo-600/50 transition-all flex flex-col items-center justify-center gap-3 group"
               >
                  <div className="p-3 bg-indigo-600 rounded-2xl group-hover:scale-110 transition-transform shadow-xl shadow-indigo-600/20">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-black uppercase tracking-[0.2em] text-sm">Assign or Create Role</span>
               </button>

               <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {personnel.map((user) => (
                      <div key={user._id} className="p-6 flex items-center gap-4 hover:bg-white/5 transition-all group/user">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-white/10 text-lg shadow-inner">
                          {user.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-white truncate">{user.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2 py-0.5 bg-indigo-500/10 rounded-md">
                              {user.role === 'site_admin' ? 'Manager' : user.role === 'super_admin' ? 'Director' : user.role.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!window.confirm(`Unassign ${user.name} from this site?`)) return;
                            try {
                              await API.put(`/users/${user._id}/assign-site`, { siteId: selectedSite._id, unassign: true });
                              showToast('Personnel removed from site.', 'success');
                              if (selectedSite) fetchSiteDetails(selectedSite._id);
                            } catch (err) {
                              showToast('Failed to remove personnel.', 'error');
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-rose-500 opacity-0 group-hover/user:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {personnel.length === 0 && (
                      <div className="p-16 text-center text-slate-600 text-xs font-black uppercase tracking-[0.2em]">
                        No Assigned Staff
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Column 3: Hazards */}
            <div className="space-y-8">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <AlertTriangle className="text-rose-500 w-6 h-6" /> Safety Hazards
              </h2>
              <div className="space-y-6">
                {incidents.map((inc) => (
                  <div key={inc._id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-rose-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        inc.severity === 'high' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                        inc.severity === 'medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                        'bg-blue-500 text-white'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <Clock className="w-4 h-4" /> {new Date(inc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">{inc.title}</h3>
                    
                    <div className="flex flex-wrap gap-4 mb-4 mt-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-300">{inc.createdBy?.name || 'Staff'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-bold text-slate-300">{inc.subsiteId?.name || 'General Area'}</span>
                      </div>
                    </div>

                    <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed mb-4 bg-slate-950/30 p-3 rounded-xl border border-white/5">{inc.description}</p>
                    
                    {/* Incident Image */}
                    {inc.image && (
                      <div className="mb-4 rounded-xl overflow-hidden aspect-video border border-white/10 group/img relative cursor-zoom-in" onClick={() => setLightboxImage(`${API_URL}${inc.image}`)}>
                        <img src={`${API_URL}${inc.image}`} alt="Incident" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-widest">Incident Photo</div>
                      </div>
                    )}

                    {/* Resolution Proof */}
                    {inc.status === 'resolved' && inc.resolution && (
                      <div className="mb-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" /> Resolution Proof
                        </div>
                        <p className="text-xs text-slate-300 italic">"{inc.resolution.notes}"</p>
                        {inc.resolution.image && (
                          <div className="rounded-lg overflow-hidden aspect-video border border-white/5 cursor-zoom-in" onClick={() => setLightboxImage(`${API_URL}${inc.resolution.image}`)}>
                            <img src={`${API_URL}${inc.resolution.image}`} alt="Resolution" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-5 border-t border-white/5">
                      <div className="flex items-center gap-2.5">
                         <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white border border-white/5 shadow-inner">ID</div>
                         <span className="text-xs font-bold text-slate-500">Report #{inc._id.slice(-5).toUpperCase()}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        inc.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        inc.status === 'verified' ? 'bg-indigo-500/20 text-indigo-400' :
                        inc.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        inc.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {inc.status}
                      </div>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-slate-700 text-xs font-black uppercase tracking-[0.2em]">
                    Zero Hazards
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setLightboxImage(null)}></div>
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-scale-in">
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-0 right-0 p-4 text-slate-400 hover:text-white"
            >
              <X className="w-10 h-10" />
            </button>
            <img src={lightboxImage} alt="Expanded" className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Modals remain the same but use the updated Modal component */}
      {/* Site Creation Modal */}
      {showSiteModal && (
        <Modal 
          title="Create New Site" 
          onClose={() => { setShowSiteModal(false); resetForms(); }}
          onSubmit={handleCreateSite}
          loading={submitting}
          submitText="Deploy Facility"
        >
          <div className="space-y-6">
            <FormInput label="Site Name" value={newSite.name} onChange={(val) => setNewSite({...newSite, name: val})} placeholder="e.g. North Sector Warehouse" />
            <FormInput label="Location" value={newSite.location} onChange={(val) => setNewSite({...newSite, location: val})} placeholder="City, Region" />
            <FormTextArea label="Description" value={newSite.description} onChange={(val) => setNewSite({...newSite, description: val})} placeholder="Detailed site overview..." />
            <FileUpload previewUrl={previewUrl} onFileChange={handleFileChange} onRemove={() => { setPreviewUrl(null); setSelectedFile(null); }} inputRef={fileInputRef} />
          </div>
        </Modal>
      )}

      {/* Edit Site Modal */}
      {showEditSiteModal && (
        <Modal 
          title="Edit Facility Details" 
          onClose={() => { setShowEditSiteModal(false); resetForms(); }}
          onSubmit={handleUpdateSite}
          loading={submitting}
          submitText="Update Site Info"
        >
          <div className="space-y-6">
            <FormInput label="Site Name" value={newSite.name} onChange={(val) => setNewSite({...newSite, name: val})} />
            <FormInput label="Location" value={newSite.location} onChange={(val) => setNewSite({...newSite, location: val})} />
            <FormTextArea label="Description" value={newSite.description} onChange={(val) => setNewSite({...newSite, description: val})} />
            <FileUpload previewUrl={previewUrl} onFileChange={handleFileChange} onRemove={() => { setPreviewUrl(null); setSelectedFile(null); }} inputRef={fileInputRef} />
          </div>
        </Modal>
      )}

      {/* Subsite Creation Modal */}
      {showSubsiteModal && (
        <Modal 
          title="Create Subsite" 
          onClose={() => { setShowSubsiteModal(false); resetForms(); }}
          onSubmit={handleCreateSubsite}
          loading={submitting}
          submitText="Generate Sub-Zone"
        >
          <div className="space-y-6">
            <FormInput label="Subsite Name" value={newSubsite.name} onChange={(val) => setNewSubsite({...newSubsite, name: val})} />
            <FormInput label="Location" value={newSubsite.location} onChange={(val) => setNewSubsite({...newSubsite, location: val})} />
            <FormTextArea label="Description" value={newSubsite.description} onChange={(val) => setNewSubsite({...newSubsite, description: val})} placeholder="Detailed subsite overview..." />
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Define Subsite Area</label>
              <SubsiteMap 
                coordinates={newSubsite.coordinates} 
                onChange={(coords) => setNewSubsite({...newSubsite, coordinates: coords})} 
                imageUrl={previewUrl}
              />
            </div>

            <FileUpload previewUrl={previewUrl} onFileChange={handleFileChange} onRemove={() => { setPreviewUrl(null); setSelectedFile(null); }} inputRef={fileInputRef} />
          </div>
        </Modal>
      )}

      {/* Edit Subsite Modal */}
      {showEditSubsiteModal && (
        <Modal 
          title="Edit Sub-Zone" 
          onClose={() => { setShowEditSubsiteModal(false); resetForms(); }}
          onSubmit={handleUpdateSubsite}
          loading={submitting}
          submitText="Save Changes"
        >
          <div className="space-y-6">
            <FormInput label="Subsite Name" value={newSubsite.name} onChange={(val) => setNewSubsite({...newSubsite, name: val})} />
            <FormInput label="Location" value={newSubsite.location} onChange={(val) => setNewSubsite({...newSubsite, location: val})} />
            <FormTextArea label="Description" value={newSubsite.description} onChange={(val) => setNewSubsite({...newSubsite, description: val})} />
            
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Modify Subsite Area</label>
              <SubsiteMap 
                coordinates={newSubsite.coordinates} 
                onChange={(coords) => setNewSubsite({...newSubsite, coordinates: coords})} 
                imageUrl={previewUrl}
              />
            </div>

            <FileUpload previewUrl={previewUrl} onFileChange={handleFileChange} onRemove={() => { setPreviewUrl(null); setSelectedFile(null); }} inputRef={fileInputRef} />
          </div>
        </Modal>
      )}

      {/* Assign User Modal */}
      {showAssignModal && (
        <Modal 
          title="Authorize Personnel" 
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleAssignUser}
          loading={submitting}
          submitText={assignTab === 'EXISTING' ? "Confirm Placement" : "Create & Authorize"}
        >
          <div className="space-y-6">
            <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-white/5">
              <button 
                type="button"
                onClick={() => setAssignTab('EXISTING')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${assignTab === 'EXISTING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                Existing Staff
              </button>
              <button 
                type="button"
                onClick={() => setAssignTab('NEW')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${assignTab === 'NEW' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                New Account
              </button>
            </div>

            {assignTab === 'EXISTING' ? (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">1. Select Role</label>
                  <select 
                    value={selectedRoleForAssign}
                    onChange={(e) => {
                      setSelectedRoleForAssign(e.target.value);
                      setSelectedUserIds([]); // Reset selection when role changes
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 transition-all outline-none"
                    required
                  >
                    <option value="" className="bg-slate-900 text-white">Choose Role...</option>
                    <option value="flagger" className="bg-slate-900 text-white">Flagger</option>
                    <option value="online_verifier" className="bg-slate-900 text-white">Online Verifier</option>
                    <option value="ground_verifier" className="bg-slate-900 text-white">Ground Verifier</option>
                    <option value="resolver" className="bg-slate-900 text-white">Resolver</option>
                  </select>
                </div>

                {selectedRoleForAssign && (
                  <div className="space-y-3 animate-fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">2. Select Personnel ({selectedUserIds.length} selected)</label>
                    <div className="max-h-[300px] overflow-y-auto border border-white/10 rounded-2xl bg-slate-950/50 custom-scrollbar">
                      <div className="divide-y divide-white/5">
                        {allUsers.filter(u => u.role === selectedRoleForAssign).map(u => (
                          <label key={u._id} className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors group">
                            <div className="relative flex items-center justify-center w-5 h-5">
                              <input 
                                type="checkbox" 
                                checked={selectedUserIds.includes(u._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds([...selectedUserIds, u._id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter(id => id !== u._id));
                                  }
                                }}
                                className="peer appearance-none w-5 h-5 border border-white/20 rounded-lg bg-white/5 checked:bg-indigo-600 checked:border-indigo-600 transition-all" 
                              />
                              <CheckCircle className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                            </div>
                          </label>
                        ))}
                        {allUsers.filter(u => u.role === selectedRoleForAssign).length === 0 && (
                          <div className="p-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
                            No users found with this role
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <FormInput 
                  label="Full Name" 
                  value={newUser.name} 
                  onChange={(val) => setNewUser({...newUser, name: val})} 
                  placeholder="Employee Name" 
                  Icon={Users}
                />
                <FormInput 
                  label="Gmail Address" 
                  type="email"
                  value={newUser.email} 
                  onChange={(val) => setNewUser({...newUser, email: val})} 
                  placeholder="example@gmail.com" 
                  Icon={Mail}
                />
                <FormInput 
                  label="Default Password" 
                  type="text"
                  value={newUser.password} 
                  onChange={(val) => setNewUser({...newUser, password: val})} 
                  placeholder="Set initial password" 
                  Icon={Key}
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Assigned Role</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-indigo-500 transition-all outline-none"
                    >
                      <option value="flagger" className="bg-slate-900 text-white">Flagger</option>
                      <option value="online_verifier" className="bg-slate-900 text-white">Online Verifier</option>
                      <option value="ground_verifier" className="bg-slate-900 text-white">Ground Verifier</option>
                      <option value="resolver" className="bg-slate-900 text-white">Resolver</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in-up border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <p className="font-bold text-sm">{message.text}</p>
        </div>
      )}
    </DashboardLayout>
  );
};

// Reusable Components
const Modal = ({ title, children, onClose, onSubmit, loading, submitText }: any) => (
  <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
    <div className="flex min-h-screen items-start justify-center p-4 sm:p-6 md:pt-20 pb-20">
      <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-scale-in flex flex-col">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900 rounded-t-[2.5rem]">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="space-y-6">
            {children}
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : submitText}
          </button>
        </form>
      </div>
    </div>
  </div>
);

const FormInput = ({ label, value, onChange, type = 'text', placeholder, Icon }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
      <input 
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-600 focus:border-indigo-500 transition-all outline-none ${Icon ? 'pl-12' : ''}`}
      />
    </div>
  </div>
);

const FormTextArea = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
    <textarea 
      required
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-600 focus:border-indigo-500 transition-all outline-none resize-none"
    />
  </div>
);

const FileUpload = ({ previewUrl, onFileChange, onRemove, inputRef }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Blueprint / Map Image</label>
    {!previewUrl ? (
      <div 
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
      >
        <Upload className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 mb-2 transition-colors" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select Image</p>
      </div>
    ) : (
      <div className="relative rounded-2xl overflow-hidden max-h-48 border border-white/10 group">
        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-slate-950" />
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button type="button" onClick={onRemove} className="p-3 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform"><X /></button>
        </div>
      </div>
    )}
    <input type="file" ref={inputRef} onChange={onFileChange} className="hidden" accept="image/*" />
  </div>
);

export default AdminDashboard;
