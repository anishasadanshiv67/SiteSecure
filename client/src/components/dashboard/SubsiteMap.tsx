import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  useMapEvents,
  ImageOverlay,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MousePointer2, Trash2, Crosshair, AlertTriangle } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Coordinate {
  lat: number;
  lng: number;
  x: number;
  y: number;
}

interface SubsiteMapProps {
  coordinates?: Coordinate[];
  onChange?: (coords: Coordinate[]) => void;
  readOnly?: boolean;
  imageUrl?: string | null;
  height?: string;
  existingIncidents?: any[];
  singlePoint?: boolean;
}

const MapEvents = ({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) => {
  useMapEvents({ click: onClick });
  return null;
};

const ChangeView = ({ points }: { points: Coordinate[] }) => {
  const map = useMap();

  useEffect(() => {
    // Ensure Leaflet handles the container size correctly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (points.length > 0) {
      // Filter points that have visual coordinates
      const validPoints = points.filter(p => typeof p.x === 'number' && typeof p.y === 'number');
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.y, p.x]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 1 });
      }
    }
  }, [points, map]);
  return null;
};

const SubsiteMap: React.FC<SubsiteMapProps> = ({
  coordinates = [],
  onChange,
  readOnly = false,
  imageUrl,
  height = '400px',
  existingIncidents = [],
  singlePoint = false
}) => {
  const [points, setPoints] = useState<Coordinate[]>(coordinates || []);
  const [activePoint, setActivePoint] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (coordinates) setPoints(coordinates);
  }, [coordinates]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (readOnly) return;
    if (singlePoint && points.length >= 1) return; // Only one chance to point
    if (!singlePoint && points.length >= 4) return;
    setActivePoint({ x: e.latlng.lng, y: e.latlng.lat });
  };

  const handleAddPoint = (newPoint: Coordinate) => {
    const updatedPoints = singlePoint ? [newPoint] : [...points, newPoint];
    setPoints(updatedPoints);
    setActivePoint(null);
    if (onChange) onChange(updatedPoints);
  };

  const clearPoints = () => {
    setPoints([]);
    if (onChange) onChange([]);
  };

  const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];
  const polygonPositions = points
    .filter(p => typeof p.x === 'number' && typeof p.y === 'number')
    .map(p => [p.y, p.x] as [number, number]);

  return (
    <div className="space-y-4 animate-fade-in" style={{ height }}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
        {!imageUrl && (
          <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm text-slate-500 text-xs font-black uppercase tracking-widest p-12 text-center">
            Upload a Subsite Map image above to enable area selection
          </div>
        )}

        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          center={[500, 500]}
          zoom={0}
          minZoom={-5}
          style={{ height: '100%', width: '100%', background: 'transparent' }}
          attributionControl={false}
        >
          {imageUrl && <ImageOverlay url={imageUrl} bounds={bounds} />}
          {!readOnly && <MapEvents onClick={handleMapClick} />}
          <ChangeView points={points} />

          {points.filter(p => typeof p.x === 'number').map((point, idx) => (
            <Marker key={idx} position={[point.y, point.x]}>
              <Popup>
                <div className="p-2 min-w-[150px] bg-white rounded-lg">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Selection</p>
                  <p className="text-xs font-bold text-slate-700">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {existingIncidents.map((inc, idx) => (
            inc.location?.x && (
              <Marker
                key={`inc-${idx}`}
                position={[inc.location.y, inc.location.x]}
                icon={L.divIcon({
                  html: `<div class="p-1 bg-rose-500 rounded-full border-2 border-white shadow-lg animate-bounce-subtle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>`,
                  className: '',
                  iconSize: [20, 20]
                })}
              >
                <Popup>
                  <div className="p-3 min-w-[180px] bg-white rounded-xl shadow-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-rose-100 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Active Hazard</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 mb-1">{inc.title}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{inc.description}</p>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${inc.severity === 'high' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{inc.severity}</span>
                      <span className="text-[8px] font-bold text-slate-400">{new Date(inc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {activePoint && !readOnly && (
            <Popup
              position={[activePoint.y, activePoint.x]}
              eventHandlers={{
                remove: () => setActivePoint(null)
              }}
              className="custom-popup"
            >
              <PopupForm
                activePoint={activePoint}
                onConfirm={handleAddPoint}
                onCancel={() => setActivePoint(null)}
                pointsCount={points.length}
              />
            </Popup>
          )}

          {!singlePoint && points.length >= 3 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: '#6366f1',
                fillColor: '#6366f1',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '4, 8'
              }}
            />
          )}
        </MapContainer>

        {/* Overlay Instructions - Moved to Bottom Right and made smaller */}
        {!readOnly && !singlePoint && points.length < 4 && (
          <div className="absolute bottom-4 left-4 z-[1000] px-3 py-2 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2 shadow-2xl animate-bounce-subtle">
            <MousePointer2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              Mark {4 - points.length} more points
            </span>
          </div>
        )}

        {/* Clear Button */}
        {!readOnly && points.length > 0 && (
          <button
            type="button"
            onClick={clearPoints}
            className="absolute bottom-4 right-4 z-[1000] p-3 bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl shadow-lg hover:bg-rose-500 hover:text-white transition-all backdrop-blur-md"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Internal component to handle local form state and prevent focus loss
const PopupForm = ({ activePoint, onConfirm, onCancel, pointsCount }: any) => {
  const [manualInput, setManualInput] = useState({ lat: '', lng: '' });
  const [detecting, setDetecting] = useState(false);

  const autoDetectGPS = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setManualInput({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString()
        });
        setDetecting(false);
      },
      () => {
        alert("Location access denied");
        setDetecting(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualInput.lat);
    const lng = parseFloat(manualInput.lng);
    if (isNaN(lat) || isNaN(lng)) return alert("Valid coordinates required");
    onConfirm({ ...activePoint, lat, lng });
  };

  return (
    <div className="p-4 w-64 bg-slate-900 text-white rounded-xl space-y-4 shadow-2xl border border-white/5">
      <div className="flex items-center justify-between">
        <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-400">Mark Point {pointsCount + 1}</h4>
        <button onClick={onCancel} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={autoDetectGPS}
          disabled={detecting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
        >
          {detecting ? "Detecting..." : <><Crosshair className="w-3.5 h-3.5" /> Auto Detect GPS</>}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Latitude</label>
            <input
              autoFocus
              type="text"
              value={manualInput.lat}
              onChange={(e) => setManualInput({ ...manualInput, lat: e.target.value })}
              placeholder="0.0000"
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Longitude</label>
            <input
              type="text"
              value={manualInput.lng}
              onChange={(e) => setManualInput({ ...manualInput, lng: e.target.value })}
              placeholder="0.0000"
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
        >
          Save Coordinate
        </button>
      </div>
    </div>
  );
};

export default SubsiteMap;
