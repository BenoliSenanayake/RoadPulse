import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    ChevronUp, 
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
    ChevronRight
} from 'lucide-react';
import { reportsApi, potholesApi } from '../lib/api';
import { StatusPill } from '../components/StatusPill';
import { Skeleton } from '../components/Skeleton';
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
}

const AdminReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('All');
    const [districtFilter, setDistrictFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof UnifiedReport, direction: 'asc' | 'desc' }>({ key: 'submittedDate', direction: 'desc' });

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [rData, pData] = await Promise.all([
                reportsApi.list(),
                potholesApi.list()
            ]);
            setReports(rData);
            setPotholes(pData);
        } catch (err) {
            console.error("Failed to load reports", err);
            setError("Failed to synchronize system records. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const unifiedData = useMemo(() => {
        const unified: UnifiedReport[] = [
            ...reports.map(r => {
                const detected = (!r.provincialCouncil || r.provincialCouncil === 'Unassigned') 
                    ? resolveProvince(r.lat, r.lon) 
                    : { council: r.provincialCouncil };
                
                return {
                    id: r.id,
                    province: detected.council || 'Unknown',
                    district: r.district || 'Unknown',
                    location: r.description || 'Coordinate Location',
                    submittedDate: r.createdAt,
                    status: r.aiStatus === 'PENDING' ? 'Manual Review' : r.aiStatus === 'ACCEPTED' ? 'Verified' : 'Rejected',
                    priority: 'Medium',
                    submittedBy: r.citizenId || 'Anonymous',
                    lastUpdated: r.createdAt,
                    type: 'CITIZEN_REPORT' as const
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
            const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
            
            // Basic date filtering
            const date = new Date(item.submittedDate);
            const matchesStartDate = !dateRange.start || date >= new Date(dateRange.start);
            const matchesEndDate = !dateRange.end || date <= new Date(dateRange.end + 'T23:59:59');

            return matchesSearch && matchesProvince && matchesDistrict && matchesStatus && matchesPriority && matchesStartDate && matchesEndDate;
        }).sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [unifiedData, searchTerm, provinceFilter, districtFilter, statusFilter, priorityFilter, dateRange, sortConfig]);

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

    const districts = useMemo(() => {
        const unique = new Set(unifiedData.map(d => d.district).filter(Boolean));
        return Array.from(unique).sort();
    }, [unifiedData]);

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Global Records</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Centralized administrative repository for all system reports</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={loadData}
                        className="h-10 px-4 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Database
                    </button>
                    <button className="h-10 px-4 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10 hover:bg-black transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="col-span-1 md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by ID or location..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                    </div>

                    {/* Province Filter */}
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={provinceFilter}
                            onChange={(e) => {
                                setProvinceFilter(e.target.value);
                                setDistrictFilter('All');
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="All">All Provinces</option>
                            {PROVINCIAL_COUNCILS.map(pc => (
                                <option key={pc} value={pc}>{pc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>

                    {/* District Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="All">All Districts</option>
                            {districts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Verified">Verified</option>
                            <option value="Manual Review">Manual Review</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>

                    {/* Priority Filter */}
                    <div className="relative">
                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="All">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>

                    {/* Date Range */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 lg:col-span-1 xl:col-span-2">
                         <div className="relative flex-1 w-full">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all"
                            />
                         </div>
                         <span className="text-slate-300 hidden sm:block">to</span>
                         <div className="relative flex-1 w-full">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all"
                            />
                         </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th onClick={() => handleSort('id')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Report ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('province')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">
                                    Province
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    District
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Location
                                </th>
                                <th onClick={() => handleSort('submittedDate')} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">
                                    <div className="flex items-center gap-2">
                                        Submitted {sortConfig.key === 'submittedDate' && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Status
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                    Priority
                                </th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-6 py-5">
                                                <Skeleton variant="text" className="w-full h-4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 uppercase">#{item.id.split('-')[0]}</span>
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{item.type.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-slate-600 uppercase">
                                                {item.province !== 'Unknown' ? getProvinceShortName(item.province as any) : 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-slate-600 uppercase">{item.district}</span>
                                        </td>
                                        <td className="px-6 py-5 max-w-[200px]">
                                            <p className="text-xs font-bold text-slate-800 truncate">{item.location}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900">
                                                    {item.submittedDate ? format(new Date(item.submittedDate), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {item.submittedDate ? format(new Date(item.submittedDate), 'HH:mm') : '--:--'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {getStatusIcon(item.status)}
                                                <StatusPill status={item.status as any} className="scale-75" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block border",
                                                item.priority === 'Urgent' || item.priority === 'High' 
                                                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                                                    : item.priority === 'Medium'
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                                onClick={() => navigate(item.type === 'CITIZEN_REPORT' ? `/admin/reports/${item.id}` : `/potholes/${item.id}`)}
                                                className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                                            >
                                                <Eye size={14} /> Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-4">
                                                <Search size={24} className="text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No records found</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-900">{filteredData.length}</span> of <span className="text-slate-900">{unifiedData.length}</span> records
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 cursor-not-allowed">
                            <ChevronRight size={14} className="rotate-180" />
                        </button>
                        <button className="h-8 px-3 rounded-lg border border-blue-200 bg-blue-50 text-[10px] font-black text-blue-600">1</button>
                        <button className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-white transition-colors">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* System Notification */}
            <div className="p-6 bg-blue-600 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-blue-600/20">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <RefreshCw size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest">Real-time Synchronization</h4>
                        <p className="text-[10px] font-bold text-blue-100/80">System records are automatically synced every 5 minutes across all provincial jurisdictions.</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sync Active</span>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
