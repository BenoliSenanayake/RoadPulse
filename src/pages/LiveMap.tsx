import { useState, useMemo, useEffect } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    Circle
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import * as L from 'leaflet';
import {
    getPotholes
} from '../mockData';
import {
    Search,
    Layers,
    Maximize2,
    Activity,
    Flame,
    MousePointer2,
    X,
    AlertCircle,
    Hash
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { PotholeEvent } from '../types';

// Standard Leaflet styles
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to programmatically fly map
const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 18, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

const LiveMap = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedPothole, setSelectedPothole] = useState<PotholeEvent | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

    const potholes = useMemo(() => getPotholes(), []);

    const filtered = useMemo(() => {
        return potholes.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.roadName?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [potholes, searchTerm, statusFilter]);

    // Statistics for the sidebar
    const stats = useMemo(() => {
        return {
            total: filtered.length,
            highSeverity: filtered.filter(p => p.severity === 'High').length,
            new: filtered.filter(p => p.status === 'New').length
        };
    }, [filtered]);

    const handleSelect = (p: PotholeEvent) => {
        setSelectedPothole(p);
        setMapCenter([p.lat, p.lon]);
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4 overflow-hidden -m-6 p-6 bg-[#F1F3F6]">
            {/* Left Panel: Advanced Filters */}
            <div className="w-full md:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
                <div className="card p-5 space-y-6">
                    <div>
                        <h2 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-4">Workspace Filters</h2>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search detections..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filter by State</label>
                        <div className="flex flex-wrap gap-2">
                            {['All', 'New', 'Confirmed', 'Scheduled', 'Fixed'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setStatusFilter(opt)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                        statusFilter === opt
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-white border-border text-gray-600 hover:border-gray-400"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    showHeatmap ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"
                                )}>
                                    <Flame size={18} />
                                </div>
                                <span className="text-sm font-bold text-gray-700">Heatmap Mode</span>
                            </div>
                            <div
                                onClick={() => setShowHeatmap(!showHeatmap)}
                                className={cn(
                                    "w-10 h-5 rounded-full relative transition-colors",
                                    showHeatmap ? "bg-orange-500" : "bg-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                    showHeatmap ? "right-1" : "left-1"
                                )} />
                            </div>
                        </label>
                    </div>
                </div>

                {/* Tactical Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="card p-4 bg-white border-l-4 border-l-primary">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total</p>
                        <p className="text-xl font-black text-text">{stats.total}</p>
                    </div>
                    <div className="card p-4 bg-white border-l-4 border-l-red-500">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Severe</p>
                        <p className="text-xl font-black text-text">{stats.highSeverity}</p>
                    </div>
                </div>
            </div>

            {/* Center Panel: Full Map */}
            <div className="flex-1 relative card overflow-hidden border-none shadow-xl group">
                {/* Map Overlay HUD */}
                <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-border shadow-sm flex items-center gap-3">
                        <div className="flex items-center gap-2 pr-3 border-r border-border">
                            <Activity size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-gray-600">Live Telemetry</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase">Visible</span>
                                <span className="text-xs font-black">{filtered.length}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-gray-400 uppercase">Signal</span>
                                <span className="text-xs font-black text-emerald-500 uppercase tracking-tighter italic">Optimal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <button className="p-2 bg-white/90 backdrop-blur rounded-lg border border-border shadow-sm text-gray-600 hover:text-primary transition-all">
                        <Layers size={18} />
                    </button>
                    <button className="p-2 bg-white/90 backdrop-blur rounded-lg border border-border shadow-sm text-gray-600 hover:text-primary transition-all">
                        <Maximize2 size={18} />
                    </button>
                </div>

                <MapContainer
                    center={[6.9271, 79.8612]}
                    zoom={11}
                    style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap &copy; CARTO'
                    />

                    <MapController center={mapCenter} />

                    {/* Clustering Logic */}
                    {!showHeatmap && (
                        <MarkerClusterGroup
                            chunkedLoading
                            spiderfyOnMaxZoom
                            showCoverageOnHover={false}
                        >
                            {filtered.map(p => (
                                <Marker
                                    key={p.id}
                                    position={[p.lat, p.lon]}
                                    eventHandlers={{
                                        click: () => handleSelect(p)
                                    }}
                                >
                                    <Popup className="roadpulse-popup">
                                        <div className="w-48 p-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-primary uppercase">{p.id}</span>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase",
                                                    p.severity === 'High' ? 'bg-red-500' : 'bg-primary'
                                                )}>{p.severity}</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 mb-3">{p.roadName || 'Unnamed Road'}</p>
                                            <Link
                                                to={`/potholes/${p.id}`}
                                                className="block w-full text-center py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-primary transition-colors"
                                            >
                                                Inspection File
                                            </Link>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    )}

                    {/* Heatmap Simulation Layer */}
                    {showHeatmap && filtered.map(p => (
                        <Circle
                            key={`heat-${p.id}`}
                            center={[p.lat, p.lon]}
                            radius={400} // meters
                            pathOptions={{
                                fillColor: p.severity === 'High' ? '#EF4444' : '#F59E0B',
                                color: 'transparent',
                                fillOpacity: 0.3
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Right Panel: Detection Journal */}
            <div className="w-full md:w-96 flex flex-col bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden shrink-0">
                <div className="p-5 border-b border-border bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black text-text uppercase tracking-tighter">Detection Journal</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Sector 4B • Sri Lanka</p>
                    </div>
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <MousePointer2 size={16} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                                <Hash size={32} />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Clear Horizon</p>
                            <p className="text-[10px] text-gray-400">No telemetry data matches your filter criteria</p>
                        </div>
                    ) : (
                        filtered.map(p => (
                            <div
                                key={`journal-${p.id}`}
                                onClick={() => handleSelect(p)}
                                className={cn(
                                    "group cursor-pointer p-4 rounded-2xl border transition-all duration-300",
                                    selectedPothole?.id === p.id
                                        ? "bg-primary/5 border-primary shadow-sm"
                                        : "bg-white border-transparent hover:border-gray-200"
                                )}
                            >
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Activity size={24} />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "absolute top-1 right-1 w-2 h-2 rounded-full",
                                            p.status === 'New' ? 'bg-blue-600' :
                                                p.status === 'Confirmed' ? 'bg-amber-500' :
                                                    p.status === 'Scheduled' ? 'bg-purple-500' :
                                                        p.status === 'Fixed' ? 'bg-emerald-600' : 'bg-red-500'
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="text-xs font-black text-text truncate uppercase tracking-tighter">{p.id}</h4>
                                            {p.severity === 'High' && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 truncate mb-2">{p.roadName || 'Unnamed Road'}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(p.timestamp).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className="text-[9px] font-black text-primary uppercase">{(p.confidence * 100).toFixed(0)}% Conf.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedPothole && (
                    <div className="p-4 bg-gray-900 animate-in slide-in-from-bottom duration-500">
                        <div className="flex items-center justify-between mb-3 text-white">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Tactical Lock On</h5>
                            <button onClick={() => setSelectedPothole(null)}>
                                <X size={14} className="text-gray-500 hover:text-white" />
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white mb-1 truncate">{selectedPothole.roadName}</p>
                                <p className="text-[10px] text-gray-400 font-mono">L:{selectedPothole.lat.toFixed(4)} G:{selectedPothole.lon.toFixed(4)}</p>
                            </div>
                            <Link
                                to={`/potholes/${selectedPothole.id}`}
                                className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg hover:bg-white hover:text-primary transition-all"
                            >
                                Open File
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveMap;
