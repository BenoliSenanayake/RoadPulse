import { useMemo, useState, useEffect } from 'react';
import {
    AlertTriangle,
    Clock,
    FileText,
    Users,
    CheckCircle2,
    Wrench,
    XCircle,
    HardHat,
    ArrowRight,
    MapPin,
    ShieldAlert,
    History,
    Zap,
    TrendingUp,
    ChevronRight,
    Settings,
    UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PROVINCIAL_COUNCILS, getProvinceShortName } from '../lib/provinceResolver';
import { potholesApi, reportsApi, authApi, auditLogsApi } from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import { formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import type { CitizenReport, PotholeEvent, AuditLog } from '../types';

const StatCard = ({ title, value, icon: Icon, colorClass, loading }: { title: string, value: string | number, icon: any, colorClass: string, loading: boolean }) => {
    if (loading) return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start justify-between">
            <div className="space-y-3">
                <Skeleton variant="text" className="w-20" />
                <Skeleton variant="text" className="w-12 h-8" />
            </div>
            <Skeleton variant="circle" className="w-10 h-10" />
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                </div>
                <div className={cn("p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110", colorClass)}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
};

const Overview = () => {
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pData, rData, uData, aData] = await Promise.all([
                potholesApi.list(),
                reportsApi.list(),
                authApi.listUsers(),
                auditLogsApi.list()
            ]);
            setPotholes(pData);
            setReports(rData);
            setUsers(uData);
            setAuditLogs(aData);
        } catch (error) {
            console.error("Failed to load overview data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const isOverdue = (item: CitizenReport | PotholeEvent) => {
        const dateStr = 'createdAt' in item ? item.createdAt : (item as PotholeEvent).timestamp;
        if (!dateStr) return false;
        const createdDate = new Date(dateStr);
        return ['New', 'Verified', 'Confirmed'].includes(item.status) && isAfter(subDays(new Date(), 14), createdDate);
    };

    const stats = useMemo(() => {
        return {
            totalReports: reports.length,
            verifiedReports: reports.filter(r => r.aiStatus === 'ACCEPTED').length,
            manualReview: reports.filter(r => r.aiStatus === 'PENDING').length,
            inProgress: potholes.filter(p => p.status === 'In Progress').length,
            completed: potholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length,
            rejected: reports.filter(r => r.aiStatus === 'REJECTED').length,
            overdue: [...reports, ...potholes].filter(isOverdue).length,
            activeOfficers: users.filter(u => u.role === 'MAINTENANCE_OFFICER').length
        };
    }, [reports, potholes, users]);

    const provinceSummary = useMemo(() => {
        return PROVINCIAL_COUNCILS.map(pc => {
            const pReports = reports.filter(r => r.provincialCouncil === pc);
            const pPotholes = potholes.filter(p => p.provincialCouncil === pc);
            return {
                name: pc,
                total: pReports.length + pPotholes.length,
                pending: pReports.filter(r => r.aiStatus === 'PENDING').length,
                active: pPotholes.filter(p => ['In Progress', 'Scheduled'].includes(p.status)).length
            };
        }).sort((a, b) => b.total - a.total);
    }, [reports, potholes]);

    const attentionReports = useMemo(() => {
        return reports.filter(r => r.aiStatus === 'PENDING').slice(0, 5);
    }, [reports]);

    return (
        <div className="space-y-10 pb-12 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">System Governance</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global infrastructure oversight and operations</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-10 px-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sys Operational</span>
                    </div>
                    <button 
                        onClick={loadData}
                        className="h-10 w-10 flex items-center justify-center bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 transition-colors"
                        title="Refresh Data"
                    >
                        <Zap size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Reports" 
                    value={stats.totalReports} 
                    icon={FileText} 
                    colorClass="bg-blue-600 shadow-blue-600/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="Verified Issues" 
                    value={stats.verifiedReports} 
                    icon={CheckCircle2} 
                    colorClass="bg-emerald-500 shadow-emerald-500/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="Needs Review" 
                    value={stats.manualReview} 
                    icon={Clock} 
                    colorClass="bg-amber-500 shadow-amber-500/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="In Progress" 
                    value={stats.inProgress} 
                    icon={Wrench} 
                    colorClass="bg-indigo-500 shadow-indigo-500/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="Completed" 
                    value={stats.completed} 
                    icon={HardHat} 
                    colorClass="bg-slate-900 shadow-slate-900/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="Rejected" 
                    value={stats.rejected} 
                    icon={XCircle} 
                    colorClass="bg-slate-400 shadow-slate-400/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="Overdue" 
                    value={stats.overdue} 
                    icon={AlertTriangle} 
                    colorClass="bg-rose-500 shadow-rose-500/20" 
                    loading={loading} 
                />
                <StatCard 
                    title="Active Officers" 
                    value={stats.activeOfficers} 
                    icon={Users} 
                    colorClass="bg-blue-400 shadow-blue-400/20" 
                    loading={loading} 
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Province Summary */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Provincial Jurisdictions</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Operational load per region</p>
                            </div>
                            <MapPin size={20} className="text-slate-300" />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Province</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Reports</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Needs Review</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Repairs</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {provinceSummary.map((p) => (
                                        <tr key={p.name} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{p.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{getProvinceShortName(p.name)} Unit</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center font-bold text-slate-900">{p.total}</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black",
                                                    p.pending > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                                                )}>
                                                    {p.pending}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center font-bold text-blue-600">{p.active}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", p.pending > 5 ? "bg-rose-500" : p.pending > 0 ? "bg-amber-500" : "bg-emerald-500")} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {p.pending > 5 ? "Critical" : p.pending > 0 ? "Active" : "Clear"}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Attention List */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Awaiting Authorization</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">High-priority reports requiring manual validation</p>
                            </div>
                            <ShieldAlert size={20} className="text-amber-500" />
                        </div>
                        <div className="divide-y divide-slate-50">
                            {attentionReports.length > 0 ? attentionReports.map((report) => (
                                <div key={report.id} className="p-6 flex items-center justify-between hover:bg-slate-50/30 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
                                            <img src={report.imageUrl} alt="Damage" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">#{report.id.split('-')[0]}</span>
                                                <span className="text-[10px] font-bold text-slate-300">•</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                                            </div>
                                            <h5 className="text-sm font-black text-slate-900 leading-none truncate max-w-md">{report.description || 'No description provided'}</h5>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/admin/reports`}
                                        className="h-10 px-4 flex items-center gap-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                    >
                                        Review <ChevronRight size={14} />
                                    </Link>
                                </div>
                            )) : (
                                <div className="p-12 text-center">
                                    <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-4" />
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Queue is Clear</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">No reports currently require manual attention.</p>
                                </div>
                            )}
                        </div>
                        {attentionReports.length > 0 && (
                            <div className="p-4 bg-slate-50/50 border-t border-slate-50">
                                <Link to="/admin/reports" className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                    View full verification queue <ArrowRight size={12} />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Operational Audit</h4>
                            <History size={16} className="text-slate-300" />
                        </div>
                        <div className="p-8 space-y-8">
                            {auditLogs.slice(0, 6).map((log, i) => (
                                <div key={log.id} className="flex gap-4 relative">
                                    {i !== 5 && <div className="absolute left-[7px] top-4 w-[2px] h-12 bg-slate-100" />}
                                    <div className={cn(
                                        "w-4 h-4 rounded-full mt-1 border-2 border-white shadow-sm shrink-0 z-10",
                                        log.action.includes('ACCEPTED') ? "bg-emerald-500" :
                                        log.action.includes('REJECTED') ? "bg-rose-500" : "bg-blue-500"
                                    )} />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-800 leading-tight">
                                            <span className="font-black text-slate-900">{log.actorName}</span> {log.details}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <Link to="/admin/audit-logs" className="block text-center text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline pt-4">
                                View Security Logs
                            </Link>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-[#0f172a] rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 text-white">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap size={14} className="text-blue-400" />
                            Tactical Actions
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            <Link to="/admin/reports" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={18} className="text-blue-400" />
                                    <span className="text-xs font-bold">Mass Verify Reports</span>
                                </div>
                                <ChevronRight size={14} className="text-white/20 group-hover:text-white" />
                            </Link>
                            <Link to="/admin/users" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <UserPlus size={18} className="text-blue-400" />
                                    <span className="text-xs font-bold">Add Field Personnel</span>
                                </div>
                                <ChevronRight size={14} className="text-white/20 group-hover:text-white" />
                            </Link>
                            <Link to="/admin/settings" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Settings size={18} className="text-blue-400" />
                                    <span className="text-xs font-bold">System Configuration</span>
                                </div>
                                <ChevronRight size={14} className="text-white/20 group-hover:text-white" />
                            </Link>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <TrendingUp size={16} className="text-slate-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Stats</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repair Efficiency</span>
                                    <span className="text-[10px] font-black text-slate-900">84%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full w-[84%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Load</span>
                                    <span className="text-[10px] font-black text-slate-900">22%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 rounded-full w-[22%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
