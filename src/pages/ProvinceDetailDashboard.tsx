import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    MapContainer, 
    TileLayer, 
    Marker, 
    Popup, 
    useMap 
} from 'react-leaflet';
import * as L from 'leaflet';
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    MapPin, 
    Eye, 
    Search,
    AlertTriangle,
    CheckCircle2,
    Wrench,
    XCircle,
    Activity,
    Layers,
    ChevronRight,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import { reportsApi, potholesApi } from '../lib/api';
import { StatusPill, type StatusType } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { 
    PROVINCIAL_COUNCILS, 
    getProvinceShortName, 
    getProvinceCenter,
    resolveProvince 
} from '../lib/provinceResolver';
import type { CitizenReport, PotholeEvent } from '../types';
import { format } from 'date-fns';
import { Pagination } from '../components/Pagination';
import 'leaflet/dist/leaflet.css';

// Custom controller to fly to coordinates on selection
const MapController = ({ center, zoom }: { center: [number, number] | null; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.2 });
        }
    }, [center, map, zoom]);
    return null;
};

// Generates custom HTML pins to match the dashboard aesthetic
const getMarkerIcon = (report: CitizenReport) => {
    const status = report.status;
    const statusColor = status === 'Verified' ? '#4a7c59' // Sage Green (Verified)
        : status === 'Scheduled' ? '#927c54' // Muted Gold (Scheduled)
        : status === 'In Progress' ? '#5a7a92' // Muted Blue (In Progress)
        : status === 'Completed' ? '#10B981' // Emerald (Completed)
        : status === 'Rejected' ? '#991b1b' // Red (Rejected)
        : '#64748b'; // Slate (New / Awaiting Review)

    const html = `
        <div style="
            background-color: ${statusColor};
            width: 20px;
            height: 20px;
            border-radius: 999px;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        "></div>
    `;

    return L.divIcon({
        html,
        className: 'roadpulse-custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -12],
    });
};

