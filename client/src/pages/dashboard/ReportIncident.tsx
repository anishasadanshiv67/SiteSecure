import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import API from '../../utils/api';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { AlertTriangle, Send, Loader2, CheckCircle, MapPin, MousePointer2, ChevronLeft } from 'lucide-react';

// Fix for default marker icons in Leaflet
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

const ReportIncident: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'low',
    location: ''
  });
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    setLoading(true);
    try {
      await API.post('/incidents', {
        ...formData,
        lat: position.lat,
        lng: position.lng
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/flagger');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-10 space-y-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <MapPin className="text-blue-500" /> Report New Incident
          </h1>
          <p className="text-slate-400 mt-1">
            Precisely pinpoint the safety hazard on the map for our verification team.
          </p>
        </div>
      </div>

      <div className="max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group h-fit">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Report Submitted!</h2>
              <p className="text-slate-400">Your incident has been logged successfully. Redirecting...</p>
            </div>
          ) : (
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1 uppercase tracking-widest">Incident Title</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Structural Crack in Pillar" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1 uppercase tracking-widest">Severity</label>
                    <div className="relative">
                      <select 
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1 uppercase tracking-widest">Location Name</label>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Main Hallway" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 ml-1 uppercase tracking-widest">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the nature of the hazard..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                ></textarea>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Submit Incident Report
                      <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Map Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl h-[500px]">
            <MapContainer 
              center={[18.5204, 73.8567]} 
              zoom={13} 
              className="w-full h-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            
            {!position && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-none flex flex-col items-center justify-center text-center p-6">
                <MousePointer2 className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-2">Pinpoint Location</h3>
                <p className="text-slate-400 text-sm max-w-xs">Click anywhere on the map to set the exact coordinates of the incident.</p>
              </div>
            )}
            
            {position && (
              <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl z-[1000] animate-fade-in-up">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white">COORDINATES CAPTURED</p>
                    <p className="font-mono text-slate-500">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
            <p className="text-sm text-blue-300 leading-relaxed">
              <strong>Tip:</strong> You can zoom in and out of the map for better accuracy. Accurate location data helps our resolvers find the hazard faster in complex site environments.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportIncident;
