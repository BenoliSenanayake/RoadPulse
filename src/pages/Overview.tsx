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
import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { getProvinceShortName } from '../lib/provinceResolver';
import { potholesApi, reportsApi, authApi, auditLogsApi } from '../lib/api';
import { formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import type { CitizenReport, PotholeEvent, AuditLog, User } from '../types';

const StatCard = ({ title, value, icon: Icon, colorClass, loading }: { title: string, value: string | number, icon: ElementType, colorClass: string, loading: boolean }) => {
    if (loading) return (
        <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
                <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
    );

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
            <div className="flex items-start justify-between">
                <div>
                    <p className="mb-2 text-sm font-medium text-slate-600">{title}</p>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{value}</h3>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", colorClass)}>
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
};

const Overview = () => {
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [provinceStats, setProvinceStats] = useState<{ province: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pResponse, rResponse, uResponse, aResponse, sData] = await Promise.all([
                potholesApi.list({ limit: 1000 }),
                reportsApi.list({ limit: 1000 }),
                authApi.listUsers({ limit: 1000 }),
                auditLogsApi.list({ limit: 1000 }),
                reportsApi.getProvinceStats()
            ]);
            console.log(`[Admin Overview] Live Data Sync: ${rResponse.data?.length} reports, ${pResponse.data?.length} pothole events.`);
            setPotholes(pResponse.data || []);
            setReports(rResponse.data || []);
            setUsers(uResponse.data || []);
            setAuditLogs(aResponse.data || []);
            setProvinceStats(sData || []);
        } catch (error) {
            console.error("[Admin Overview] Failed to load live overview data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        
        // Real-time synchronization: Poll every 30 seconds
        const interval = setInterval(() => {
            loadData();
        }, 30000);

        return () => clearInterval(interval);
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
            completed: potholes.filter(p => p.status === 'Completed').length,
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

    const sortedProvinceStats = useMemo(() => {
        return [...provinceStats]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [provinceStats]);

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-heading">Executive Overview</h1>
                    <p className="mt-2 text-sm text-slate-600">Real-time system data and jurisdictional activity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="btn-premium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
                        <Zap size={14} />
                        Refresh
                    </button>
                    <Link to="/admin/reports" className="btn-premium bg-slate-900 text-white hover:bg-slate-800">
                        <ShieldAlert size={14} />
                        Reports
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Attention Required */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700 ring-1 ring-amber-100">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="mb-1 text-sm font-semibold leading-none text-slate-950">Administrative priority</h3>
                                    <p className="text-sm text-slate-500">Reports awaiting human verification</p>
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
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-white"
                                >
                                    <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                                            <img src={report.imageUrl} alt="Pothole" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-slate-950">#{report.id.includes('-') && report.id.length < 15 ? report.id.split('-')[1] : report.id.slice(0, 8)}</span>
                                                <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Awaiting review</span>
                                            </div>
                                            <p className="flex items-center gap-1.5 text-xs text-slate-500">
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
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50">
                                        <CheckCircle2 size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">Queue clear</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Province Progress & Quick Actions */}
                <div className="space-y-8 h-full">
                    {/* Province Summary */}
                    <div className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 ring-1 ring-blue-100">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="mb-1 text-sm font-semibold leading-none text-slate-950">Regional activity</h3>
                                <p className="text-sm text-slate-500">Top jurisdictions by reports</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {sortedProvinceStats.map(stat => (
                                <div key={stat.province} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">{getProvinceShortName(stat.province)}</span>
                                        <span className="text-sm font-semibold text-slate-900">{stat.count}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, Math.max(15, (stat.count / (stats.totalReports || 1)) * 100))}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h4 className="mb-4 px-1 text-sm font-semibold text-slate-950">Quick actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/admin/users" className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-colors hover:bg-white">
                                    <UserPlus size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                    <span className="text-xs font-medium text-slate-800">Add user</span>
                                </Link>
                                <Link to="/admin/settings" className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-colors hover:bg-white">
                                    <Settings size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                    <span className="text-xs font-medium text-slate-800">Settings</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="text-slate-500" size={18} />
                            <h4 className="text-sm font-semibold text-slate-950">Security status</h4>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">
                            System is currently operating under standard governance protocols. All administrative overrides are being logged and audited.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-4 px-2">
                    <div className="rounded-lg bg-slate-900 p-2.5 text-white">
                        <History size={20} />
                    </div>
                    <div>
                        <h3 className="mb-1 text-sm font-semibold leading-none text-slate-950">Global activity stream</h3>
                        <p className="text-sm text-slate-500">Live system audit trail</p>
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
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{String(log.action ?? '').replace(/_/g, ' ')}</span>
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
                                            {getProvinceShortName(log.province) || 'Global'}
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
                    <Link to="/admin/audit-logs" className="flex items-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800">
                        View full audit records
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Overview;
