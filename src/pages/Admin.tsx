import { useMemo, useState } from 'react';
import {
    MOCK_USERS,
    getAuditLogs
} from '../mockData';
import {
    Users,
    ShieldCheck,
    Settings,
    FileText,
    UserPlus,
    Filter,
    Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveDataList } from '../components/ResponsiveDataList';

const AdminPage = () => {
    const [filterAction, setFilterAction] = useState<string>('ALL');
    const [filterType, setFilterType] = useState<string>('ALL');

    const filteredLogs = useMemo(() => {
        let logs = getAuditLogs();

        if (filterAction !== 'ALL') {
            logs = logs.filter(l => l.action === filterAction);
        }
        if (filterType !== 'ALL') {
            logs = logs.filter(l => l.entityType === filterType);
        }

        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [filterAction, filterType]);

    const userColumns = [
        {
            header: 'Operator',
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
                    {user.role.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'Ops',
            className: 'text-right',
            render: () => (
                <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                    <Settings size={14} />
                </button>
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
                {user.role.replace('_', ' ')}
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
                    <span className="text-[8px] text-slate-400 font-black tracking-widest uppercase opacity-60 leading-none mt-1">{log.actor.replace('_', ' ')}</span>
                </div>
            )
        },
        {
            header: 'Protocol Flow',
            render: (log: any) => (
                <div className="flex flex-col gap-2 max-w-sm">
                    <span className="font-black text-[9px] px-2.5 py-1 rounded-lg bg-slate-900 text-white w-fit uppercase tracking-widest shadow-lg shadow-slate-900/10">
                        {log.action.replace('_', ' ')}
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
                    {log.action.replace('_', ' ')}
                </span>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed line-clamp-2">{log.details}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="section-heading mb-1">Internal Operations</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System-level personnel, protocols, and security logs</p>
                </div>
            </div>

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
                            data={MOCK_USERS}
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
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mt-0.5">Tactical Audit Trail</h4>
                            </div>

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
                                    <option value="REPORT">Intelligence</option>
                                    <option value="POTHOLE">Deployments</option>
                                </select>
                                <select
                                    className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl px-4 py-2 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                >
                                    <option value="ALL">All Vector Actions</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="AI_ACCEPTED">AI Validated</option>
                                    <option value="AI_REJECTED">AI Dismissed</option>
                                    <option value="MANUAL_ACCEPTED">Command Auth</option>
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

