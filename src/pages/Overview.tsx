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
import { StatusPill } from '../components/StatusPill';
import { getProvinceShortName } from '../lib/provinceResolver';
import { potholesApi, reportsApi, authApi, auditLogsApi } from '../lib/api';
import { formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import type { CitizenReport, PotholeEvent, AuditLog, User } from '../types';

const StatCard = ({ title, value, icon: Icon, type, loading }: { title: string, value: string | number, icon: ElementType, type: 'success' | 'warning' | 'danger' | 'info' | 'primary', loading: boolean }) => {
    const colorStyles = {
        success: 'bg-[var(--status-positive-bg)] text-[var(--status-positive-text)] border-[var(--status-positive-border)]',
        warning: 'bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-border)]',
        danger: 'bg-[var(--status-negative-bg)] text-[var(--status-negative-text)] border-[var(--status-negative-border)]',
        info: 'bg-[var(--status-progress-bg)] text-[var(--status-progress-text)] border-[var(--status-progress-border)]',
        primary: 'bg-slate-50 text-slate-500 border-slate-100'
    };

    if (loading) return (
        <div className="flex items-start justify-between rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="space-y-3">
                <div className="h-2 w-16 bg-slate-50 rounded-full animate-pulse" />
                <div className="h-8 w-12 bg-slate-50 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-slate-50 rounded-lg animate-pulse" />
        </div>
    );

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[var(--accent-border)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{title}</p>
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{value}</h3>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-colors", colorStyles[type])}>
                    <Icon size={16} />
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Executive Overview</h1>
                    <p className="mt-1 text-sm text-slate-500">Real-time system health and jurisdictional activity oversight.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="btn-premium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm">
                        <Zap size={14} />
                        Refresh Data
                    </button>
                    <Link to="/admin/reports" className="btn-premium bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
                        View All Reports
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* ... existing StatCard calls remain same ... */}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Attention Required */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-[var(--accent-bg)] p-2.5 text-[var(--accent-text)] border border-[var(--accent-border)]">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="mb-0.5 text-sm font-semibold leading-none text-slate-900">Priority Review</h3>
                                    <p className="text-xs text-slate-500">Reports awaiting administrative verification</p>
                                </div>
                            </div>
                            <Link to="/admin/reports" className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <ArrowRight size={20} />
                            </Link>
                        </div>

                        <div className="space-y-3 flex-1">
                            {attentionRequired.length > 0 ? attentionRequired.map(report => (
                                <Link 
                                    key={report.id} 
                                    to={`/admin/reports/${report.id}`}
                                    className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-[var(--accent-border)] hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-100 bg-slate-100">
                                            <img src={report.imageUrl} alt="Pothole" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-slate-900">#{report.id.slice(0, 8)}</span>
                                                <StatusPill status="New" label="Awaiting Review" />
                                            </div>
                                            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                <MapPin size={10} className="text-slate-400" />
                                                {report.district} &bull; {report.provincialCouncil}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">AI Conf.</p>
                                            <p className="text-xs font-semibold text-slate-900">{(report.aiConfidence! * 100).toFixed(0)}%</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)]">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Queue Clear</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Province Progress & Quick Actions */}
                <div className="space-y-8 h-full">
                    {/* Province Summary */}
                    <div className="h-fit rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="rounded-lg bg-slate-50 p-2.5 text-slate-400 border border-slate-100">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="mb-0.5 text-sm font-semibold leading-none text-slate-900">Regional activity</h3>
                                <p className="text-xs text-slate-500">Top jurisdictions by reports</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {sortedProvinceStats.map(stat => (
                                <div key={stat.province} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="max-w-[140px] truncate text-xs font-semibold text-slate-700 uppercase tracking-wide">{getProvinceShortName(stat.province)}</span>
                                        <span className="text-xs font-bold text-slate-900">{stat.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50">
                                        <div 
                                            className="h-full bg-[var(--accent-solid)] rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, Math.max(15, (stat.count / (stats.totalReports || 1)) * 100))}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 border-t border-slate-50 pt-6">
                            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Quick actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/admin/users" className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center transition-all hover:bg-white hover:border-[var(--accent-border)] hover:shadow-sm group">
                                    <UserPlus size={18} className="text-slate-400 group-hover:text-[var(--accent-text)] mb-2 transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Add Personnel</span>
                                </Link>
                                <Link to="/admin/settings" className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center transition-all hover:bg-white hover:border-[var(--accent-border)] hover:shadow-sm group">
                                    <Settings size={18} className="text-slate-400 group-hover:text-[var(--accent-text)] mb-2 transition-colors" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-900">System Config</span>
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
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-8 flex items-center gap-4 px-2">
                    <div className="rounded-lg bg-slate-900 p-2.5 text-white">
                        <History size={20} />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-sm font-semibold leading-none text-slate-900">System Activity Stream</h3>
                        <p className="text-xs text-slate-500">Live system audit trail across all nodes</p>
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
                                <tr key={log.id}>
                                    <td className="whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-slate-900">{formatDistanceToNow(new Date(log.timestamp))} ago</span>
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{log.timestamp.split('T')[0]}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-[var(--accent-solid)]" />
                                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{String(log.action ?? '').replace(/_/g, ' ')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-md bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-100 uppercase">
                                                {log.actorName?.charAt(0)}
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-600">{log.actorName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {getProvinceShortName(log.province) || 'Global'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <p className="text-[11px] font-medium text-slate-400 max-w-xs ml-auto truncate">{log.details}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 flex justify-center">
                    <Link to="/admin/audit-logs" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-all hover:text-slate-900">
                        View Full Records
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Overview;
