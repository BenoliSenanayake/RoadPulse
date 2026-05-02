import { useEffect, useMemo, useState } from 'react';
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import * as L from 'leaflet';
import { Link } from 'react-router-dom';
import {
    AlertCircle,
    Filter,
    HardHat,
    Layers,
    MapPin,
    Search,
    X,
    ChevronRight,
    Wrench,
    CheckCircle
} from 'lucide-react';
import { subDays, isAfter } from 'date-fns';
import { potholesApi } from '../lib/api';
import type { PotholeEvent, PotholeStatus, RepairPriority } from '../types';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName } from '../lib/provinceResolver';
import 'leaflet/dist/leaflet.css';

const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES: Array<PotholeStatus | 'All'> = ['All', 'Verified', 'In Progress', 'Completed'];

const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 16, { duration: 1.2 });
    }, [center, map]);
    return null;
};

const getMarkerIcon = (pothole: PotholeEvent) => {
    // Verified = Amber, In Progress = Blue, Completed = Emerald, Default = Slate
    const statusColor = pothole.status === 'Verified' ? '#F59E0B' 
        : pothole.status === 'In Progress' ? '#2563EB'
        : ['Completed', 'Fixed'].includes(pothole.status) ? '#10B981'
        : '#64748B';

    const html = `
        <div style="
            background-color: ${statusColor};
            width: 26px;
            height: 26px;
            border-radius: 999px;
            border: 3px solid white;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.28);
        "></div>
    `;

    return L.divIcon({
        html,
        className: 'roadpulse-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -12],
    });
};

