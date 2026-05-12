import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, 
    Calendar, 
    Clock,
    MapPin, 
    ShieldAlert, 
    CheckCircle2, 
    Wrench, 
    AlertTriangle,
    Eye,
    Loader2,
    Search,
    XCircle,
    History,
    CalendarClock
} from 'lucide-react';
import { reportsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName } from '../lib/provinceResolver';
import {
    hasOfficerProvince,
    logStaffReportFilter,
    OFFICER_PROVINCE_MISSING
} from '../lib/staffReportFilters';
import type { CitizenReport, RepairPriority } from '../types';
import { Pagination } from '../components/Pagination';

type ReportFilter = 'verified' | 'manual-review' | 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'rejected' | 'all';

const FILTER_LABELS: Record<ReportFilter, string> = {
    'verified': 'Verified Pothole Reports',
    'manual-review': 'Manual Review Required',
    'scheduled': 'Scheduled Repairs',
    'in-progress': 'In Progress Repairs',
    'completed': 'Completed Repairs',
    'overdue': 'Overdue Repairs',
    'rejected': 'Rejected Reports',
    'all': 'All RoadPulse Reports'
};

const FILTER_ICONS: Record<ReportFilter, any> = {
    'verified': CheckCircle2,
    'manual-review': ShieldAlert,
    'scheduled': CalendarClock,
    'in-progress': Wrench,
    'completed': CheckCircle2,
    'overdue': AlertTriangle,
    'rejected': XCircle,
    'all': History
};

const FILTER_COLORS: Record<ReportFilter, string> = {
    'verified': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'manual-review': 'text-amber-600 bg-amber-50 border-amber-100',
    'scheduled': 'text-orange-600 bg-orange-50 border-orange-100',
    'in-progress': 'text-blue-600 bg-blue-50 border-blue-100',
    'completed': 'text-slate-600 bg-slate-50 border-slate-100',
    'overdue': 'text-rose-600 bg-rose-50 border-rose-100',
    'rejected': 'text-slate-600 bg-slate-50 border-slate-100',
    'all': 'text-slate-900 bg-slate-100 border-slate-200'
};