const ProvinceDetailDashboard = () => {
    const { provinceId } = useParams<{ provinceId: string }>();
    const navigate = useNavigate();

    // Map slug back to actual province council name
    const provinceName = useMemo(() => {
        if (!provinceId) return '';
        const found = PROVINCIAL_COUNCILS.find(
            p => p.replace(/\s+/g, '-').toLowerCase() === provinceId
        );
        return found || '';
    }, [provinceId]);

    const provinceCenter = useMemo(() => {
        return getProvinceCenter(provinceName);
    }, [provinceName]);

    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Selected Report for highlighting on Map & Details
    const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(provinceCenter);
    const [mapZoom, setMapZoom] = useState(11);

    // Table Pagination State
    const [page, setPage] = useState(1);
    const limit = 8;

    const loadData = async () => {
        if (!provinceName) return;
        setLoading(true);
        try {
            // Fetch reports specifically for this province
            const [rResponse, pResponse] = await Promise.all([
                reportsApi.list({ provincialCouncil: provinceName, limit: 1000 }),
                potholesApi.list({ provincialCouncil: provinceName, limit: 1000 })
            ]);
            setReports(rResponse.data || []);
            setPotholes(pResponse.data || []);
        } catch (error) {
            console.error("Failed to load provincial details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [provinceName]);

    // Reset map center if province changes
    useEffect(() => {
        setMapCenter(provinceCenter);
        setMapZoom(11);
        setSelectedReport(null);
    }, [provinceCenter]);

    const isOverdue = (item: CitizenReport | PotholeEvent) => {
        const dateStr = 'createdAt' in item ? item.createdAt : (item as PotholeEvent).timestamp;
        if (!dateStr) return false;
        
        const createdDate = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const status = 'status' in item ? item.status : '';
        return ['New', 'Verified', 'Confirmed'].includes(status) && diffDays > 14;
    };

    // Calculate detailed stats for the province
    const stats = useMemo(() => {
        const pReports = reports.filter(r => {
            const rCouncil = r.provincialCouncil || resolveProvince(r.lat, r.lon).council;
            return rCouncil.toLowerCase().trim() === provinceName.toLowerCase().trim();
        });

        const pPotholes = potholes.filter(p => {
            const pCouncil = p.provincialCouncil || resolveProvince(p.lat, p.lon).council;
            return pCouncil.toLowerCase().trim() === provinceName.toLowerCase().trim();
        });

        const verified = pPotholes.filter(p => ['Verified', 'Confirmed', 'New'].includes(p.status)).length;
        const completed = pPotholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length;
        const inProgress = pPotholes.filter(p => p.status === 'In Progress').length;
        const awaitingReview = pReports.filter(r => r.status === 'New' || r.aiStatus === 'PENDING').length;
        const rejected = pReports.filter(r => r.status === 'Rejected' || r.aiStatus === 'REJECTED').length;
        const overdue = [...pReports, ...pPotholes].filter(isOverdue).length;
        
        const total = verified + completed + inProgress + awaitingReview;
        const efficiency = total > 0 ? (completed / total) * 100 : 0;

        return {
            total,
            verified,
            completed,
            inProgress,
            awaitingReview,
            rejected,
            overdue,
            efficiency
        };
    }, [reports, potholes, provinceName]);

    // Filtering & search
    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesSearch = !searchTerm.trim() || 
                r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.district || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [reports, searchTerm, statusFilter]);

    // Paginated reports for the table
    const paginatedReports = useMemo(() => {
        const startIndex = (page - 1) * limit;
        return filteredReports.slice(startIndex, startIndex + limit);
    }, [filteredReports, page]);

    const totalPages = Math.max(1, Math.ceil(filteredReports.length / limit));

    // Handles row click to fly map to coordinates and highlight marker
    const handleSelectReport = (report: CitizenReport) => {
        setSelectedReport(report);
        setMapCenter([report.lat, report.lon]);
        setMapZoom(16);
    };

    if (!provinceName) {
        return (
            <div className="flex h-96 flex-col items-center justify-center rounded-[2.5rem] border border-slate-100 bg-white p-12 text-center">
                <AlertTriangle className="text-rose-500 mb-4" size={36} />
                <h3 className="text-lg font-black text-slate-900 mb-1">Province Not Found</h3>
                <p className="text-sm font-bold text-slate-400 max-w-xs mb-6">The requested Provincial Council could not be verified.</p>
                <Link to="/admin/provinces" className="btn-premium bg-slate-900 text-white hover:bg-black">Go Back</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Navigation Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
                <div className="space-y-2">
                    <Link 
                        to="/admin/provinces"
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors w-fit"
                    >
                        <ArrowLeft size={14} /> Back to Regional Surveillance
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                                {provinceName}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                                Provincial Operations Command Center
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={loadData} 
                        className="btn-premium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                    >
                        <RefreshCw size={14} className={cn("text-slate-400", loading && "animate-spin")} />
                        Sync Telemetry
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Units</span>
                    <span className="text-3xl font-black text-slate-950 tracking-tight leading-none">{stats.total}</span>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">In Progress</span>
                    <span className="text-3xl font-black text-slate-950 tracking-tight leading-none">{stats.inProgress}</span>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Completed</span>
                    <span className="text-3xl font-black text-slate-950 tracking-tight leading-none">{stats.completed}</span>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Awaiting Review</span>
                    <span className="text-3xl font-black text-slate-950 tracking-tight leading-none">{stats.awaitingReview}</span>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center min-h-[110px]">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider mb-1">Overdue Ops</span>
                    <span className="text-3xl font-black text-rose-600 tracking-tight leading-none">{stats.overdue}</span>
                </div>
                <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl shadow-slate-900/10 flex flex-col justify-center min-h-[110px]">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Efficiency</span>
                    <span className="text-3xl font-black text-emerald-400 tracking-tight leading-none">{stats.efficiency.toFixed(1)}%</span>
                </div>
            </div>

            {/* Split Interactive View */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[650px] items-stretch">
                {/* Interactive Map View */}
                <div className="xl:col-span-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative min-h-[350px] xl:min-h-0 flex flex-col">
                    <div className="p-6 pb-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                <Layers size={16} />
                            </div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Live Geo-surveillance</h3>
                        </div>
                        {selectedReport && (
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="text-[9px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all"
                            >
                                Reset Focus
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 w-full relative z-0">
                        <MapContainer 
                            center={provinceCenter} 
                            zoom={11} 
                            zoomControl={false} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer 
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
                                attribution="&copy; OpenStreetMap &copy; CARTO" 
                            />
                            <MapController center={mapCenter} zoom={mapZoom} />
                            
                            {filteredReports.map(report => (
                                <Marker
                                    key={report.id}
                                    position={[report.lat, report.lon]}
                                    icon={getMarkerIcon(report)}
                                    eventHandlers={{ 
                                        click: () => setSelectedReport(report) 
                                    }}
                                >
                                    <Popup>
                                        <div className="w-56 p-2 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">#{report.id.slice(0, 8)}</span>
                                                <StatusPill status={report.status as StatusType} className="scale-75 origin-right" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 leading-tight">
                                                {report.description || 'Reported Issue'}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                District: {report.district}
                                            </p>
                                            <button
                                                onClick={() => navigate(`/admin/reports/${report.id}`)}
                                                className="w-full mt-2 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                                            >
                                                Open Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Selected Report Floating Details Panel */}
                        {selectedReport && (
                            <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 border border-slate-100 p-5 rounded-[2rem] shadow-2xl backdrop-blur-md flex gap-4 animate-in slide-in-from-bottom duration-300">
                                {selectedReport.imageUrl && (
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                                        <img src={selectedReport.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">#{selectedReport.id.slice(0, 12)}</span>
                                        <StatusPill status={selectedReport.status as StatusType} className="scale-75 origin-left" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate leading-tight">
                                        {selectedReport.description || 'Pothole coordinate'}
                                    </h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1">
                                        <MapPin size={10} /> {selectedReport.district}
                                    </p>
                                    <button 
                                        onClick={() => navigate(`/admin/reports/${selectedReport.id}`)}
                                        className="mt-2 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                                    >
                                        Full Audit <ChevronRight size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reports Details Table */}
                <div className="xl:col-span-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 space-y-4 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                                Regional Records ({filteredReports.length})
                            </h3>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none transition-all focus:bg-white"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Verified">Verified</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search by ID, District, or Description..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-3.5 pl-11 pr-4 text-[11px] font-semibold text-slate-900 outline-none transition-all focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)]"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {!loading ? (
                            paginatedReports.length > 0 ? (
                                <table className="table-premium">
                                    <thead>
                                        <tr>
                                            <th>Report</th>
                                            <th>Area</th>
                                            <th>Timestamp</th>
                                            <th className="text-center">Status</th>
                                            <th className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedReports.map((report) => (
                                            <tr 
                                                key={report.id}
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    selectedReport?.id === report.id && "bg-[var(--accent-bg)]/40"
                                                )}
                                                onClick={() => handleSelectReport(report)}
                                            >
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-900">
                                                            #{report.id.slice(0, 8)}
                                                        </span>
                                                        <span className="text-[9px] font-medium text-slate-400 max-w-[150px] truncate">
                                                            {report.description || 'Coordinate'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {report.district}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold text-slate-900">
                                                            {format(new Date(report.createdAt), 'dd MMM yyyy')}
                                                        </span>
                                                        <span className="text-[9px] font-medium text-slate-400">
                                                            {format(new Date(report.createdAt), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <StatusPill status={report.status as StatusType} className="scale-75 origin-center" />
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/admin/reports/${report.id}`);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                                        <AlertTriangle size={24} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">No records found</h3>
                                    <p className="text-xs font-medium text-slate-500 max-w-[200px] mt-1 mx-auto">Try refining your filter or search criteria.</p>
                                </div>
                            )
                        ) : (
                            <div className="p-8 space-y-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 shrink-0">
                        <Pagination 
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={filteredReports.length}
                            limit={limit}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProvinceDetailDashboard;
