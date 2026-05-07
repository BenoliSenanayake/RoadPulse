import { useMemo, useState, useEffect } from 'react';
import {
    AlertTriangle,
    Clock,
    FileText,
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
import { formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import type { CitizenReport, PotholeEvent, AuditLog } from '../types';

const StatCard = ({ title, value, icon: Icon, colorClass, loading }: { title: string, value: string | number, icon: any, colorClass: string, loading: boolean }) => {
    if (loading) return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-start justify-between">
            <div className="space-y-3">
                <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
    );

    return (
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group hover:-translate-y-1">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
                </div>
                <div className={cn("p-4 rounded-2xl text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", colorClass)}>
                    <Icon size={22} />
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
            verifiedReports: reports.filter(r => r.aiClassification === 'VERIFIED_POTHOLE').length,
            manualReview: reports.filter(r => !r.aiClassification || r.aiClassification === 'NEEDS_MANUAL_REVIEW').length,
            inProgress: potholes.filter(p => p.status === 'In Progress').length,
            completed: potholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length,
            rejected: reports.filter(r => r.aiClassification === 'REJECTED').length,
            overdue: [...reports, ...potholes].filter(isOverdue).length,
            activeOfficers: users.filter(u => u.role === 'MAINTENANCE_OFFICER' && u.status === 'ACTIVE').length,
        };
    }, [reports, potholes, users]);

    const attentionRequired = useMemo(() => {
        return reports.filter(r => !r.aiClassification || r.aiClassification === 'NEEDS_MANUAL_REVIEW').slice(0, 4);
    }, [reports]);

    const recentActivity = useMemo(() => {
        return auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, [auditLogs]);

    const provinceStats = useMemo(() => {
        return PROVINCIAL_COUNCILS.map(pc => {
            const pReports = reports.filter(r => r.provincialCouncil === pc);
            const pPotholes = potholes.filter(p => p.provincialCouncil === pc);
            return {
                name: pc,
                total: pReports.length + pPotholes.filter(p => !p.reportId).length,
                completed: pPotholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length
            };
        }).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [reports, potholes]);

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-heading">Executive Overview</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Real-time system intelligence & jurisdictional telemetry</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="btn-premium bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-50">
                        <Zap size={14} className="text-blue-500" />
                        Refresh Telemetry
                    </button>
                    <Link to="/admin/reports" className="btn-premium bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800">
                        <ShieldAlert size={14} className="text-blue-400" />
                        Global Records
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Telemetry" 
                    value={stats.totalReports} 
                    icon={FileText} 
                    colorClass="bg-slate-900" 
                    loading={loading}
                />
                <StatCard 
                    title="Verified Units" 
                    value={stats.verifiedReports} 
                    icon={CheckCircle2} 
                    colorClass="bg-emerald-500" 
                    loading={loading}
                />
                <StatCard 
                    title="Manual Review" 
                    value={stats.manualReview} 
                    icon={Clock} 
                    colorClass="bg-amber-500" 
                    loading={loading}
                />
                <StatCard 
                    title="System Overdue" 
                    value={stats.overdue} 
                    icon={AlertTriangle} 
                    colorClass="bg-rose-500" 
                    loading={loading}
                />
                <StatCard 
                    title="In Operation" 
                    value={stats.inProgress} 
                    icon={Wrench} 
                    colorClass="bg-blue-600" 
                    loading={loading}
                />
                <StatCard 
                    title="Completed Ops" 
                    value={stats.completed} 
                    icon={Zap} 
                    colorClass="bg-emerald-600" 
                    loading={loading}
                />
                <StatCard 
                    title="Rejected Data" 
                    value={stats.rejected} 
                    icon={XCircle} 
                    colorClass="bg-slate-400" 
                    loading={loading}
                />
                <StatCard 
                    title="Field Personnel" 
                    value={stats.activeOfficers} 
                    icon={HardHat} 
                    colorClass="bg-indigo-600" 
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attention Required */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Administrative Priority</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reports awaiting human verification</p>
                                </div>
                            </div>
                            <Link to="/admin/reports" className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <ArrowRight size={20} />
                            </Link>
                        </div>

                        <div className="space-y-4 flex-1">
                            {attentionRequired.length > 0 ? attentionRequired.map(report => (
                                <Link 
                                    key={report.id} 
                                    to={`/admin/reports/${report.id}`}
                                    className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-100 bg-slate-200">
                                            <img src={report.imageUrl} alt="Pothole" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-slate-900 uppercase">#{report.id.split('-')[1]}</span>
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-widest">Awaiting Review</span>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                                <MapPin size={10} className="text-slate-400" />
                                                {report.district} &bull; {report.provincialCouncil}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">AI Conf</p>
                                            <p className="text-xs font-bold text-slate-400">{(report.aiConfidence! * 100).toFixed(0)}%</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-4">
                                        <CheckCircle2 size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Queue Clear</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Province Progress & Quick Actions */}
                <div className="space-y-8 h-full">
                    {/* Province Summary */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm h-fit">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Regional Ops</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top jurisdictional activity</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {provinceStats.map(stat => (
                                <div key={stat.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate max-w-[140px]">{getProvinceShortName(stat.name as any)}</span>
                                        <span className="text-xs font-black text-slate-900">{stat.total} Reports</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.max(15, (stat.completed / (stat.total || 1)) * 100)}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-50">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Quick Protocols</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/admin/users" className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all group text-center">
                                    <UserPlus size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Add User</span>
                                </Link>
                                <Link to="/admin/settings" className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all group text-center">
                                    <Settings size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Settings</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="text-blue-400" size={18} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Security Status</h4>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                            System is currently operating under standard governance protocols. All administrative overrides are being logged and audited.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                <div className="flex items-center gap-4 mb-8 px-2">
                    <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-lg shadow-slate-900/10">
                        <History size={20} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Global Activity Stream</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live system audit trail</p>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Protocol Action</th>
                                <th>Personnel</th>
                                <th>Jurisdiction</th>
                                <th className="text-right">Audit Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-900 uppercase">{formatDistanceToNow(new Date(log.timestamp))} ago</span>
                                            <span className="text-[9px] font-bold text-slate-400">{log.timestamp.split('T')[0]}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{log.action.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 uppercase">
                                                {log.actorName?.charAt(0)}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600">{log.actorName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {getProvinceShortName(log.province as any) || 'Global'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <p className="text-[11px] font-bold text-slate-500 max-w-xs ml-auto truncate">{log.details}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center">
                    <Link to="/admin/audit-logs" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-700 flex items-center gap-2 group transition-all">
                        Access Full Audit Records
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Overview;
