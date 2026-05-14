import { useEffect, useState } from 'react';
import { 
    FileClock, 
    Search, 
    Filter, 
    ArrowRight, 
    User, 
    MapPin, 
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    Info,
    ChevronDown,
    Terminal,
    RefreshCw
} from 'lucide-react';
import { auditLogsApi } from '../lib/api';
import { getProvinceShortName } from '../lib/provinceResolver';
import { cn } from '../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import type { AuditLog, AuditLogAction, UserRole, ProvincialCouncil } from '../types';
import { Pagination } from '../components/Pagination';

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<AuditLogAction | 'ALL'>('ALL');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'SYSTEM' | 'ALL'>('ALL');
    const [provinceFilter, setProvinceFilter] = useState<ProvincialCouncil | 'ALL'>('ALL');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await auditLogsApi.list({
                page,
                limit,
                action: actionFilter === 'ALL' ? undefined : actionFilter,
                search: searchTerm
            });
            setLogs(response.data);
            setTotalPages(response.total_pages);
            setTotalItems(response.total);
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [page, actionFilter, searchTerm]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [actionFilter, searchTerm]);

    const getActionIcon = (action: AuditLogAction) => {
        switch (action) {
            case 'SUBMITTED': return <Activity className="text-[var(--info-text)]" size={14} />;
            case 'AI_ACCEPTED':
            case 'MANUAL_ACCEPTED': return <CheckCircle2 className="text-[var(--success-text)]" size={14} />;
            case 'AI_REJECTED':
            case 'MANUAL_REJECTED': return <XCircle className="text-[var(--danger-text)]" size={14} />;
            case 'STATUS_CHANGED': return <Clock className="text-[var(--warning-text)]" size={14} />;
            case 'REPAIR_COMPLETED': return <CheckCircle2 className="text-[var(--info-text)]" size={14} />;
            default: return <Info className="text-slate-400" size={14} />;
        }
    };

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">System Audit Trail</h1>
                    <p className="mt-1 text-sm text-slate-500 font-medium">Complete history of system events and administrative decisions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-100 px-5 py-2 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="flex flex-col">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Global Events</p>
                            <p className="text-lg font-semibold text-slate-900 tracking-tight leading-none">{totalItems}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <Terminal className="text-slate-300" size={18} />
                    </div>
                    <button onClick={loadLogs} className="flex items-center justify-center w-10 h-10 bg-white text-slate-400 border border-slate-100 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
                        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Filter Console */}
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative group lg:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search logs..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-900 outline-none transition-all focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)]"
                        />
                    </div>
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-700 outline-none appearance-none cursor-pointer focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)]"
                        >
                            <option value="ALL">All Protocols</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="STATUS_CHANGED">Status Update</option>
                            <option value="MANUAL_ACCEPTED">Manual Acceptance</option>
                            <option value="MANUAL_REJECTED">Manual Rejection</option>
                            <option value="AI_ACCEPTED">AI Verified</option>
                            <option value="AI_REJECTED">AI Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-700 outline-none appearance-none cursor-pointer disabled:opacity-50"
                            disabled
                        >
                            <option value="ALL">All Actors</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={provinceFilter}
                            onChange={(e) => setProvinceFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-700 outline-none appearance-none cursor-pointer disabled:opacity-50"
                            disabled
                        >
                            <option value="ALL">All Provinces</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setActionFilter('ALL');
                            setPage(1);
                        }}
                        className="px-4 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        Reset Trail
                    </button>
                </div>
            </div>

            {/* Audit Trail Table */}
            <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Protocol Action</th>
                                <th>Actor / Role</th>
                                <th>Jurisdiction</th>
                                <th>Event Observation</th>
                                <th className="text-right px-8">Linked Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!loading && logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">
                                                    {formatDistanceToNow(new Date(log.timestamp))} ago
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {format(new Date(log.timestamp), 'dd MMM, HH:mm')}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                    {getActionIcon(log.action)}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                                    {String(log.action ?? '').replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                    {log.actor === 'SYSTEM' ? <Terminal size={14} className="text-slate-400" /> : <User size={14} className="text-slate-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-semibold text-slate-900 tracking-tight leading-none mb-1">{log.actorName || 'AI Engine'}</p>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.actor}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {log.province ? getProvinceShortName(log.province as any) : 'Global'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="max-w-md">
                                                <p className="text-[11px] font-medium text-slate-600 leading-relaxed uppercase tracking-tight group-hover:text-slate-900 transition-colors">
                                                    {log.details}
                                                </p>
                                                {log.oldStatus && log.newStatus && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.oldStatus}</span>
                                                        <ArrowRight size={10} className="text-slate-300" />
                                                        <span className="px-1.5 py-0.5 bg-[var(--accent-bg)] text-[var(--accent-solid)] rounded text-[8px] font-bold uppercase tracking-widest border border-[var(--accent-border)]">{log.newStatus}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-right px-8">
                                            <span className="inline-flex px-2 py-0.5 rounded-lg text-[9px] bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-widest font-bold">
                                                {log.entityId.slice(0, 8)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-8 py-5">
                                            <div className="h-6 w-full bg-slate-50 animate-pulse rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6">
                                                <FileClock size={24} />
                                            </div>
                                            <h4 className="text-base font-semibold text-slate-900">No Logs Found</h4>
                                            <p className="text-sm text-slate-500 mt-1">No system activity matches your current filter criteria.</p>
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

export default AuditLogs;
