import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    Eye, 
    Download,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wrench,
    XCircle,
    RefreshCw,
    ArrowUpDown
} from 'lucide-react';
import { reportsApi } from '../lib/api';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { PROVINCIAL_COUNCILS, getProvinceShortName } from '../lib/provinceResolver';
import type { CitizenReport } from '../types';
import { format } from 'date-fns';
import { Pagination } from '../components/Pagination';

const AdminReports = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('All');
    const [districtFilter, setDistrictFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    // Sorting

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await reportsApi.list({
                page,
                limit,
                search: searchTerm,
                provincialCouncil: provinceFilter === 'All' ? undefined : provinceFilter,
                district: districtFilter === 'All' ? undefined : districtFilter,
                status: statusFilter === 'All' ? undefined : statusFilter,
            });

            setReports(response.data);
            setTotalPages(response.total_pages);
            setTotalItems(response.total);
        } catch (error) {
            console.error("[Admin Reports] Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, provinceFilter, districtFilter, statusFilter, searchTerm]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [provinceFilter, districtFilter, statusFilter, searchTerm]);


    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Verified': return <CheckCircle2 className="text-emerald-500" size={14} />;
            case 'New': return <Clock className="text-amber-500" size={14} />;
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Centralized governance for citizen reports and infrastructure events</p>
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
                    <div className="relative xl:col-span-2 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search Report ID or District..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={provinceFilter}
                            onChange={(e) => setProvinceFilter(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer"
                        >
                            <option value="All">All Provinces</option>
                            {PROVINCIAL_COUNCILS.map(pc => (
                                <option key={pc} value={pc}>{pc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            placeholder="District..."
                            value={districtFilter === 'All' ? '' : districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value || 'All')}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none"
                        />
                    </div>

                    <div className="relative group">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Verified">Verified</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th className="cursor-pointer group">
                                    <div className="flex items-center gap-2">
                                        Unit ID
                                        <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th>Jurisdiction</th>
                                <th>District</th>
                                <th>Location Telemetry</th>
                                <th className="cursor-pointer group">
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
                            {!loading && reports.length > 0 ? (
                                reports.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                        <td className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900 uppercase">
                                                    #{item.id.split('-')[0]}
                                                </span>
                                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">REPORT</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {item.provincialCouncil ? getProvinceShortName(item.provincialCouncil as any) : 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[11px] font-bold text-slate-600 uppercase">{item.district}</span>
                                        </td>
                                        <td className="max-w-[220px]">
                                            <p className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">
                                                {item.description || 'Coordinate Location'}
                                            </p>
                                        </td>
                                        <td className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900">
                                                    {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {item.createdAt ? format(new Date(item.createdAt), 'HH:mm:ss') : '--:--:--'}
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
                                                ['Urgent', 'High'].includes(item.priority || '') 
                                                    ? "bg-rose-50 text-rose-600 border-rose-100" 
                                                    : item.priority === 'Medium'
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>
                                                {item.priority || 'Medium'}
                                            </span>
                                        </td>
                                        <td className="text-right px-8">
                                            <button 
                                                onClick={() => navigate(`/admin/reports/${item.id}`)}
                                                className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-2 shadow-sm ml-auto"
                                            >
                                                <Eye size={12} /> Details
                                            </button>
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
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto leading-relaxed">No system records match your current criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                    <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={totalItems}
                        limit={limit}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
