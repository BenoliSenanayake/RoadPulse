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
    Layers,
    MapPin,
    Search,
    X,
    ChevronRight,
    CheckCircle,
    Play,
    CalendarClock
} from 'lucide-react';
import { subDays, isAfter } from 'date-fns';
import { reportsApi } from '../lib/api';
import type { CitizenReport, RepairPriority } from '../types';
import { StatusPill, type StatusType } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName, PROVINCE_DISTRICTS, normalizeProvince, normalizeDistrict, canonicalizeProvince, getProvinceCenter } from '../lib/provinceResolver';
import { filterReportsForProvince, hasOfficerProvince, logStaffReportFilter, OFFICER_PROVINCE_MISSING } from '../lib/staffReportFilters';
import { canonicalizeStatus } from '../lib/status';
import 'leaflet/dist/leaflet.css';

const PRIORITIES: RepairPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
type LiveMapStatus = 'Verified' | 'Scheduled' | 'In Progress' | 'All';
const STATUSES: LiveMapStatus[] = ['All', 'Verified', 'Scheduled', 'In Progress'];
const LIVE_MAP_STATUSES = new Set(['Verified', 'Scheduled', 'In Progress']);

const MapController = ({ center, zoom }: { center: [number, number] | null; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom, { duration: 1.2 });
    }, [center, map, zoom]);
    return null;
};

const getMarkerIcon = (pothole: CitizenReport) => {
    // Verified = Green, Scheduled = Orange, In Progress = Blue
    const status = canonicalizeStatus(pothole.status);
    const statusColor = status === 'Verified' ? '#10B981' 
        : status === 'Scheduled' ? '#F97316'
        : status === 'In Progress' ? '#2563EB'
        : '#64748B';

    const html = `
        <div style="
            background-color: ${statusColor};
            width: 24px;
            height: 24px;
            border-radius: 999px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        "></div>
    `;

    return L.divIcon({
        html,
        className: 'roadpulse-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10],
    });
};

