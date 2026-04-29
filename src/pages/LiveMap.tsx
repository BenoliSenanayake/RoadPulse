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
    listPotholes,
    updatePotholeStatus
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
    Hash,
    Filter,
    Calendar,
    Target,
    Zap,
    MapPin,
    CheckCircle2,
    HardHat
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { PotholeEvent } from '../types';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';
import { subDays, isAfter } from 'date-fns';

// Standard Leaflet styles
import 'leaflet/dist/leaflet.css';

// Custom Map Controller
const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 18, { duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

// Custom Marker Generator
const getMarkerIcon = (status: string) => {
    let color = '#3B82F6'; // New
    if (status === 'Confirmed') color = '#F59E0B'; // Amber
    if (status === 'Scheduled') color = '#A855F7'; // Purple
    if (status === 'Fixed') color = '#10B981'; // Emerald
    if (status === 'Rejected') color = '#EF4444'; // Red

    const html = `
        <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%; opacity: 0.5;"></div>
        </div>
    `;

    return L.divIcon({
        html,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const LiveMap = () => {
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [sourceFilter, setSourceFilter] = useState<string>('All');
    const [confidenceFilter, setConfidenceFilter] = useState<string>('All');
    const [dateFilter, setDateFilter] = useState<string>('All');

    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedPothole, setSelectedPothole] = useState<PotholeEvent | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Refresh trigger
    const [refreshTick, setRefreshTick] = useState(0);

    const rawPotholes = useMemo(() => listPotholes(), [refreshTick]);

    const filtered = useMemo(() => {
        return rawPotholes.filter(p => {
            // Search
            const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.roadName?.toLowerCase().includes(searchTerm.toLowerCase()));

            // Status
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

            // Source
            const matchesSource = sourceFilter === 'All' || (p.source || 'SYSTEM') === sourceFilter;

            // Confidence
            let matchesConf = true;
            if (confidenceFilter === 'High (>80%)') matchesConf = p.confidence >= 0.8;
            if (confidenceFilter === 'Med (50-80%)') matchesConf = p.confidence >= 0.5 && p.confidence < 0.8;
            if (confidenceFilter === 'Low (<50%)') matchesConf = p.confidence < 0.5;

            // Date
            let matchesDate = true;
            const pDate = new Date(p.createdAt || p.timestamp);
            if (dateFilter === 'Last 24h') matchesDate = isAfter(pDate, subDays(new Date(), 1));
            if (dateFilter === 'Last 7 Days') matchesDate = isAfter(pDate, subDays(new Date(), 7));
            if (dateFilter === 'Last 30 Days') matchesDate = isAfter(pDate, subDays(new Date(), 30));

            return matchesSearch && matchesStatus && matchesSource && matchesConf && matchesDate;
        });
    }, [rawPotholes, searchTerm, statusFilter, sourceFilter, confidenceFilter, dateFilter]);

    const handleSelect = (p: PotholeEvent) => {
        setSelectedPothole(p);
        setMapCenter([p.lat, p.lon]);
    };

    const handleAction = (status: 'Confirmed' | 'Scheduled') => {
        if (!selectedPothole) return;
        updatePotholeStatus(selectedPothole.id, status, `Manually marked as ${status} from Live Map`, 'Map Officer');
        setRefreshTick(prev => prev + 1);
        setSelectedPothole({ ...selectedPothole, status });
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 overflow-hidden -m-6 p-6 bg-slate-50 relative">
            
            {/* Left Panel: Advanced Filters */}
            <div className="hidden md:flex w-80 flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scroll z-10">
                <div className="card-premium p-6 space-y-8 border-none shadow-premium">
                    <div>
                        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                            <Target size={12} /> Tactical Filters
                        </h2>
                        <div className="relative group mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search IDs or locations..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-6">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Defect Status</label>
                                <select 
                                    className="w-full bg-slate-50 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
                                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Fixed">Fixed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            {/* Source Filter */}
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Origin Source</label>
                                <select 
                                    className="w-full bg-slate-50 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
                                    value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                                >
                                    <option value="All">All Sources</option>
                                    <option value="CITIZEN_REPORT">Citizen Submissions</option>
                                    <option value="SYSTEM">System / Fleet</option>
                                </select>
                            </div>

                            {/* Confidence Filter */}
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Confidence</label>
                                <select 
                                    className="w-full bg-slate-50 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
                                    value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)}
                                >
                                    <option value="All">All Confidences</option>
                                    <option value="High (>80%)">High (&gt;80%)</option>
                                    <option value="Med (50-80%)">Medium (50-80%)</option>
                                    <option value="Low (<50%)">Low (&lt;50%)</option>
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Timeframe</label>
                                <select 
                                    className="w-full bg-slate-50 text-slate-700 text-xs font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
                                    value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                                >
                                    <option value="All">All Time</option>
                                    <option value="Last 24h">Last 24 Hours</option>
                                    <option value="Last 7 Days">Last 7 Days</option>
                                    <option value="Last 30 Days">Last 30 Days</option>
                                </select>
                            </div>
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
                                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Hotspot Density</span>
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
                    <div className="card-premium p-5 bg-slate-900 border-none text-white shadow-xl shadow-slate-900/20">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Visible Units</p>
                        <p className="text-3xl font-black leading-none tracking-tighter">{filtered.length}</p>
                    </div>
                    <div className="card-premium p-5 bg-emerald-500 border-none text-white shadow-xl shadow-emerald-500/20 overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 opacity-20"><Zap size={64} /></div>
                        <p className="text-[9px] font-black text-emerald-100 uppercase tracking-tighter mb-1">Actionable</p>
                        <p className="text-3xl font-black leading-none tracking-tighter">{filtered.filter(f => f.status === 'New').length}</p>
                    </div>
                </div>
            </div>

            {/* Center Panel: Full Map */}
            <div className="flex-1 relative card-premium overflow-hidden border-none shadow-2xl group -m-6 md:m-0 rounded-none md:rounded-2xl z-0">
                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] flex flex-col gap-3 max-w-[calc(100%-80px)] pointer-events-none">
                    <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-3 md:gap-4 text-white">
                        <div className="flex items-center gap-2 pr-2 md:pr-4 border-r border-white/10 shrink-0">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 hidden xs:block">Live Telemetry</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="flex flex-col">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Filters</span>
                                <span className="text-[10px] md:text-xs font-black tracking-tight text-accent whitespace-nowrap">{statusFilter !== 'All' ? statusFilter : 'Global'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] flex flex-col gap-2">
                    <button className="p-2 md:p-3 bg-white/90 backdrop-blur rounded-xl md:rounded-[1.25rem] border border-slate-100 shadow-xl text-slate-600 hover:text-slate-900 transition-all active:scale-95">
                        <Layers size={18} />
                    </button>
                    {/* Floating Filter Button for Mobile */}
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="md:hidden p-3 bg-slate-900 text-white rounded-[1.25rem] shadow-xl border border-slate-800 active:scale-95 transition-transform"
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <MapContainer
                    center={[6.9271, 79.8612]}
                    zoom={12}
                    style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap &copy; CARTO'
                    />
                    <MapController center={mapCenter} />

                    {!showHeatmap && (
                        <MarkerClusterGroup
                            chunkedLoading
                            spiderfyOnMaxZoom
                            showCoverageOnHover={false}
                            maxClusterRadius={40}
                        >
                            {filtered.map(p => (
                                <Marker
                                    key={p.id}
                                    position={[p.lat, p.lon]}
                                    icon={getMarkerIcon(p.status)}
                                    eventHandlers={{
                                        click: () => handleSelect(p)
                                    }}
                                >
                                    <Popup className="roadpulse-popup custom-leaflet-popup">
                                        <div className="w-56 p-1">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{p.id.split('-')[0]}</span>
                                                <StatusPill status={p.status as any} className="scale-75 origin-right" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900 mb-1 leading-tight">{p.roadName || 'Unnamed Road'}</p>
                                            <div className="flex items-center gap-2 mb-4">
                                                <MapPin size={10} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-500">{p.district || 'Unknown District'}</span>
                                            </div>
                                            <button
                                                onClick={() => handleSelect(p)}
                                                className="block w-full text-center py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                                            >
                                                Inspect Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    )}

                    {/* Hotspot Simulation Layer (Grouped density circles) */}
                    {showHeatmap && filtered.map(p => (
                        <Circle
                            key={`heat-${p.id}`}
                            center={[p.lat, p.lon]}
                            radius={500} 
                            pathOptions={{
                                fillColor: p.status === 'New' || p.status === 'Rejected' ? '#EF4444' :
                                    p.status === 'Confirmed' ? '#F59E0B' :
                                        p.status === 'Scheduled' ? '#A855F7' : '#10B981',
                                color: 'transparent',
                                fillOpacity: 0.4
                            }}
                        />
                    ))}
                </MapContainer>

                {/* Selected Pothole Overlay Panel (Mobile floats, Desktop slides from right inside map) */}
                {selectedPothole && (
                    <div className="absolute bottom-0 right-0 md:top-0 md:bottom-0 w-full md:w-[380px] z-[2000] bg-white/95 backdrop-blur-xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l border-slate-100 animate-in slide-in-from-bottom md:slide-in-from-right duration-500 flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Lock</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {selectedPothole.id}</p>
                            </div>
                            <button onClick={() => setSelectedPothole(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                                <X size={16} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll">
                            {/* Image & Status */}
                            <div className="space-y-4">
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative shadow-inner">
                                    {selectedPothole.imageUrl ? (
                                        <img src={selectedPothole.imageUrl} alt="Pothole" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Activity size={32} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <StatusPill status={selectedPothole.status as any} className="shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white flex items-center gap-2">
                                        <Target size={12} className="text-accent" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{(selectedPothole.confidence * 100).toFixed(1)}% AI Conf</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Landmark</p>
                                    <p className="text-sm font-black text-slate-900 tracking-tight">{selectedPothole.roadName || 'Unknown Location'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                                        <p className="text-xs font-bold text-slate-700">{selectedPothole.source === 'CITIZEN_REPORT' ? 'Citizen' : 'Fleet Scanner'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Detected On</p>
                                        <p className="text-xs font-bold text-slate-700">{new Date(selectedPothole.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Officer Operations</h4>
                                
                                {selectedPothole.status === 'New' && (
                                    <button 
                                        onClick={() => handleAction('Confirmed')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                                    >
                                        <CheckCircle2 size={16} /> Mark Confirmed
                                    </button>
                                )}

                                {(selectedPothole.status === 'New' || selectedPothole.status === 'Confirmed') && (
                                    <button 
                                        onClick={() => handleAction('Scheduled')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-slate-900 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        <HardHat size={16} /> Schedule Repair
                                    </button>
                                )}

                                <Link 
                                    to={`/potholes/${selectedPothole.id}`}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Full Investigation File
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Filter Drawer Overlay */}
            {isFilterDrawerOpen && (
                <div className="md:hidden fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-500 p-6 flex flex-col gap-6 overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Tactical Filters</h3>
                            <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 bg-slate-50 rounded-xl active:scale-90 transition-transform">
                                <X size={18} className="text-slate-900" />
                            </button>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Search</label>
                                <input
                                    type="text"
                                    placeholder="Location or ID..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Status</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 outline-none"
                                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Fixed">Fixed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">AI Confidence</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 outline-none"
                                    value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)}
                                >
                                    <option value="All">All</option>
                                    <option value="High (>80%)">High</option>
                                    <option value="Med (50-80%)">Medium</option>
                                    <option value="Low (<50%)">Low</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Date</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 outline-none"
                                    value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                                >
                                    <option value="All">All Time</option>
                                    <option value="Last 24h">Last 24h</option>
                                    <option value="Last 7 Days">Last 7 Days</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsFilterDrawerOpen(false)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform mt-auto"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveMap;
