import { useEffect, useState, useMemo } from 'react';
import { authApi, auditLogsApi } from '../lib/api';
import {
    Users,
    ShieldCheck,
    Settings,
    FileText,
    UserPlus,
    Filter,
    Database,
    Download,
    Eye,
    ShieldAlert,
    Ban,
    CheckCircle,
    CalendarClock
} from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../lib/utils';
import { ResponsiveDataList } from '../components/ResponsiveDataList';

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
            render: (user: any) => <span className="font-black text-slate-900 tracking-tight">{user.name}</span>
        },
        {
            header: 'Digital Address',
            render: (user: any) => <span className="text-slate-500 font-bold">{user.email}</span>
        },
        {
            header: 'Clearance',
            render: (user: any) => (
                <span className={cn(
                    "badge px-3 py-1 border-none shadow-xs text-[10px]",
                    user.role === 'ADMIN' ? 'bg-rose-50 text-rose-700' :
                        user.role === 'MAINTENANCE_OFFICER' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                )}>
                    {String(user.role ?? '').replace(/_/g, ' ')}
                </span>
            )
        },
        {
            header: 'Jurisdiction',
            render: (user: any) => (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {user.provincialCouncil || 'Global Oversight'}
                </span>
            )
        },
        {
            header: 'Status',
            render: (user: any) => (
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    user.account_status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'
                )}>
                    {user.account_status || 'ACTIVE'}
                </span>
            )
        },
        {
            header: 'Ops',
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
                                    ? "text-rose-500 bg-white border-rose-50 hover:bg-rose-500 hover:text-white" 
                                    : "text-emerald-500 bg-white border-emerald-50 hover:bg-emerald-500 hover:text-white"
                            )}
                            title={user.account_status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                            {user.account_status === 'ACTIVE' ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                    )}
                    <button 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 rounded-lg transition-all"
                    >
                        <Eye size={14} />
                    </button>
                </div>
            )
        }
    ];

    const renderUserCard = (user: any) => (
        <div className="p-5 flex items-center justify-between">
            <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">{user.name}</h3>
                <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
            </div>
            <span className={cn(
                "badge border-none text-[9px]",
                user.role === 'ADMIN' ? 'bg-rose-50 text-rose-700' :
                    user.role === 'MAINTENANCE_OFFICER' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
            )}>
                {String(user.role ?? '').replace(/_/g, ' ')}
            </span>
        </div>
    );

    const logColumns = [
        {
            header: 'Timestamp',
            render: (log: any) => (
                <span className="text-slate-400 font-mono tracking-tighter">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            )
        },
        {
            header: 'Actor Alpha',
            render: (log: any) => (
                <div className="flex flex-col">
                    <span className="font-black text-slate-900 tracking-tight">{log.actorName || 'CORE_SYSTEM'}</span>
                    <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase opacity-60 leading-none mt-1">{String(log.actor ?? '').replace(/_/g, ' ')}</span>
                </div>
            )
        },
        {
            header: 'Protocol Flow',
            render: (log: any) => (
                <div className="flex flex-col gap-2 max-w-sm">
                    <span className="font-black text-[9px] px-2.5 py-1 rounded-lg bg-slate-900 text-white w-fit uppercase tracking-widest shadow-lg shadow-slate-900/10">
                        {String(log.action ?? '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-600 font-bold leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all truncate">
                        {log.details}
                    </span>
                </div>
            )
        },
        {
            header: 'Vector Target',
            className: 'text-right',
            render: (log: any) => (
                <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest border ${log.entityType === 'POTHOLE'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                        {log.entityType}
                    </span>
                    <div className="text-[9px] text-slate-300 font-mono font-black tracking-tighter">
                        ID: {log.entityId.split('-')[0]}...
                    </div>
                </div>
            )
        }
    ];

    const renderLogCard = (log: any) => (
        <div className="p-5 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 font-mono tracking-tighter mb-1">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 tracking-tight">{log.actorName || 'CORE_SYSTEM'}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest border ${log.entityType === 'POTHOLE'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                    {log.entityType}
                </span>
            </div>
            <div className="flex flex-col gap-2">
                <span className="font-black text-[8px] px-2 py-0.5 rounded-md bg-slate-900 text-white w-fit uppercase tracking-widest">
                    {String(log.action ?? '').replace(/_/g, ' ')}
                </span>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed line-clamp-2">{log.details}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="section-heading">Executive Overview</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Real-time system data & jurisdictional telemetry</p>
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 text-white rounded-2xl">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Personnel Detail</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account & Clearance Information</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <ArrowRight size={20} className="rotate-180" />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                    <p className="text-sm font-black text-slate-900">{selectedUser.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Role</p>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedUser.role?.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital ID</p>
                                    <p className="text-xs font-bold text-slate-600 truncate">{selectedUser.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedUser.account_status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')} />
                                        <p className="text-[10px] font-black text-slate-900 uppercase">{selectedUser.account_status || 'ACTIVE'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Jurisdiction</p>
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">{selectedUser.provincialCouncil || 'GLOBAL OVERSIGHT'}</p>
                                </div>
                            </div>
                            
                            <div className="pt-8 border-t border-slate-50 flex gap-4">
                                <button 
                                    onClick={() => {
                                        handleUserStatusToggle(selectedUser.id, selectedUser.account_status || 'ACTIVE');
                                        setSelectedUser(null);
                                    }}
                                    className={cn(
                                        "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg shadow-slate-900/5",
                                        selectedUser.account_status === 'ACTIVE' 
                                            ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white" 
                                            : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                    )}
                                >
                                    {selectedUser.account_status === 'ACTIVE' ? 'Deactivate Personnel' : 'Authorize Personnel'}
                                </button>
                                <button onClick={() => setSelectedUser(null)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* System Stats Sidebar */}
                <div className="space-y-8">
                    <div className="card-premium p-8 border-none overflow-hidden relative shadow-2xl shadow-slate-900/5 group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-1000" />
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Storage Tier</h4>
                        <div className="flex items-end gap-3 mb-4">
                            <span className="text-4xl font-black text-slate-900 tracking-tight">8.4</span>
                            <span className="text-xs font-black text-slate-400 pb-1.5 uppercase tracking-tighter">GB / 100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-slate-900 w-[8.4%] rounded-full" />
                        </div>
                    </div>

                    <div className="card-premium p-4 border-none shadow-2xl shadow-slate-900/5">
                        <nav className="space-y-1">
                            <button className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 text-xs font-black uppercase tracking-widest transition-all">
                                <div className="flex items-center gap-3"><Users size={16} /> Directory</div>
                            </button>
                            <button className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-black uppercase tracking-widest transition-all">
                                <div className="flex items-center gap-3"><ShieldCheck size={16} /> API Layer</div>
                            </button>
                            <button className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-black uppercase tracking-widest transition-all">
                                <div className="flex items-center gap-3"><Database size={16} /> Backups</div>
                            </button>
                            <button className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-black uppercase tracking-widest transition-all">
                                <div className="flex items-center gap-3"><Settings size={16} /> Protocols</div>
                            </button>
                        </nav>
                    </div>
                    <button 
                        onClick={exportLogsToCSV}
                        className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                {/* User Management & Audit Log */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Users Table */}
                    <div className="card-premium overflow-hidden border-none shadow-2xl shadow-slate-900/5">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                <Users size={14} />
                                Active Personnel
                            </h4>
                            <button className="text-[10px] font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest hover:text-accent transition-all px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <UserPlus size={14} /> Dispatch Agent
                            </button>
                        </div>
                        <ResponsiveDataList
                            data={users}
                            columns={userColumns}
                            renderCard={renderUserCard}
                            keyExtractor={(u) => u.id}
                        />
                    </div>

                    {/* Central Audit Log */}
                    <div className="card-premium overflow-hidden border-none shadow-2xl shadow-slate-900/5">
                        <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
                                    <FileText size={14} />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mt-0.5">System Activity Log</h4>
                            </div>

                            <button 
                                onClick={exportLogsToCSV}
                                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2"
                            >
                                <Download size={12} /> Export CSV
                            </button>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                                    <Filter size={12} /> Filter Ops
                                </div>
                                <select
                                    className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl px-4 py-2 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="ALL">All Nodes</option>
                                    <option value="REPORT">Reports</option>
                                    <option value="POTHOLE">Deployments</option>
                                </select>
                                <select
                                    className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl px-4 py-2 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                >
                                    <option value="ALL">All Actions</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="AI_ACCEPTED">AI Validated</option>
                                    <option value="AI_REJECTED">AI Dismissed</option>
                                    <option value="MANUAL_ACCEPTED">Manual Verification</option>
                                    <option value="MANUAL_REJECTED">Command Denied</option>
                                    <option value="STATUS_CHANGED">State Shift</option>
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

