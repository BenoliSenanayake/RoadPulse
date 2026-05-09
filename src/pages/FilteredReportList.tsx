import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
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
    ChevronRight,
    Loader2,
    Search,
    XCircle,
    History
} from 'lucide-react';
import { potholesApi, reportsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/StatusPill';
import { cn } from '../lib/utils';
import { getProvinceShortName } from '../lib/provinceResolver';
import type { CitizenReport, PotholeEvent, RepairPriority } from '../types';

type ReportFilter = 'verified' | 'manual-review' | 'in-progress' | 'completed' | 'overdue' | 'rejected' | 'all';

const FILTER_LABELS: Record<ReportFilter, string> = {
    'verified': 'Verified Pothole Reports',
    'manual-review': 'Manual Review Required',
    'in-progress': 'In Progress Repairs',
    'completed': 'Completed Repairs',
    'overdue': 'Overdue Repairs',
    'rejected': 'Rejected Reports',
    'all': 'All RoadPulse Reports'
};

const FILTER_ICONS: Record<ReportFilter, any> = {
    'verified': CheckCircle2,
    'manual-review': ShieldAlert,
    'in-progress': Wrench,
    'completed': CheckCircle2,
    'overdue': AlertTriangle,
    'rejected': XCircle,
    'all': History
};

const FILTER_COLORS: Record<ReportFilter, string> = {
    'verified': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'manual-review': 'text-amber-600 bg-amber-50 border-amber-100',
    'in-progress': 'text-blue-600 bg-blue-50 border-blue-100',
    'completed': 'text-slate-600 bg-slate-50 border-slate-100',
    'overdue': 'text-rose-600 bg-rose-50 border-rose-100',
    'rejected': 'text-slate-600 bg-slate-50 border-slate-100',
    'all': 'text-slate-900 bg-slate-100 border-slate-200'
};

const isOverdue = (item: CitizenReport | PotholeEvent) => {
    const dateStr = 'createdAt' in item ? item.createdAt : (item as PotholeEvent).timestamp;
    if (!dateStr) return false;
    
    const createdDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return ['New', 'Verified', 'Confirmed'].includes(item.status) && diffDays > 14;
};

const getDaysSince = (dateStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const today = new Date();
    return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};


const FilteredReportList = () => {
    const { filter: rawFilter } = useParams<{ filter: string }>();
    const filter = (rawFilter || 'all') as ReportFilter;
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (rawFilter && !FILTER_LABELS[rawFilter as ReportFilter]) {
            navigate('/staff/overview');
        }
    }, [rawFilter, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const filters = (province && province !== 'Unassigned') ? { provincialCouncil: province } : {};
            const [pData, rData] = await Promise.all([
                potholesApi.list(filters),
                reportsApi.list(filters)
            ]);
            
            setPotholes(pData);
            setReports(rData);
        } catch (error) {
            console.error("Failed to load reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [province]);

    const displayItems = useMemo(() => {
        const allItems = [...reports, ...potholes.filter(p => !reports.some(r => r.id === p.id))];
        let items: (CitizenReport | PotholeEvent)[] = [];

        switch (filter) {
            case 'verified':
                items = allItems.filter(item => 
                    ['Verified', 'Confirmed'].includes(item.status) || 
                    (item as any).aiClassification === 'VERIFIED_POTHOLE'
                );
                break;
            case 'manual-review':
                items = allItems.filter(item => 
                    item.status === 'New' || 
                    (item as any).aiClassification === 'NEEDS_MANUAL_REVIEW'
                );
                break;
            case 'in-progress':
                items = allItems.filter(item => item.status === 'In Progress');
                break;
            case 'completed':
                items = allItems.filter(item => ['Completed', 'Fixed'].includes(item.status));
                break;
            case 'overdue':
                items = allItems.filter(isOverdue);
                break;
            case 'rejected':
                items = allItems.filter(item => 
                    item.status === 'Rejected' || 
                    (item as any).aiClassification === 'REJECTED'
                );
                break;
            case 'all':
                items = allItems;
                break;
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.id.toLowerCase().includes(term) || 
                (item.district || '').toLowerCase().includes(term) ||
                ('roadName' in item && (item.roadName || '').toLowerCase().includes(term))
            );
        }

        return items.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [filter, potholes, reports, searchTerm]);

    const handleQuickAction = async (item: any, action: string, value?: any) => {
        setActionLoading(item.id);
        try {
            if (filter === 'manual-review') {
                if (action === 'accept') {
                    await reportsApi.review(item.id, 'accept');
                } else if (action === 'reject') {
                    const reason = window.prompt("Reason for rejection:");
                    if (reason) await reportsApi.review(item.id, 'reject', reason);
                }
            } else if (filter === 'verified') {
                if (action === 'priority') {
                    await potholesApi.scheduleRepair(item.id, { 
                        priority: value as RepairPriority,
                        repairStatus: item.status as any,
                        assignedTeam: (item as any).assignedTeam || 'Unassigned',
                        scheduledDate: (item as any).timestamp || (item as any).createdAt || new Date().toISOString(),
                        maintenanceNotes: (item as any).maintenanceNotes || ''
                    }, user?.name);
                } else if (action === 'start') {
                    await potholesApi.updateStatus(item.id, 'In Progress', 'Work started from priority queue.', user?.name);
                }
            } else if (filter === 'in-progress') {
                if (action === 'complete') {
                    await potholesApi.updateStatus(item.id, 'Completed', 'Maintenance work finalized.', user?.name);
                }
            } else if (filter === 'overdue') {
                if (action === 'update') {
                    navigate(`/potholes/${item.id}`);
                    return;
                }
            } else if (filter === 'rejected') {
                if (action === 'restore') {
                    await reportsApi.review(item.id, 'accept', 'Report manually moved from Rejected to Verified by officer');
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
                                {displayItems.length} records detected {province && province !== 'Unassigned' ? `for ${getProvinceShortName(province)}` : 'globally'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by ID..."
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
            ) : displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <Icon size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">Queue is clear</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-xs">No reports currently match this filter criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {displayItems.map((item: any) => {
                        const dateStr = 'createdAt' in item ? item.createdAt : item.timestamp;
                        const dateObj = dateStr ? new Date(dateStr) : null;
                        const imgUrl = item.imageUrl || null;
                        const detailPath = `/staff/reports/${item.id}`;
                        return (
                        <div key={item.id} className="group/card relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300">
                            {/* Top: Image thumbnail + info + eye preview */}
                            <div className="flex gap-4 p-6 pb-0">
                                {/* Image thumbnail */}
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

                                {/* Report info */}
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
                                        {'description' in item && item.description 
                                            ? String(item.description).replace(/^\[.*?\]\s*/, '').slice(0, 60) 
                                            : ('roadName' in item ? (item.roadName || 'Unnamed Road') : 'Coordinate Location')}
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

                                {/* Eye button with image preview tooltip */}
                                <div className="relative group/eye shrink-0">
                                    <button 
                                        onClick={() => navigate(detailPath)}
                                        className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-950 hover:text-white transition-all shadow-sm"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {/* Hover preview popup */}
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
                                    {(item as any).priority && (
                                        <div className={cn(
                                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                                            ['High', 'Urgent'].includes((item as any).priority) ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                            (item as any).priority === 'Medium' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            "bg-slate-50 text-slate-500 border-slate-100"
                                        )}>
                                            {(item as any).priority} Priority
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
                                            {/* View Details button — always visible */}
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
        </div>
    );
};

export default FilteredReportList;