const LiveMap = () => {
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PotholeStatus | 'All'>('All');
    const [priorityFilter, setPriorityFilter] = useState<RepairPriority | 'All'>('All');
    const [areaFilter, setAreaFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [selected, setSelected] = useState<PotholeEvent | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const loadMapData = async () => {
        setLoading(true);
        setError('');
        try {
            let data = await potholesApi.list();
            if (province && province !== 'Unassigned') {
                data = data.filter(p => p.provincialCouncil === province);
            }
            setPotholes(data);
        } catch {
            setError('Failed to load map data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMapData();
    }, [province]);

    const districts = useMemo(() => {
        const values = new Set(potholes.map(p => p.district).filter(Boolean));
        return ['All', ...Array.from(values)] as string[];
    }, [potholes]);

    const filtered = useMemo(() => {
        return potholes.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase())
                || p.roadName?.toLowerCase().includes(searchTerm.toLowerCase())
                || p.district?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const normalizedStatus = ['Fixed', 'Completed'].includes(p.status) ? 'Completed' : p.status;
            const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter;
            const matchesPriority = priorityFilter === 'All' || p.priority === priorityFilter;
            const matchesDistrict = areaFilter === 'All' || p.district === areaFilter;

            let matchesDate = true;
            const reportedDate = new Date(p.createdAt || p.timestamp);
            if (dateFilter === 'Last 24h') matchesDate = isAfter(reportedDate, subDays(new Date(), 1));
            if (dateFilter === 'Last 7 Days') matchesDate = isAfter(reportedDate, subDays(new Date(), 7));
            if (dateFilter === 'Last 30 Days') matchesDate = isAfter(reportedDate, subDays(new Date(), 30));

            return matchesSearch && matchesStatus && matchesPriority && matchesDistrict && matchesDate;
        });
    }, [potholes, searchTerm, statusFilter, priorityFilter, areaFilter, dateFilter]);

    const selectPothole = (pothole: PotholeEvent) => {
        setSelected(pothole);
        setMapCenter([pothole.lat, pothole.lon]);
    };

    const updateStatus = async (status: 'In Progress' | 'Completed') => {
        if (!selected) return;
        await potholesApi.updateStatus(selected.id, status, `Field update from live map by ${user?.name || 'officer'}.`, user?.name);
        await loadMapData();
        setSelected(prev => prev ? { ...prev, status, repairStatus: status } : prev);
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-2xl bg-white">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Initializing mapping engine</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-2xl bg-white">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-3 text-rose-500" size={32} />
                    <p className="text-sm font-bold text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative -m-6 flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden bg-slate-50 p-6 md:flex-row">
            <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto pr-1 md:flex">
                <FilterPanel
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    areaFilter={areaFilter}
                    setAreaFilter={setAreaFilter}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    districts={districts}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Stat label="Total Locations" value={filtered.length} />
                    <Stat label="Active Repairs" value={filtered.filter(p => p.status === 'In Progress').length} />
                </div>
            </aside>

            <main className="relative z-0 flex-1 overflow-hidden rounded-none bg-white shadow-2xl md:rounded-2xl border border-slate-100">
                <div className="absolute left-4 top-4 z-[1000] max-w-[calc(100%-90px)] rounded-2xl bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Provincial Live Map</p>
                        {province && province !== 'Unassigned' && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-500/30">
                                {getProvinceShortName(province)} Sector
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-black">{filtered.length} visible points</p>
                </div>

                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                    <button className="rounded-xl border border-slate-100 bg-white/90 p-3 text-slate-600 shadow-xl backdrop-blur">
                        <Layers size={18} />
                    </button>
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="rounded-xl bg-slate-900 p-3 text-white shadow-xl md:hidden"
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <MapContainer center={[6.9271, 79.8612]} zoom={11} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
                    <MapController center={mapCenter} />
                    <MarkerClusterGroup chunkedLoading spiderfyOnMaxZoom showCoverageOnHover={false} maxClusterRadius={40}>
                        {filtered.map(p => (
                            <Marker
                                key={p.id}
                                position={[p.lat, p.lon]}
                                icon={getMarkerIcon(p)}
                                eventHandlers={{ click: () => selectPothole(p) }}
                            >
                                <Popup>
                                    <div className="w-56 p-1">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{p.id.split('-')[0]}</p>
                                            <StatusPill status={p.status as any} className="scale-75 origin-right" />
                                        </div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{p.roadName || 'Road Location'}</p>
                                        <p className="mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.district} District</p>
                                        <button
                                            onClick={() => selectPothole(p)}
                                            className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/20"
                                        >
                                            Inspect Operations
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>

                {selected && (
                    <section className="absolute bottom-0 right-0 z-[2000] flex max-h-full w-full flex-col bg-white/95 shadow-[-20px_0_50px_rgba(15,23,42,0.16)] backdrop-blur md:top-0 md:w-[380px] border-l border-slate-100 animate-fade-in-right">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Operational Record</p>
                                <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">#{selected.id.split('-')[0]}</h2>
                            </div>
                            <button onClick={() => setSelected(null)} className="rounded-full bg-white p-2 text-slate-400 shadow-sm hover:text-slate-900 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto p-8 custom-scroll">
                            {selected.imageUrl && (
                                <img src={selected.imageUrl} alt="Road damage evidence" className="aspect-video w-full rounded-2xl object-cover shadow-lg" />
                            )}
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <StatusPill status={selected.status as any} />
                                    <span className={cn(
                                        'rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                                        ['High', 'Urgent'].includes(selected.priority || '') ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                                    )}>
                                        {selected.priority || 'Medium'} Priority
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-950 leading-tight">{selected.roadName || 'Provincial Road Point'}</h3>
                                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <MapPin size={14} className="text-slate-400" /> {selected.district} District
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Detail label="Discovery Date" value={new Date(selected.createdAt || selected.timestamp).toLocaleDateString()} />
                                <Detail label="GPS Lat/Lon" value={`${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)}`} />
                            </div>

                            {selected.maintenanceNotes && (
                                <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Field Maintenance Rationale</p>
                                    <p className="text-xs font-bold leading-relaxed text-slate-600 italic">"{selected.maintenanceNotes}"</p>
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => updateStatus('In Progress')} 
                                        disabled={selected.status === 'In Progress' || ['Completed', 'Fixed'].includes(selected.status)}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-40"
                                    >
                                        <Play size={14} /> Start Repair
                                    </button>
                                    <button 
                                        onClick={() => updateStatus('Completed')} 
                                        disabled={['Completed', 'Fixed'].includes(selected.status)}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                                    >
                                        <CheckCircle size={14} /> Mark Fixed
                                    </button>
                                </div>
                                <Link to={`/potholes/${selected.id}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 hover:bg-black transition-all">
                                    Open Full Records <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {isFilterDrawerOpen && (
                <div className="fixed inset-0 z-[3000] bg-slate-950/50 backdrop-blur-sm md:hidden">
                    <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
                            <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">Map Intelligence Filters</h3>
                            <button onClick={() => setIsFilterDrawerOpen(false)} className="rounded-xl bg-slate-50 p-2 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>
                        <FilterPanel
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            priorityFilter={priorityFilter}
                            setPriorityFilter={setPriorityFilter}
                            areaFilter={areaFilter}
                            setAreaFilter={setAreaFilter}
                            dateFilter={dateFilter}
                            setDateFilter={setDateFilter}
                            districts={districts}
                        />
                        <button onClick={() => setIsFilterDrawerOpen(false)} className="mt-6 w-full rounded-xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl">
                            Update View
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface FilterPanelProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: PotholeStatus | 'All';
    setStatusFilter: (value: PotholeStatus | 'All') => void;
    priorityFilter: RepairPriority | 'All';
    setPriorityFilter: (value: RepairPriority | 'All') => void;
    areaFilter: string;
    setAreaFilter: (value: string) => void;
    dateFilter: string;
    setDateFilter: (value: string) => void;
    districts: string[];
}

const FilterPanel = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    areaFilter,
    setAreaFilter,
    dateFilter,
    setDateFilter,
    districts,
}: FilterPanelProps) => (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Filter size={13} /> Geospatial Filters
        </h2>
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search location or ID..." className="w-full rounded-2xl bg-slate-50 py-3.5 pl-11 pr-4 text-xs font-bold text-slate-900 outline-none border border-transparent focus:border-slate-200 transition-all" />
            </div>
            <Select label="Status" value={statusFilter} onChange={value => setStatusFilter(value as PotholeStatus | 'All')} options={STATUSES} />
            <Select label="Priority" value={priorityFilter} onChange={value => setPriorityFilter(value as RepairPriority | 'All')} options={['All', ...PRIORITIES]} />
            <Select label="District Sector" value={areaFilter} onChange={setAreaFilter} options={districts} />
            <Select label="Discovery Timeline" value={dateFilter} onChange={setDateFilter} options={['All', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
        </div>
    </div>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
    <label className="block">
        <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</span>
        <select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-slate-200 cursor-pointer">
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-sm border border-slate-50">
        <p className="text-3xl font-black text-slate-950 tracking-tight">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="truncate text-[11px] font-black text-slate-700">{value}</p>
    </div>
);

export default LiveMap;
