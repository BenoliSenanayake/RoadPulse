import { useEffect, useState, useMemo } from 'react';
import { authApi, auditLogsApi } from '../lib/api';
import {
    Users,
    ShieldCheck,
    FileText,
    UserPlus,
    Database,
    Download,
    Eye,
    Ban,
    CheckCircle,
    ArrowRight,
    X
} from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { ResponsiveDataList } from '../components/ResponsiveDataList';
import { StatusPill } from '../components/StatusPill';

const AdminPage = () => {
    const [filterAction, setFilterAction] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [logs, setLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const uData = await authApi.listUsers();
            const aData = await auditLogsApi.list();
            setUsers(uData.data || []);
            setLogs(aData.data || []);
        } catch (e) {
            console.error("Admin data load failed", e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredLogs = useMemo(() => {
        let currentLogs = [...logs];

        if (filterAction !== 'ALL') {
            currentLogs = currentLogs.filter(l => l.action === filterAction);
        }
        if (filterType !== 'ALL') {
            currentLogs = currentLogs.filter(l => l.entityType === filterType);
        }

        return currentLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [filterAction, filterType, logs]);

    const handleUserStatusToggle = async (userId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
        if (!window.confirm(`Are you sure you want to ${nextStatus.toLowerCase()} this user?`)) return;
        
        setActionLoading(userId);
        try {
            await authApi.updateUserStatus(userId, nextStatus as any);
            await loadData();
        } catch (e) {
            alert("Failed to update user status");
        } finally {
            setActionLoading(null);
        }
    };

    const exportLogsToCSV = () => {
        const data = filteredLogs.map(l => ({
            Timestamp: l.timestamp,
            Action: l.action,
            Actor: l.actorName,
            Role: l.actor,
            Entity: l.entityType,
            EntityID: l.entityId,
            Details: l.details
        }));
        
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `roadpulse_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const userColumns = [
        {
            header: 'Personnel',
            render: (user: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 leading-tight">{user.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{user.email}</span>
                </div>
            )
        },
        {
            header: 'Clearance',
            render: (user: any) => (
                <StatusPill 
                    status={user.role === 'ADMIN' ? 'REJECTED' : user.role === 'MAINTENANCE_OFFICER' ? 'VERIFIED_POTHOLE' : 'PENDING'} 
                />
            )
        },
        {
            header: 'Jurisdiction',
            render: (user: any) => (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {user.provincialCouncil || 'Global Oversight'}
                </span>
            )
        },
        {
            header: 'Status',
            render: (user: any) => (
                <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", user.account_status === 'ACTIVE' ? "bg-emerald-500" : "bg-rose-500")} />
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        user.account_status === 'ACTIVE' ? 'text-slate-600' : 'text-rose-500'
                    )}>
                        {user.account_status || 'ACTIVE'}
                    </span>
                </div>
            )
        },
        {
            header: 'Operations',
            className: 'text-right',
            render: (user: any) => (
                <div className="flex items-center justify-end gap-2">
                    {actionLoading === user.id ? (
                        <div className="h-4 w-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    ) : (
                        <button 
                            onClick={() => handleUserStatusToggle(user.id, user.account_status || 'ACTIVE')}
                            className={cn(
                                "p-2 rounded-lg transition-all border shadow-sm",
                                user.account_status === 'ACTIVE' 
                                    ? "text-rose-500 bg-white border-slate-100 hover:bg-rose-50" 
                                    : "text-emerald-600 bg-white border-slate-100 hover:bg-emerald-50"
                            )}
                        >
                            {user.account_status === 'ACTIVE' ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                    )}
                    <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all"
                    >
                        <Eye size={14} />
                    </button>
                </div>
            )
        }
    ];

    const renderUserCard = (user: any) => (
        <div className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-slate-900">{user.name}</h3>
                <p className="text-[10px] font-medium text-slate-500">{user.email}</p>
            </div>
            <StatusPill 
                status={user.role === 'ADMIN' ? 'REJECTED' : user.role === 'MAINTENANCE_OFFICER' ? 'VERIFIED_POTHOLE' : 'PENDING'} 
            />
        </div>
    );

    const logColumns = [
        {
            header: 'Timestamp',
            render: (log: any) => (
                <div className="flex flex-col">
                    <span className="text-slate-900 font-medium text-xs">
                        {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            header: 'Actor',
            render: (log: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{log.actorName || 'Core System'}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{String(log.actor ?? '').replace(/_/g, ' ')}</span>
                </div>
            )
        },
        {
            header: 'Activity',
            render: (log: any) => (
                <div className="flex flex-col gap-1 max-w-sm">
                    <span className="font-bold text-[9px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100 w-fit uppercase tracking-wider">
                        {String(log.action ?? '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500 text-[11px] leading-relaxed line-clamp-1">
                        {log.details}
                    </span>
                </div>
            )
        },
        {
            header: 'Subject',
            className: 'text-right',
            render: (log: any) => (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.entityType}</span>
                    <div className="text-[9px] text-slate-400 font-mono">
                        {log.entityId.slice(0, 8)}
                    </div>
                </div>
            )
        }
    ];

    const renderLogCard = (log: any) => (
        <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 font-mono mb-1">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900">{log.actorName || 'Core System'}</h4>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.entityType}</span>
            </div>
            <div className="flex flex-col gap-2">
                <span className="font-bold text-[9px] px-2 py-0.5 rounded bg-slate-900 text-white w-fit uppercase tracking-wider">
                    {String(log.action ?? '').replace(/_/g, ' ')}
                </span>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{log.details}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">System Governance</h1>
                    <p className="mt-1 text-sm text-slate-500">Administrative personnel & audit control oversight.</p>
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-900 text-white rounded-lg">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 leading-none mb-1">Personnel Detail</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account & Clearance Information</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                                    <p className="text-sm font-semibold text-slate-900">{selectedUser.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Role</p>
                                    <p className="text-sm font-semibold text-slate-900 uppercase">{selectedUser.role?.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital ID</p>
                                    <p className="text-xs font-medium text-slate-600 truncate">{selectedUser.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedUser.account_status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')} />
                                        <p className="text-[10px] font-bold text-slate-900 uppercase">{selectedUser.account_status || 'ACTIVE'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned Jurisdiction</p>
                                    <p className="text-xs font-semibold text-slate-700 uppercase">{selectedUser.provincialCouncil || 'GLOBAL OVERSIGHT'}</p>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-slate-50 flex gap-3">
                                <button 
                                    onClick={() => {
                                        handleUserStatusToggle(selectedUser.id, selectedUser.account_status || 'ACTIVE');
                                        setSelectedUser(null);
                                    }}
                                    className={cn(
                                        "flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                                        selectedUser.account_status === 'ACTIVE' 
                                            ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white" 
                                            : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                    )}
                                >
                                    {selectedUser.account_status === 'ACTIVE' ? 'Deactivate Personnel' : 'Authorize Personnel'}
                                </button>
                                <button onClick={() => setSelectedUser(null)} className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-6">
                    <div className="card-premium p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-bg)] rounded-bl-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-700" />
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-4">Cloud Storage</h4>
                        <div className="flex items-end gap-1.5 mb-4">
                            <span className="text-3xl font-semibold text-slate-900">8.4</span>
                            <span className="text-sm font-medium text-slate-400 pb-1">GB / 100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent-solid)] w-[8.4%] rounded-full" />
                        </div>
                    </div>

                    <div className="card-premium p-1.5">
                        <nav className="space-y-0.5">
                            <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)] text-xs font-semibold transition-all">
                                <Users size={14} /> Personnel Directory
                            </button>
                            <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-all">
                                <ShieldCheck size={14} /> Security Logs
                            </button>
                            <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-all">
                                <Database size={14} /> System Backups
                            </button>
                        </nav>
                    </div>
                    <button 
                        onClick={exportLogsToCSV}
                        className="px-4 py-2.5 w-full bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={13} /> Export Logs
                    </button>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="card-premium overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                <Users size={14} className="text-slate-400" />
                                Personnel Directory
                            </h4>
                            <button className="text-[10px] font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider hover:bg-slate-50 transition-all px-3 py-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
                                <UserPlus size={13} /> Add Officer
                            </button>
                        </div>
                        <ResponsiveDataList
                            data={users}
                            columns={userColumns}
                            renderCard={renderUserCard}
                            keyExtractor={(u) => u.id}
                        />
                    </div>

                    <div className="card-premium overflow-hidden">
                        <div className="p-5 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white border border-slate-100 text-slate-500 shadow-sm">
                                    <FileText size={14} />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Audit Trail</h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-100 rounded-lg px-3 py-1.5 outline-none"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="ALL">All Nodes</option>
                                    <option value="REPORT">Reports</option>
                                    <option value="POTHOLE">Deployments</option>
                                </select>
                                <select
                                    className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-100 rounded-lg px-3 py-1.5 outline-none"
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                >
                                    <option value="ALL">All Actions</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="AI_ACCEPTED">Validated</option>
                                    <option value="AI_REJECTED">Dismissed</option>
                                    <option value="MANUAL_ACCEPTED">Verified</option>
                                    <option value="MANUAL_REJECTED">Denied</option>
                                </select>
                            </div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto w-full custom-scroll">
                            <ResponsiveDataList
                                data={filteredLogs}
                                columns={logColumns}
                                renderCard={renderLogCard}
                                keyExtractor={(l) => l.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