const getDaysSince = (dateStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const today = new Date();
    return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const FilteredReportList = () => {
    const { filter: rawFilter } = useParams<{ filter: string }>();
    const location = useLocation();
    const pathFilter = location.pathname.split('/').filter(Boolean).pop();
    const filter = (rawFilter || pathFilter || 'all') as ReportFilter;
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    useEffect(() => {
        if (filter && !FILTER_LABELS[filter]) {
            navigate('/staff/overview');
        }
    }, [filter, navigate]);

    // Reset page when filter or search changes
    useEffect(() => {
        setPage(1);
    }, [filter, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (!hasOfficerProvince(province)) {
                setError(OFFICER_PROVINCE_MISSING);
                setLoading(false);
                return;
            }
            
            const response = await reportsApi.list({
                page,
                limit,
                category: filter,
                search: searchTerm,
                provincialCouncil: province
            });

            setReports(response.data);
            setTotalPages(response.total_pages);
            setTotalItems(response.total);
            
            logStaffReportFilter(`Paginated Staff Reports ${filter}`, province, response.data, response.data);
        } catch (error) {
            console.error("Failed to load reports", error);
            setError('Failed to load reports. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [province, page, filter, searchTerm]);

    const handleQuickAction = async (item: any, action: string, value?: any) => {
        setActionLoading(item.id);
        try {
            if (filter === 'manual-review') {
                if (action === 'accept') {
                    await reportsApi.updateStatus(item.id, 'Verified', 'Report verified by maintenance officer.');
                } else if (action === 'reject') {
                    const reason = window.prompt("Reason for rejection:");
                    if (reason) await reportsApi.updateStatus(item.id, 'Rejected', reason);
                }
            } else if (filter === 'verified') {
                if (action === 'priority') {
                    await reportsApi.updateStatus(item.id, 'Scheduled', 'Repair scheduled from verified queue.', value as RepairPriority);
                } else if (action === 'start') {
                    await reportsApi.updateStatus(item.id, 'Scheduled', 'Repair scheduled from verified queue.');
                }
            } else if (filter === 'in-progress') {
                if (action === 'complete') {
                    await reportsApi.updateStatus(item.id, 'Completed', 'Maintenance work finalized.');
                }
            } else if (filter === 'overdue') {
                if (action === 'update') {
                    navigate(`/staff/reports/${item.id}`);
                    return;
                }
            } else if (filter === 'rejected') {
                if (action === 'restore') {
                    await reportsApi.updateStatus(item.id, 'Verified', 'Report manually moved from Rejected to Verified by officer');
                }
            }
            await loadData();
        } finally {
            setActionLoading(null);
        }
    };

    if (!filter || !FILTER_LABELS[filter]) return <Navigate to="/staff/overview" replace />;

    const Icon = FILTER_ICONS[filter];
    const backPath = user?.role === 'ADMIN' ? '/admin/overview' : '/staff/overview';

    if (error) {
        return (
            <div className="rounded-3xl border border-rose-100 bg-white p-10 text-center shadow-sm max-w-md mx-auto mt-10">
                <AlertTriangle className="mx-auto mb-3 text-rose-500" size={32} />
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Reports unavailable</h2>
                <p className="text-sm text-slate-500 font-bold mb-6">{error}</p>
                <button onClick={() => navigate('/staff/login')} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Sign In Again</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => navigate(backPath)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors w-fit"
                    >
                        <ArrowLeft size={14} /> Back to Overview
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl border shadow-sm", FILTER_COLORS[filter])}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight leading-none mb-1">
                                {FILTER_LABELS[filter]}
                            </h1>
                            <p className="text-xs font-bold text-slate-400">
                                {totalItems} records detected {province && province !== 'Unassigned' ? `for ${getProvinceShortName(province)}` : 'globally'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by ID, District..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all w-full sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-slate-300" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing database...</p>
                    </div>
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <Icon size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">Queue is clear</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-xs">No reports currently match this filter criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {reports.map((item: any) => {
                        const dateStr = item.createdAt || item.submittedAt;
                        const dateObj = dateStr ? new Date(dateStr) : null;
                        const imgUrl = item.imageUrl || null;
                        const detailPath = `/staff/reports/${item.id}`;
                        return (
                            <div key={item.id} className="group/card relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
                                <div className="flex gap-4 p-6 pb-0">
                                    <div 
                                        className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 cursor-pointer hover:border-slate-300 transition-all"
                                        onClick={() => navigate(detailPath)}
                                    >
                                        {imgUrl ? (
                                            <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Eye size={20} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{item.id.split('-')[0]}</span>
                                            <StatusPill status={item.status as any} className="scale-75 origin-left" />
                                            {filter === 'overdue' && (
                                                <span className="bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-rose-100 animate-pulse">
                                                    {getDaysSince(dateStr)} Days Overdue
                                                </span>
                                            )}
                                        </div>
                                        <h3 
                                            className="text-base font-black text-slate-950 uppercase tracking-tight truncate leading-tight cursor-pointer hover:text-blue-700 transition-colors"
                                            onClick={() => navigate(detailPath)}
                                        >
                                            {item.description 
                                                ? String(item.description).replace(/^\[.*?\]\s*/, '').slice(0, 60) 
                                                : 'Coordinate Location'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {item.district || 'Unknown District'}</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} /> 
                                                {dateObj ? dateObj.toLocaleDateString() : 'N/A'}
                                            </span>
                                            {dateObj && (
                                                <span className="flex items-center gap-1 text-blue-500">
                                                    <Clock size={11} />
                                                    {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative group/eye shrink-0">
                                        <button 
                                            onClick={() => navigate(detailPath)}
                                            className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {imgUrl && (
                                            <div className="absolute right-0 top-full mt-2 z-30 w-56 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/20 opacity-0 invisible group-hover/eye:opacity-100 group-hover/eye:visible transition-all duration-300 pointer-events-none translate-y-2 group-hover/eye:translate-y-0 bg-white">
                                                <img src={imgUrl} alt="Preview" className="w-full h-36 object-cover" />
                                                <div className="p-3 bg-slate-50">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Click to view details</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {item.maintenanceNotes && (
                                    <div className="mx-6 mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Field Observations</p>
                                        <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed italic">"{item.maintenanceNotes}"</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-4 p-6 pt-5 border-t border-slate-50 mt-4">
                                    <div className="flex items-center gap-4">
                                        {item.priority && (
                                            <div className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                                                ['High', 'Urgent'].includes(item.priority) ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                                item.priority === 'Medium' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                "bg-slate-50 text-slate-500 border-slate-100"
                                            )}>
                                                {item.priority} Priority
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 ml-auto">
                                        {actionLoading === item.id ? (
                                            <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <Loader2 size={14} className="animate-spin" /> Processing
                                            </div>
                                        ) : (
                                            <>
                                                {filter === 'manual-review' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleQuickAction(item, 'reject')}
                                                            className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 bg-white border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button 
                                                            onClick={() => handleQuickAction(item, 'accept')}
                                                            className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            Verify
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => navigate(detailPath)}
                                                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-black transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                                                >
                                                    <Eye size={14} /> View Details
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalItems}
                limit={limit}
            />
        </div>
    );
};

export default FilteredReportList;
