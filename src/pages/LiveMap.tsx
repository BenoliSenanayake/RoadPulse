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
    X
} from 'lucide-react';
import { subDays, isAfter } from 'date-fns';
import { potholesApi } from '../lib/api';
import type { PotholeEvent, PotholeStatus, RepairPriority, RepairTeam } from '../types';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import 'leaflet/dist/leaflet.css';

const TEAMS: RepairTeam[] = ['Team A', 'Team B', 'Team C', 'Emergency Team'];
const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES: Array<PotholeStatus | 'All'> = ['All', 'New', 'Verified', 'Scheduled', 'In Progress', 'Completed', 'Unable to Repair'];

const MapController = ({ center }: { center: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 16, { duration: 1.2 });
    }, [center, map]);
    return null;
};

const getMarkerIcon = (pothole: PotholeEvent) => {
    const priorityColor = pothole.priority === 'Urgent' ? '#DC2626'
        : pothole.priority === 'High' ? '#F97316'
            : pothole.priority === 'Medium' ? '#F59E0B'
                : '#10B981';

    const html = `
        <div style="
            background-color: ${priorityColor};
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
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PotholeStatus | 'All'>('All');
    const [priorityFilter, setPriorityFilter] = useState<RepairPriority | 'All'>('All');
    const [areaFilter, setAreaFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [teamFilter, setTeamFilter] = useState<RepairTeam | 'Unassigned' | 'All'>('All');
    const [selected, setSelected] = useState<PotholeEvent | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const loadMapData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await potholesApi.list();
            setPotholes(data);
        } catch {
            setError('Failed to load map data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMapData();
    }, []);

    const areas = useMemo(() => {
        const values = new Set(potholes.map(p => p.district).filter(Boolean));
        return ['All', ...Array.from(values)] as string[];
    }, [potholes]);

    const filtered = useMemo(() => {
        return potholes.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase())
                || p.roadName?.toLowerCase().includes(searchTerm.toLowerCase())
                || p.district?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            const matchesPriority = priorityFilter === 'All' || p.priority === priorityFilter;
            const matchesArea = areaFilter === 'All' || p.district === areaFilter;
            const matchesTeam = teamFilter === 'All'
                || (teamFilter === 'Unassigned' ? !p.assignedTeam : p.assignedTeam === teamFilter);

            let matchesDate = true;
            const reportedDate = new Date(p.createdAt || p.timestamp);
            if (dateFilter === 'Last 24h') matchesDate = isAfter(reportedDate, subDays(new Date(), 1));
            if (dateFilter === 'Last 7 Days') matchesDate = isAfter(reportedDate, subDays(new Date(), 7));
            if (dateFilter === 'Last 30 Days') matchesDate = isAfter(reportedDate, subDays(new Date(), 30));

            return matchesSearch && matchesStatus && matchesPriority && matchesArea && matchesTeam && matchesDate;
        });
    }, [potholes, searchTerm, statusFilter, priorityFilter, areaFilter, teamFilter, dateFilter]);

    const selectPothole = (pothole: PotholeEvent) => {
        setSelected(pothole);
        setMapCenter([pothole.lat, pothole.lon]);
    };

    const scheduleFromMap = async () => {
        if (!selected) return;
        const scheduledDate = selected.scheduledDate || new Date().toISOString();
        await potholesApi.scheduleRepair(selected.id, {
            priority: selected.priority || 'Medium',
            assignedTeam: selected.assignedTeam || 'Team A',
            scheduledDate,
            maintenanceNotes: selected.maintenanceNotes || 'Scheduled from live map.',
            repairStatus: 'Scheduled',
        }, 'Maintenance Officer');
        await loadMapData();
        setSelected(prev => prev ? { ...prev, status: 'Scheduled', assignedTeam: prev.assignedTeam || 'Team A', scheduledDate } : prev);
    };

    const updateStatus = async (status: 'In Progress' | 'Completed') => {
        if (!selected) return;
        await potholesApi.updateStatus(selected.id, status, status === 'In Progress' ? 'Work started from map.' : 'Work completed from map.', 'Maintenance Officer');
        await loadMapData();
        setSelected(prev => prev ? { ...prev, status, repairStatus: status === 'Completed' ? 'Completed' : 'In Progress' } : prev);
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-2xl bg-white">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading repair map</p>
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
                    teamFilter={teamFilter}
                    setTeamFilter={setTeamFilter}
                    areas={areas}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Stat label="Visible" value={filtered.length} />
                    <Stat label="Unassigned" value={filtered.filter(p => !p.assignedTeam).length} />
                </div>
            </aside>

            <main className="relative z-0 flex-1 overflow-hidden rounded-none bg-white shadow-2xl md:rounded-2xl">
                <div className="absolute left-4 top-4 z-[1000] max-w-[calc(100%-90px)] rounded-2xl bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Repair Operations Map</p>
                    <p className="text-sm font-black">{filtered.length} locations visible</p>
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
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.id}</p>
                                            <StatusPill status={p.status as any} className="scale-75 origin-right" />
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{p.roadName || 'Road repair location'}</p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">{p.priority || 'Medium'} priority · {p.assignedTeam || 'Unassigned'}</p>
                                        <button
                                            onClick={() => selectPothole(p)}
                                            className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                                        >
                                            View Operations
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>

                {selected && (
                    <section className="absolute bottom-0 right-0 z-[2000] flex max-h-full w-full flex-col bg-white/95 shadow-[-20px_0_50px_rgba(15,23,42,0.16)] backdrop-blur md:top-0 md:w-[390px]">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Location</p>
                                <h2 className="text-base font-black text-slate-950">{selected.id}</h2>
                            </div>
                            <button onClick={() => setSelected(null)} className="rounded-full bg-white p-2 text-slate-400 shadow-sm hover:text-slate-900">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto p-6">
                            {selected.imageUrl && (
                                <img src={selected.imageUrl} alt="Road damage evidence" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                            )}
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <StatusPill status={selected.status as any} />
                                    <span className={cn(
                                        'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest',
                                        selected.priority === 'Urgent' ? 'bg-rose-50 text-rose-700'
                                            : selected.priority === 'High' ? 'bg-orange-50 text-orange-700'
                                                : 'bg-slate-100 text-slate-600'
                                    )}>
                                        {selected.priority || 'Medium'} Priority
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-950">{selected.roadName || 'Road repair location'}</h3>
                                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-500">
                                    <MapPin size={14} /> {selected.district || 'Area not set'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Detail label="Assigned Team" value={selected.assignedTeam || 'Unassigned'} />
                                <Detail label="Scheduled Date" value={selected.scheduledDate ? new Date(selected.scheduledDate).toLocaleDateString() : 'Not scheduled'} />
                                <Detail label="Reported" value={new Date(selected.createdAt || selected.timestamp).toLocaleDateString()} />
                                <Detail label="Coordinates" value={`${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)}`} />
                            </div>

                            {selected.maintenanceNotes && (
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Maintenance Notes</p>
                                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">{selected.maintenanceNotes}</p>
                                </div>
                            )}

                            <div className="space-y-2 border-t border-slate-100 pt-5">
                                <Link to={`/potholes/${selected.id}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-[10px] font-black uppercase tracking-widest text-white">
                                    View Details
                                </Link>
                                <button onClick={scheduleFromMap} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-900">
                                    <HardHat size={15} /> Schedule
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => updateStatus('In Progress')} className="rounded-xl bg-amber-50 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                        Start Work
                                    </button>
                                    <button onClick={() => updateStatus('Completed')} className="rounded-xl bg-emerald-50 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                        Complete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {isFilterDrawerOpen && (
                <div className="fixed inset-0 z-[3000] bg-slate-950/50 backdrop-blur-sm md:hidden">
                    <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-sm font-black text-slate-950">Map Filters</h3>
                            <button onClick={() => setIsFilterDrawerOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-500">
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
                            teamFilter={teamFilter}
                            setTeamFilter={setTeamFilter}
                            areas={areas}
                        />
                        <button onClick={() => setIsFilterDrawerOpen(false)} className="mt-5 w-full rounded-xl bg-slate-900 py-3.5 text-xs font-black uppercase tracking-widest text-white">
                            Apply Filters
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
    teamFilter: RepairTeam | 'Unassigned' | 'All';
    setTeamFilter: (value: RepairTeam | 'Unassigned' | 'All') => void;
    areas: string[];
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
    teamFilter,
    setTeamFilter,
    areas,
}: FilterPanelProps) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Filter size={13} /> Practical Filters
        </h2>
        <div className="space-y-5">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search location or ID" className="w-full rounded-xl bg-slate-50 py-3 pl-10 pr-3 text-xs font-bold text-slate-900 outline-none" />
            </div>
            <Select label="Status" value={statusFilter} onChange={value => setStatusFilter(value as PotholeStatus | 'All')} options={STATUSES} />
            <Select label="Priority" value={priorityFilter} onChange={value => setPriorityFilter(value as RepairPriority | 'All')} options={['All', ...PRIORITIES]} />
            <Select label="Area / Zone" value={areaFilter} onChange={setAreaFilter} options={areas} />
            <Select label="Date Reported" value={dateFilter} onChange={setDateFilter} options={['All', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
            <Select label="Repair Team" value={teamFilter} onChange={value => setTeamFilter(value as RepairTeam | 'Unassigned' | 'All')} options={['All', 'Unassigned', ...TEAMS]} />
        </div>
    </div>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
    <label className="block">
        <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none">
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-3xl font-black text-slate-950">{value}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 truncate text-xs font-black text-slate-800">{value}</p>
    </div>
);

export default LiveMap;