const LiveMap = () => {
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const officerProvince = canonicalizeProvince(province);
    const provinceCenter = getProvinceCenter(province);
    const [mapReports, setMapReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<LiveMapStatus>('All');
    const [priorityFilter, setPriorityFilter] = useState<RepairPriority | 'All'>('All');
    const [areaFilter, setAreaFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [selected, setSelected] = useState<CitizenReport | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(provinceCenter);
    const [mapZoom, setMapZoom] = useState(10);
    const [debugCounts, setDebugCounts] = useState({ allReports: 0, provinceReports: 0 });
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const loadMapData = async () => {
        setLoading(true);
        setError('');
        try {
            if (!hasOfficerProvince(province)) {
                setError(OFFICER_PROVINCE_MISSING);
                setLoading(false);
                return;
            }
            const staffProvince = normalizeProvince(province);
            console.log(`[LiveMap Debug] Current User:`, user?.email, staffProvince);

            const response = await reportsApi.list({ provincialCouncil: province, limit: 1000 });
            const data = response.data || [];
            console.log(`[LiveMap] Raw telemetry: ${data.length} records.`);
            
            const provinceReports = filterReportsForProvince(data, province);
            console.log(`[LiveMap] Province-filtered for ${staffProvince}: ${provinceReports.length} records.`);
            
            logStaffReportFilter('Live Map', province, data, provinceReports);
            setDebugCounts({ allReports: data.length, provinceReports: provinceReports.length });
            
            setMapReports(provinceReports);
            setSelected(current => current
                && provinceReports.some(report => report.id === current.id)
                && LIVE_MAP_STATUSES.has(canonicalizeStatus(current.status))
                ? current
                : null);
        } catch (err) {
            console.error('Map fetch error:', err);
            setError('Failed to load map data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMapData();
        
        // Real-time synchronization: Poll every 30 seconds
        const interval = setInterval(() => {
            if (!hasOfficerProvince(province)) return;
            reportsApi.list({ provincialCouncil: province, limit: 1000 }).then(response => {
                const data = response.data || [];
                const provinceReports = filterReportsForProvince(data, province);
                logStaffReportFilter('Live Map Poll', province, data, provinceReports);
                setDebugCounts({ allReports: data.length, provinceReports: provinceReports.length });
                setMapReports(provinceReports);
                setSelected(current => current
                    && provinceReports.some(report => report.id === current.id)
                    && LIVE_MAP_STATUSES.has(canonicalizeStatus(current.status))
                    ? current
                    : null);
            }).catch(console.error);
        }, 30000);

        return () => clearInterval(interval);
    }, [province]);

    useEffect(() => {
        setAreaFilter('All');
        setMapCenter(provinceCenter);
        setMapZoom(10);
        setSelected(null);
    }, [province, provinceCenter]);

    const districts = useMemo(() => {
        if (officerProvince !== 'Unassigned') {
            const provinceDistricts = PROVINCE_DISTRICTS[officerProvince] || [];
            return ['All', ...provinceDistricts];
        }
        return ['All'];
    }, [officerProvince]);

    const filtered = useMemo(() => {
        const selectedDistrict = normalizeDistrict(areaFilter);
        const districtFilteredReports = areaFilter === 'All'
            ? mapReports
            : mapReports.filter(report => normalizeDistrict(report.district) === selectedDistrict);

        console.log('Selected District:', areaFilter);
        console.log(
            'Province Filtered Reports:',
            mapReports.map(report => ({
                id: report.id,
                district: report.district,
                normalized: normalizeDistrict(report.district),
            }))
        );
        console.log('District Filtered Reports:', districtFilteredReports);

        const statusFilteredReports = districtFilteredReports.filter(report => LIVE_MAP_STATUSES.has(canonicalizeStatus(report.status)));

        const search = searchTerm.trim().toLowerCase();
        const normalizedSearchDistrict = normalizeDistrict(searchTerm);
        const visibleReports = statusFilteredReports.filter(report => {
            const reportStatus = canonicalizeStatus(report.status);
            const matchesStatus = statusFilter === 'All' || reportStatus === statusFilter;
            const matchesPriority = priorityFilter === 'All' || report.priority === priorityFilter;
            const matchesSearch = !search
                || report.id.toLowerCase().includes(search)
                || (report.description || '').toLowerCase().includes(search)
                || normalizeDistrict(report.district).includes(normalizedSearchDistrict);

            let matchesDate = true;
            const reportedDate = new Date(report.createdAt);
            if (dateFilter === 'Last 24h') matchesDate = isAfter(reportedDate, subDays(new Date(), 1));
            if (dateFilter === 'Last 7 Days') matchesDate = isAfter(reportedDate, subDays(new Date(), 7));
            if (dateFilter === 'Last 30 Days') matchesDate = isAfter(reportedDate, subDays(new Date(), 30));

            return matchesStatus && matchesPriority && matchesDate && matchesSearch;
        });

        console.log('[Live Map Visible Debug]', {
            loggedOfficerProvince: province,
            allReportsCount: debugCounts.allReports,
            provinceReportsCount: debugCounts.provinceReports,
            selectedDistrict: areaFilter,
            normalizedSelectedDistrict: selectedDistrict,
            districtFilteredReportsCount: districtFilteredReports.length,
            statusFilteredReportsCount: statusFilteredReports.length,
            finalVisibleReportsCount: visibleReports.length,
            visibleReportProvinces: Array.from(new Set(visibleReports.map(report => report.provincialCouncil || 'Unassigned'))),
            visibleReportStatuses: Array.from(new Set(visibleReports.map(report => canonicalizeStatus(report.status)))),
            visibleReportDistricts: Array.from(new Set(visibleReports.map(report => report.district || 'Unknown'))),
            visibleReportNormalizedDistricts: Array.from(new Set(visibleReports.map(report => normalizeDistrict(report.district)))),
            visibleReportCoordinates: visibleReports.map(report => ({ id: report.id, lat: report.lat, lon: report.lon })),
        });

        return visibleReports;
    }, [mapReports, searchTerm, statusFilter, priorityFilter, areaFilter, dateFilter, province, debugCounts]);

    const selectPothole = (pothole: CitizenReport) => {
        setSelected(pothole);
        setMapCenter([pothole.lat, pothole.lon]);
        setMapZoom(16);
    };

    const updateStatus = async (status: 'Scheduled' | 'In Progress' | 'Completed') => {
        if (!selected) return;
        await reportsApi.updateStatus(
            selected.id,
            status,
            `Field update from live map by ${user?.name || 'officer'}.`
        );
        await loadMapData();
        // If it becomes completed, it should disappear from the map
        if (status === 'Completed') {
            setSelected(null);
        } else {
            setSelected(prev => prev ? { ...prev, status } : prev);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
                    <p className="text-sm font-medium text-slate-500">Loading live map</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[calc(100vh-120px)] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-3 text-rose-500" size={32} />
                    <p className="text-sm font-bold text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative -m-4 flex h-[calc(100vh-96px)] flex-col gap-4 overflow-hidden bg-slate-50 p-4 sm:-m-6 sm:h-[calc(100vh-112px)] sm:p-6 md:flex-row">
            <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto pr-1 md:flex">
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
                    <Stat label="Active Repairs" value={filtered.filter(p => ['Scheduled', 'In Progress'].includes(canonicalizeStatus(p.status))).length} />
                </div>
            </aside>

            <main className="relative z-0 flex-1 overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm md:rounded-xl">
                <div className="absolute left-4 top-4 z-[1000] max-w-[calc(100%-90px)] rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm">
                    <div className="mb-1 flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-500">Provincial live map</p>
                        {province && province !== 'Unassigned' && (
                            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                                {getProvinceShortName(province)}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-semibold">{filtered.length} visible points</p>
                </div>

                <div className="absolute bottom-6 left-4 z-[1000] min-w-[140px] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-3 border-b border-slate-100 pb-2 text-xs font-medium text-slate-500">Map legend</p>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full bg-[#10B981]" />
                            <span className="text-xs font-medium text-slate-700">Verified</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full bg-[#F97316]" />
                            <span className="text-xs font-medium text-slate-700">Scheduled</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-3 w-3 rounded-full bg-[#2563EB]" />
                            <span className="text-xs font-medium text-slate-700">In progress</span>
                        </div>
                    </div>
                </div>

                <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                    <button className="rounded-lg border border-slate-200 bg-white p-3 text-slate-600 shadow-sm">
                        <Layers size={18} />
                    </button>
                    <button
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="rounded-lg bg-slate-900 p-3 text-white shadow-sm md:hidden"
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <MapContainer center={provinceCenter} zoom={10} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" />
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <MarkerClusterGroup chunkedLoading spiderfyOnMaxZoom showCoverageOnHover={false} maxClusterRadius={40}>
                        {filtered.length > 0 ? filtered.map(p => (
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
                                            <StatusPill status={p.status as StatusType} className="scale-75 origin-right" />
                                        </div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{p.description?.replace(/^\[.*?\]\s*/, '') || 'Road Location'}</p>
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
                        )) : (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1001]">
                                <div className="max-w-xs rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                                    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
                                        <MapPin size={20} className="text-slate-300" />
                                    </div>
                                    <h3 className="mb-1 text-sm font-semibold text-slate-950">No live reports</h3>
                                    <p className="text-sm leading-6 text-slate-500">
                                        There are currently no active potholes or verified reports in this area.
                                    </p>
                                </div>
                            </div>
                        )}
                    </MarkerClusterGroup>
                </MapContainer>

                {selected && (
                    <section className="absolute bottom-0 right-0 z-[2000] flex max-h-full w-full flex-col border-l border-slate-200 bg-white shadow-md md:top-0 md:w-[380px]">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5">
                            <div>
                                <p className="mb-1 text-xs font-medium text-slate-500">Operational record</p>
                                <h2 className="text-base font-semibold text-slate-950">#{selected.id.split('-')[0]}</h2>
                            </div>
                            <button onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="custom-scroll flex-1 space-y-5 overflow-y-auto p-5">
                            {selected.imageUrl && (
                                <img src={selected.imageUrl} alt="Road damage evidence" className="aspect-video w-full rounded-lg border border-slate-200 object-cover" />
                            )}
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <StatusPill status={selected.status as StatusType} />
                                    <span className={cn(
                                        'rounded-md px-2.5 py-1 text-xs font-medium',
                                        ['High', 'Urgent'].includes(selected.priority || '') ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                                    )}>
                                        {selected.priority || 'Medium'} Priority
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold leading-tight text-slate-950">{selected.description?.replace(/^\[.*?\]\s*/, '') || 'Provincial road point'}</h3>
                                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MapPin size={14} className="text-slate-400" /> {selected.district} District
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Detail label="Report ID" value={`#${selected.id.split('-')[0]}`} />
                                <Detail label="District" value={selected.district || 'Unknown'} />
                                <Detail label="Province" value={selected.provincialCouncil || 'Unassigned'} />
                                <Detail label="Status" value={selected.status} />
                                <Detail label="Priority" value={selected.priority || 'Medium'} />
                                <Detail label="Submitted Date" value={new Date(selected.createdAt).toLocaleDateString()} />
                            </div>

                            {selected.maintenanceNotes && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="mb-2 text-xs font-medium text-slate-500">Maintenance observations</p>
                                    <p className="text-sm leading-relaxed text-slate-600">"{selected.maintenanceNotes}"</p>
                                </div>
                            )}

                            <div className="space-y-3 border-t border-slate-200 pt-4">
                                {canonicalizeStatus(selected.status) === 'Verified' && (
                                    <button 
                                        onClick={() => updateStatus('Scheduled')} 
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                                    >
                                        <CalendarClock size={14} /> Mark Scheduled
                                    </button>
                                )}
                                {canonicalizeStatus(selected.status) === 'Scheduled' && (
                                    <button 
                                        onClick={() => updateStatus('In Progress')} 
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                                    >
                                        <Play size={14} /> Mark In Progress
                                    </button>
                                )}
                                {canonicalizeStatus(selected.status) === 'In Progress' && (
                                    <button 
                                        onClick={() => updateStatus('Completed')} 
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                                    >
                                        <CheckCircle size={14} /> Finalize Maintenance
                                    </button>
                                )}
                                <Link to={`/staff/reports/${selected.id}`} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                    Open report details <ChevronRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {isFilterDrawerOpen && (
                <div className="fixed inset-0 z-[3000] bg-slate-900/40 md:hidden">
                    <div className="absolute inset-y-0 right-0 w-[86%] max-w-sm overflow-y-auto bg-white p-6 shadow-lg">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
                            <h3 className="text-base font-semibold text-slate-950">Map filters</h3>
                            <button onClick={() => setIsFilterDrawerOpen(false)} className="rounded-lg bg-slate-50 p-2 text-slate-500">
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
                        <button onClick={() => setIsFilterDrawerOpen(false)} className="mt-6 w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white">
                            Apply filters
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
    statusFilter: LiveMapStatus;
    setStatusFilter: (value: LiveMapStatus) => void;
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Filter size={16} /> Map filters
        </h2>
        <div className="space-y-5">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search road or ID..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200" />
            </div>
            <Select label="District Sector" value={areaFilter} onChange={setAreaFilter} options={districts} />
            <Select label="Maintenance Status" value={statusFilter} onChange={value => setStatusFilter(value as LiveMapStatus)} options={STATUSES} />
            <Select label="Operational Priority" value={priorityFilter} onChange={value => setPriorityFilter(value as RepairPriority | 'All')} options={['All', ...PRIORITIES]} />
            <Select label="Discovery Timeline" value={dateFilter} onChange={setDateFilter} options={['All', 'Last 24h', 'Last 7 Days', 'Last 30 Days']} />
        </div>
    </div>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
    <label className="block">
        <span className="mb-2 ml-1 block text-sm font-medium text-slate-700">{label}</span>
        <select value={value} onChange={event => onChange(event.target.value)} className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200">
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-800">{value}</p>
    </div>
);

export default LiveMap;
