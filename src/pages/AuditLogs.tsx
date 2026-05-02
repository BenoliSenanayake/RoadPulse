import { useEffect, useMemo, useState } from 'react';
import { 
    FileClock, 
    Search, 
    Filter, 
    ArrowRight, 
    User, 
    Shield, 
    MapPin, 
    Calendar,
    Activity,
    Info,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ArrowUpRight,
    Terminal
} from 'lucide-react';
import { auditLogsApi } from '../lib/api';
import { PROVINCIAL_COUNCILS } from '../lib/provinceResolver';
import { Skeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import type { AuditLog, AuditLogAction, UserRole, ProvincialCouncil } from '../types';

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<AuditLogAction | 'ALL'>('ALL');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'SYSTEM' | 'ALL'>('ALL');
    const [provinceFilter, setProvinceFilter] = useState<ProvincialCouncil | 'ALL'>('ALL');

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await auditLogsApi.list();
            setLogs(data);
        } catch (error) {
            console.error("Failed to load audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
            const matchesRole = roleFilter === 'ALL' || log.actor === roleFilter;
            const matchesProvince = provinceFilter === 'ALL' || log.province === provinceFilter;
            
            return matchesSearch && matchesAction && matchesRole && matchesProvince;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, searchTerm, actionFilter, roleFilter, provinceFilter]);

    const getActionIcon = (action: AuditLogAction) => {
        switch (action) {
            case 'SUBMITTED': return <Activity className="text-blue-500" size={16} />;
            case 'AI_ACCEPTED':
            case 'MANUAL_ACCEPTED': return <CheckCircle2 className="text-emerald-500" size={16} />;
            case 'AI_REJECTED':
            case 'MANUAL_REJECTED': return <XCircle className="text-rose-500" size={16} />;
            case 'STATUS_CHANGED': return <Clock className="text-amber-500" size={16} />;
            case 'REPAIR_COMPLETED': return <CheckCircle2 className="text-blue-500" size={16} />;
            default: return <Info className="text-slate-400" size={16} />;
        }
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">System Audit Trail</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Immutable activity logs for all governance actions and status transitions</p>
                </div>
                <div className="bg-slate-900 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl shadow-slate-900/20">
                    <div className="flex flex-col">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Events</p>
                        <p className="text-xl font-black text-white tracking-tight">{logs.length}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <Terminal className="text-cyan-400" size={20} />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative lg:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Report ID / Keywords..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Actions</option>
                            <option value="SUBMITTED">Submission</option>
                            <option value="STATUS_CHANGED">Status Change</option>
                            <option value="AI_ACCEPTED">AI Accepted</option>
                            <option value="AI_REJECTED">AI Rejected</option>
                            <option value="REPAIR_COMPLETED">Repair Completed</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admins</option>
                            <option value="MAINTENANCE_OFFICER">Officers</option>
                            <option value="SYSTEM">System/AI</option>
                            <option value="CITIZEN">Citizens</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={provinceFilter}
                            onChange={(e) => setProvinceFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Provinces</option>
                            {PROVINCIAL_COUNCILS.map(pc => (
                                <option key={pc} value={pc}>{pc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setActionFilter('ALL');
                            setRoleFilter('ALL');
                            setProvinceFilter('ALL');
                        }}
                        className="py-3 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-bottom border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Time</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Action / Entity</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Transition</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Observation / Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-8 py-6"><Skeleton variant="text" className="w-24 h-4" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-32 h-4" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-28 h-4" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-32 h-4" /></td>
                                        <td className="px-8 py-6"><Skeleton variant="text" className="w-full h-4" /></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 tracking-tight">
                                                    {format(new Date(log.timestamp), 'dd MMM yyyy')}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(log.action)}
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                        {log.action.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                                        {log.entityType}
                                                    </span>
                                                    <span className="text-[9px] font-mono font-bold text-blue-600">{log.entityId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
                                                    log.actor === 'SYSTEM' ? 'bg-indigo-50 text-indigo-600' :
                                                    log.actor === 'ADMIN' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-slate-100 text-slate-600'
                                                )}>
                                                    {log.actorName?.charAt(0) || <Activity size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{log.actorName || 'RoadPulse System'}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Shield size={8} className="text-slate-300" />
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{log.actor.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            {log.newStatus ? (
                                                <div className="flex items-center gap-2">
                                                    {log.oldStatus && (
                                                        <>
                                                            <span className="text-[9px] font-black text-slate-400 line-through decoration-slate-300">{log.oldStatus}</span>
                                                            <ArrowRight size={10} className="text-slate-300" />
                                                        </>
                                                    )}
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                                        log.newStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        log.newStatus === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    )}>
                                                        {log.newStatus}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">No Change</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-bold text-slate-600 leading-tight line-clamp-2">{log.details}</p>
                                                {log.province && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin size={8} className="text-slate-300" />
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{log.province}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                                                <Terminal size={32} />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Zero system events logged</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Try relaxing your filters to see more history</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Status */}
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logging Engine Active</span>
                </div>
                <button className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    Export Immutable Logs <ArrowUpRight size={12} />
                </button>
            </div>
        </div>
    );
};

export default AuditLogs;
