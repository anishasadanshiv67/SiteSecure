import React from 'react';
import { Clock, AlertCircle, CheckCircle2, MoreVertical, MapPin, Trash2, Edit3, Navigation } from 'lucide-react';

interface IncidentCardProps {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Reported' | 'Verified' | 'Resolved' | 'Approved' | 'Rejected' | 'Closed';
  date: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
    x?: number;
    y?: number;
  };
  image?: string;
  images?: string[];
  resolution?: {
    notes: string;
    image?: string;
    images?: string[];
    resolvedAt: string;
  };
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onImageClick?: (url: string) => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ 
  id, title, description, severity, status, date, location, resolution, image, images, onDelete, onEdit, onImageClick 
}) => {
  const severityColors = {
    High: 'bg-red-500/10 text-red-400 border-red-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const currentSeverityColor = severityColors[severity] || severityColors.Low;


  const statusIcons = {
    Reported: <Clock className="w-3.5 h-3.5" />,
    Verified: <AlertCircle className="w-3.5 h-3.5" />,
    Resolved: <CheckCircle2 className="w-3.5 h-3.5" />,
    Approved: <CheckCircle2 className="w-3.5 h-3.5" />,
    Rejected: <AlertCircle className="w-3.5 h-3.5" />,
    Closed: <CheckCircle2 className="w-3.5 h-3.5" />,
  };

  const statusColors = {
    Reported: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Verified: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    Closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const currentStatusColor = statusColors[status] || statusColors.Reported;
  const currentStatusIcon = statusIcons[status] || statusIcons.Reported;

  const API_URL = 'http://localhost:5000';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-lg ${currentSeverityColor}`}>
              {severity} SEVERITY
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${currentStatusColor}`}>
              {currentStatusIcon}
              {status}
            </span>
          </div>
          <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h4>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button 
              onClick={() => onEdit(id)}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
              title="Edit Report"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(id)}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Delete Report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">
        {description}
      </p>

      {location && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
           <Navigation className="w-4 h-4 text-indigo-400" />
           <div className="flex gap-4 text-[10px] font-mono text-slate-400 font-bold">
              <div className="flex gap-1.5">
                 <span className="text-indigo-400/50">LAT</span>
                 <span>{location.lat ? location.lat.toFixed(6) : '0.000000'}</span>
              </div>
              <div className="flex gap-1.5">
                 <span className="text-indigo-400/50">LNG</span>
                 <span>{location.lng ? location.lng.toFixed(6) : '0.000000'}</span>
              </div>
           </div>
        </div>
      )}

      {(image || (images && images.length > 0)) && (
        <div className="mb-6 space-y-2">
           <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Photos</span>
              <span className="text-[10px] font-bold text-slate-600">{images ? images.length : 1} File(s)</span>
           </div>
           <div className={`grid gap-2 ${images && images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {images && images.length > 0 ? (
                images.map((img, idx) => (
                  <div 
                    key={idx}
                    className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 group/evidence cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.(`${API_URL}${img}`);
                    }}
                  >
                    <img 
                      src={`${API_URL}${img}`} 
                      alt="Evidence" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/evidence:scale-110"
                    />
                  </div>
                ))
              ) : (
                image && (
                  <div 
                    className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 group/evidence cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.(`${API_URL}${image}`);
                    }}
                  >
                    <img 
                      src={`${API_URL}${image}`} 
                      alt="Evidence" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/evidence:scale-110"
                    />
                  </div>
                )
              )}
           </div>
        </div>
      )}

      {resolution && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
             <CheckCircle2 className="w-3 h-3" /> Resolution Proof
          </div>
          <p className="text-xs text-slate-300 italic">"{resolution.notes}"</p>
          {(resolution.image || (resolution.images && resolution.images.length > 0)) && (
            <div className={`grid gap-2 ${resolution.images && resolution.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {resolution.images && resolution.images.length > 0 ? (
                resolution.images.map((img, idx) => (
                  <div 
                    key={idx}
                    className="relative rounded-lg overflow-hidden aspect-video border border-white/10 group/img cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.(`${API_URL}${img}`);
                    }}
                  >
                    <img 
                      src={`${API_URL}${img}`} 
                      alt={`Resolution Proof ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                    />
                  </div>
                ))
              ) : (
                resolution.image && (
                  <div 
                    className="relative rounded-lg overflow-hidden aspect-video border border-white/10 group/img cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.(`${API_URL}${resolution.image}`);
                    }}
                  >
                    <img 
                      src={`${API_URL}${resolution.image}`} 
                      alt="Resolution Proof" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                    />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {date}
          </div>
          {location && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {location.address}
            </div>
          )}
        </div>
        <button className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 hover:text-white transition-all">
          Details
        </button>
      </div>
    </div>
  );
};

export default IncidentCard;
