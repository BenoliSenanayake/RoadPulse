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
    listPotholes
} from '../lib/api';
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
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';

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
    const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const potholes = useMemo(() => listPotholes(), []);

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
            reportsPending: filtered.filter(p => p.status === 'New').length,
            repairsScheduled: filtered.filter(p => p.status === 'Scheduled').length,
            fixed: filtered.filter(p => p.status === 'Fixed').length
        };
    }, [filtered]);

    const handleSelect = (p: PotholeEvent) => {
        setSelectedPothole(p);
        setMapCenter([p.lat, p.lon]);
        if (window.innerWidth < 768) {
            setIsBottomSheetExpanded(true);
        }
    };

    const mobileIcon = L.icon({
        iconUrl: icon,
        shadowUrl: iconShadow,
        iconSize: [35, 57],
        iconAnchor: [17, 57],
        popupAnchor: [1, -48]
    });

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 overflow-hidden -m-6 p-6 bg-slate-50 relative">
            {/* Desktop Left Panel: Advanced Filters */}
            <div className="hidden md:flex w-80 flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scroll">
                <div className="card-premium p-6 space-y-8 border-none">
                    <div>
                        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Operations Control</h2>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Locate detection ID..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deployment Area</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['All', 'New', 'Confirmed', 'Scheduled', 'Fixed'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setStatusFilter(opt)}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        statusFilter === opt
                                            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2.5 rounded-xl transition-all duration-300",
                                    showHeatmap ? "bg-orange-50 text-orange-600 shadow-inner" : "bg-slate-50 text-slate-400"
                                )}>
                                    <Flame size={16} />
                                </div>
                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Heatmap View</span>
                            </div>
                            <div
                                onClick={() => setShowHeatmap(!showHeatmap)}
                                className={cn(
                                    "w-10 h-5 rounded-full relative transition-all duration-500",
                                    showHeatmap ? "bg-orange-500" : "bg-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-500 shadow-md",
                                    showHeatmap ? "right-1" : "left-1"
                                )} />
                            </div>
                        </label>
                    </div>
                </div>

                {/* Tactical Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="card-premium p-5 bg-white border-none">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Detections</p>
                        <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{stats.total}</p>
                    </div>
                    <div className="card-premium p-5 bg-white border-none overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-700" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Active Ops</p>
                        <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{stats.repairsScheduled}</p>
                    </div>
                </div>
            </div>

            {/* Center Panel: Full Map */}
            <div className="flex-1 relative card-premium overflow-hidden border-none shadow-2xl group -m-6 md:m-0 rounded-none md:rounded-2xl z-0">
                {/* Map Overlay HUD (Desktop only or simplified on Mobile) */}
                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] flex flex-col gap-3 max-w-[calc(100%-80px)]">
                    <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-3 md:gap-4 text-white">
                        <div className="flex items-center gap-2 pr-2 md:pr-4 border-r border-white/10 shrink-0">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 hidden xs:block">Tactical Feed</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
                            <div className="flex flex-col">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Sector Active</span>
                                <span className="text-xs font-black tracking-tight whitespace-nowrap">{filtered.length} units</span>
                            </div>
                            <div className="flex flex-col hidden sm:flex">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Bandwidth</span>
                                <span className="text-xs font-black text-emerald-400 tracking-tight italic">Nominal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] flex flex-col gap-2">
                    <button className="p-2 md:p-3 bg-white/90 backdrop-blur rounded-xl md:rounded-[1.25rem] border border-slate-100 shadow-xl text-slate-600 hover:text-slate-900 transition-all">
                        <Layers size={18} />
                    </button>
                    {/* Floating Filter Button for Mobile */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="md:hidden p-2 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800"
                    >
                        <Search size={18} />
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
                                    icon={window.innerWidth < 768 ? mobileIcon : undefined}
                                    eventHandlers={{
                                        click: () => handleSelect(p)
                                    }}
                                >
                                    <Popup className="roadpulse-popup">
                                        <div className="w-48 p-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{p.id.split('-')[0]}</span>
                                                <StatusPill status={p.status as any} className="scale-75 origin-right" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 mb-3">{p.roadName || 'Unnamed Road'}</p>
                                            <Link
                                                to={`/potholes/${p.id}`}
                                                className="block w-full text-center py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-primary transition-colors"
                                            >
                                                View Details
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
                                fillColor: p.status === 'New' || p.status === 'Rejected' ? '#EF4444' :
                                    p.status === 'Confirmed' ? '#F59E0B' :
                                        p.status === 'Scheduled' ? '#A855F7' : '#10B981',
                                color: 'transparent',
                                fillOpacity: 0.3
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Desktop Right Panel: Detection Journal */}
            <div className="hidden md:flex w-96 flex-col bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden shrink-0">
                <div className="p-5 border-b border-border bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black text-text uppercase tracking-tighter">Detection Journal</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Sector 4B • Sri Lanka</p>
                    </div>
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <MousePointer2 size={16} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                    {filtered.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <EmptyState
                                title="Clear Horizon"
                                description="No telemetry data matches your filter criteria. The sector is currently nominal."
                                icon={Hash}
                            />
                        </div>
                    ) : (
                        filtered.map(p => (
                            <div
                                key={`journal-${p.id}`}
                                onClick={() => handleSelect(p)}
                                className={cn(
                                    "group cursor-pointer p-4 rounded-2xl border transition-all duration-500",
                                    selectedPothole?.id === p.id
                                        ? "bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 translate-x-1"
                                        : "bg-white border-slate-50 hover:border-slate-200"
                                )}
                            >
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative border border-slate-50">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Activity size={20} />
                                            </div>
                                        )}
                                        <div className="absolute top-1 right-1">
                                            <StatusPill status={p.status as any} hideLabel className="scale-75 shadow-lg" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className={`text-[10px] font-black truncate uppercase tracking-tighter ${selectedPothole?.id === p.id ? 'text-slate-400' : 'text-slate-900'}`}>{p.id}</h4>
                                            {p.status === 'New' && <AlertCircle size={10} className="text-blue-500 shrink-0" />}
                                        </div>
                                        <p className={`text-[11px] font-bold truncate mb-2 ${selectedPothole?.id === p.id ? 'text-white' : 'text-slate-500'}`}>{p.roadName || 'Unnamed Road'}</p>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <span className={`text-[8px] font-black uppercase ${selectedPothole?.id === p.id ? 'text-slate-400' : 'text-slate-400'}`}>{new Date(p.timestamp).toLocaleDateString()}</span>
                                            <span className="w-0.5 h-0.5 bg-slate-400 rounded-full" />
                                            <span className={`text-[8px] font-black uppercase ${selectedPothole?.id === p.id ? 'text-accent' : 'text-slate-900'}`}>{(p.confidence * 100).toFixed(0)}% Match</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedPothole && (
                    <div className="p-6 bg-slate-900 animate-in slide-in-from-bottom-full duration-700 ease-out border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Active Lock: {selectedPothole.id.split('-')[0]}</h5>
                            <button onClick={() => setSelectedPothole(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={14} className="text-slate-500 hover:text-white" />
                            </button>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex-1">
                                <p className="text-xs font-black text-white mb-1.5 truncate tracking-tight">{selectedPothole.roadName}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-slate-400 font-mono tracking-wider uppercase bg-white/5 px-2 py-0.5 rounded-sm">X:{selectedPothole.lat.toFixed(4)}</span>
                                    <span className="text-[8px] text-slate-400 font-mono tracking-wider uppercase bg-white/5 px-2 py-0.5 rounded-sm">Y:{selectedPothole.lon.toFixed(4)}</span>
                                </div>
                            </div>
                            <Link
                                to={`/potholes/${selectedPothole.id}`}
                                className="px-5 py-3 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-slate-900 transition-all shadow-lg active:scale-95"
                            >
                                Open File
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Sheet */}
            <div
                className={cn(
                    "md:hidden fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                    isBottomSheetExpanded ? "h-[80vh]" : "h-32"
                )}
            >
                {/* Drag Handle */}
                <div
                    className="w-full flex justify-center py-4 cursor-pointer"
                    onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                {!isBottomSheetExpanded ? (
                    <div className="px-6 flex items-center justify-between">
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scroll scrollbar-hide no-scrollbar">
                            <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                                <span className="text-[10px] font-black uppercase tracking-widest">New</span>
                                <span className="text-xs font-black">{stats.reportsPending}</span>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                                <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                                <span className="text-xs font-black">{stats.repairsScheduled}</span>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                                <span className="text-[10px] font-black uppercase tracking-widest">Fixed</span>
                                <span className="text-xs font-black">{stats.fixed}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsBottomSheetExpanded(true)}
                            className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20 active:scale-90 transition-all"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col p-6 pt-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Detection Journal</h2>
                            <button
                                onClick={() => setIsBottomSheetExpanded(false)}
                                className="p-2 transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pb-20 custom-scroll no-scrollbar">
                            {filtered.map(p => (
                                <div
                                    key={`mobile-journal-${p.id}`}
                                    onClick={() => handleSelect(p)}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all duration-300",
                                        selectedPothole?.id === p.id ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Activity size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-0.5 truncate">{p.id}</h4>
                                            <p className={cn("text-xs font-bold truncate", selectedPothole?.id === p.id ? "text-slate-400" : "text-slate-500")}>{p.roadName || 'Unnamed Road'}</p>
                                        </div>
                                        {selectedPothole?.id === p.id && (
                                            <Link
                                                to={`/potholes/${p.id}`}
                                                className="px-4 py-2 bg-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                            >
                                                Open
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Filter Drawer Overlay */}
            {isFilterDrawerOpen && (
                <div className="md:hidden fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-y-0 right-0 w-[80%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 p-8 flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filter HQ</h3>
                            <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 bg-slate-50 rounded-xl">
                                <X size={18} className="text-slate-900" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tactical Search</label>
                                <input
                                    type="text"
                                    placeholder="Detection ID..."
                                    className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['All', 'New', 'Confirmed', 'Scheduled', 'Fixed'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setStatusFilter(opt)}
                                            className={cn(
                                                "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                statusFilter === opt ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsFilterDrawerOpen(false)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/20"
                            >
                                Apply Parameters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default LiveMap;
