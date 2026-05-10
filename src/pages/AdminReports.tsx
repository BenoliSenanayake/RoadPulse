import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    Eye, 
    Download,
    Calendar,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wrench,
    XCircle,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    ArrowUpDown
} from 'lucide-react';
import { reportsApi, potholesApi } from '../lib/api';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { PROVINCIAL_COUNCILS, getProvinceShortName, resolveProvince } from '../lib/provinceResolver';
import type { CitizenReport, PotholeEvent } from '../types';
import { format } from 'date-fns';

interface UnifiedReport {
    id: string;
    province: string;
    district: string;
    location: string;
    submittedDate: string;
    status: string;
    priority: string;
    submittedBy: string;
    lastUpdated: string;
    type: 'CITIZEN_REPORT' | 'POTHOLE_EVENT';
    imageUrl?: string;
}

const AdminReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('All');
    const [districtFilter, setDistrictFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof UnifiedReport, direction: 'asc' | 'desc' }>({ key: 'submittedDate', direction: 'desc' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [rData, pData] = await Promise.all([
                reportsApi.list(),
                potholesApi.list()
            ]);
            console.log(`[Admin Reports] Successfully synced ${rData.length} citizen reports and ${pData.length} pothole events from PostgreSQL.`);
            setReports(rData);
            setPotholes(pData);
        } catch (error) {
            console.error("[Admin Reports] Failed to fetch live reports data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Real-time synchronization: Poll every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const unifiedData = useMemo(() => {
        const unified: UnifiedReport[] = [
            ...reports.map(r => {
                const detected = (!r.provincialCouncil || r.provincialCouncil === 'Unassigned') 
                    ? resolveProvince(r.lat, r.lon) 
                    : { council: r.provincialCouncil };
                
                let status = 'New';
                if (['Verified', 'Confirmed'].includes(r.status) || r.aiClassification === 'VERIFIED_POTHOLE') status = 'Verified';
                else if (r.status === 'Rejected' || r.aiClassification === 'REJECTED') status = 'Rejected';
                else if (r.status === 'New' || r.aiClassification === 'NEEDS_MANUAL_REVIEW') status = 'Manual Review';

                return {
                    id: r.id,
                    province: detected.council || 'Unknown',
                    district: r.district || 'Unknown',
                    location: r.description || 'Coordinate Location',
                    submittedDate: r.createdAt,
                    status: status,
                    priority: r.priority || 'Medium',
                    submittedBy: r.citizenId || 'Anonymous',
                    lastUpdated: r.createdAt,
                    type: 'CITIZEN_REPORT' as const,
                    imageUrl: r.imageUrl
                };
            }),
            ...potholes.map(p => {
                const detected = (!p.provincialCouncil || p.provincialCouncil === 'Unassigned') 
                    ? resolveProvince(p.lat, p.lon) 
                    : { council: p.provincialCouncil };

                return {
                    id: p.id,
                    province: detected.council || 'Unknown',
                    district: p.district || 'Unknown',
                    location: p.roadName || 'Coordinate Location',
                    submittedDate: p.timestamp,
                    status: p.status,
                    priority: p.priority || 'Unassigned',
                    submittedBy: 'AI System',
                    imageUrl: p.imageUrl,
                    lastUpdated: p.timestamp,
                    type: 'POTHOLE_EVENT' as const
                };
            })
        ];

        return unified;
    }, [reports, potholes]);

    const filteredData = useMemo(() => {
        return unifiedData.filter(item => {
            const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProvince = provinceFilter === 'All' || item.province === provinceFilter;
            const matchesDistrict = districtFilter === 'All' || item.district === districtFilter;
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            
            const date = new Date(item.submittedDate);
            const matchesStartDate = !dateRange.start || date >= new Date(dateRange.start);
            const matchesEndDate = !dateRange.end || date <= new Date(dateRange.end + 'T23:59:59');

            return matchesSearch && matchesProvince && matchesDistrict && matchesStatus && matchesStartDate && matchesEndDate;
        }).sort((a, b) => {
            const aValue = a[sortConfig.key] ?? '';
            const bValue = b[sortConfig.key] ?? '';
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [unifiedData, searchTerm, provinceFilter, districtFilter, statusFilter, dateRange, sortConfig]);

    const districts = useMemo(() => {
        if (provinceFilter === 'All') return [];
        const province = provinceFilter;
        const allItems = [...reports, ...potholes];
        return Array.from(new Set(allItems.filter(i => i.provincialCouncil === province).map(i => i.district).filter(Boolean))) as string[];
    }, [provinceFilter, reports, potholes]);

    const handleSort = (key: keyof UnifiedReport) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Verified': return <CheckCircle2 className="text-emerald-500" size={14} />;
            case 'Manual Review': return <Clock className="text-amber-500" size={14} />;
            case 'In Progress': return <Wrench className="text-blue-500" size={14} />;
            case 'Rejected': return <XCircle className="text-rose-500" size={14} />;
            default: return <AlertCircle className="text-slate-400" size={14} />;
        }
    };

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-heading">Global Telemetry Stream</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Centralized governance for citizen reports and detected infrastructure events</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-premium bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-50">
                        <Download size={14} className="text-slate-400" />
                        Export Audit
                    </button>
                    <button onClick={loadData} className="btn-premium bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800">
                        <RefreshCw size={14} className={cn("text-blue-400", loading && "animate-spin")} />
                        Synchronize
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {/* Search */}
                    <div className="relative xl:col-span-2 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search Report ID or Location..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5"
                        />
                    </div>

                    {/* Province Filter */}
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <select 
                            value={provinceFilter}
                            onChange={(e) => {
                                setProvinceFilter(e.target.value);
                                setDistrictFilter('All');
                            }}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="All">All Provinces</option>
                            {PROVINCIAL_COUNCILS.map(pc => (
                                <option key={pc} value={pc}>{pc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>

                    {/* District Filter */}
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <select 
                            value={districtFilter}
                            disabled={provinceFilter === 'All'}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="All">All Districts</option>
                            {districts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>

                    {/* Status Filter */}
                    <div className="relative group">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Verified">Verified</option>
                            <option value="Manual Review">Manual Review</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>

                    {/* Date Range */}
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('id')} className="cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        Unit ID
                                        <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th>Jurisdiction</th>
                                <th>District</th>
                                <th>Location Telemetry</th>
                                <th onClick={() => handleSort('submittedDate')} className="cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        Timestamp
                                        <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="text-center">Lifecycle Status</th>
                                <th className="text-center">Priority</th>
                                <th className="text-right px-8">Governance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!loading && filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                        <td className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 uppercase">
                                                    #{item.id.includes('-') ? item.id.split('-')[1] : item.id.slice(0, 8)}
                                                </span>
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{String(item.type ?? '').replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {item.province !== 'Unknown' ? getProvinceShortName(item.province as any) : 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[11px] font-bold text-slate-600 uppercase">{item.district}</span>
                                        </td>
                                        <td className="max-w-[220px]">
                                            <p className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">{item.location}</p>
                                        </td>
                                        <td className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900">
                                                    {item.submittedDate ? format(new Date(item.submittedDate), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {item.submittedDate ? format(new Date(item.submittedDate), 'HH:mm:ss') : '--:--:--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {getStatusIcon(item.status)}
                                                <StatusPill status={item.status as any} className="scale-90" />
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block border",
                                                item.priority === 'Urgent' || item.priority === 'High' 
                                                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                                                    : item.priority === 'Medium'
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="text-right px-8">
                                            <div className="relative group/details inline-block ml-auto">
                                                <button 
                                                    onClick={() => navigate(item.type === 'CITIZEN_REPORT' ? `/admin/reports/${item.id}` : `/potholes/${item.id}`)}
                                                    className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                                                >
                                                    <Eye size={12} /> Details
                                                </button>
                                                {/* Image preview tooltip on hover */}
                                                {item.imageUrl && (
                                                    <div className="absolute right-0 bottom-full mb-2 z-30 w-52 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/20 opacity-0 invisible group-hover/details:opacity-100 group-hover/details:visible transition-all duration-300 pointer-events-none -translate-y-2 group-hover/details:translate-y-0 bg-white">
                                                        <img src={item.imageUrl} alt="Preview" className="w-full h-32 object-cover" />
                                                        <div className="p-2.5 bg-slate-50">
                                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Report Image Preview</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={8} className="px-8 py-5">
                                            <div className="h-6 w-full bg-slate-50 animate-pulse rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                                                <Search size={32} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Zero Telemetry Matches</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto leading-relaxed">No system records match your current criteria. Broaden your filters or search parameters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Status */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Records in Stream: <span className="text-slate-900">{filteredData.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 cursor-not-allowed">
                            <ChevronLeft size={16} />
                        </button>
                        <button className="h-9 px-4 rounded-xl border border-blue-200 bg-white text-[10px] font-black text-blue-600 shadow-sm">1</button>
                        <button className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
