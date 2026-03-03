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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">System Administration</h1>
                    <p className="text-sm text-gray-500">Manage users, permissions, and system audit logs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* System Stats Sidebar */}
                <div className="space-y-6">
                    <div className="card p-6 border-l-4 border-l-primary">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Storage Usage</h4>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-black text-text">8.4</span>
                            <span className="text-sm font-bold text-gray-500 pb-1">GB / 100GB</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[8.4%]" />
                        </div>
                    </div>

                    <div className="card p-4">
                        <nav className="space-y-1">
                            <button className="flex items-center justify-between w-full px-3 py-2 text-sm font-bold text-primary bg-primary/5 rounded-lg">
                                <div className="flex items-center gap-3"><Users size={18} /> Users & Roles</div>
                            </button>
                            <button className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3"><ShieldCheck size={18} /> API Configuration</div>
                            </button>
                            <button className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3"><Database size={18} /> Database Backups</div>
                            </button>
                            <button className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3"><Settings size={18} /> System Settings</div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* User Management & Audit Log */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Users Table */}
                    <div className="card">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h4 className="font-bold flex items-center gap-2">
                                <Users size={18} className="text-primary" />
                                Personnel Directory
                            </h4>
                            <button className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase hover:underline">
                                <UserPlus size={14} /> Add New User
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {MOCK_USERS.map(user => (
                                        <tr key={user.id} className="text-sm">
                                            <td className="px-6 py-4 font-bold">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    user.role === 'ADMIN' ? 'bg-red-100 text-red-600' :
                                                        user.role === 'MAINTENANCE_OFFICER' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                                                )}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-gray-400 hover:text-primary transition-colors">
                                                    <Settings size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Central Audit Log */}
                    <div className="card">
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                <h4 className="font-bold tracking-tight">System Audit Trail</h4>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 border border-gray-200">
                                    <Filter size={14} /> Filters
                                </div>
                                <select
                                    className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-primary shadow-sm"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="ALL">All Entities</option>
                                    <option value="REPORT">Citizen Reports</option>
                                    <option value="POTHOLE">Potholes</option>
                                </select>
                                <select
                                    className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-primary shadow-sm"
                                    value={filterAction}
                                    onChange={(e) => setFilterAction(e.target.value)}
                                >
                                    <option value="ALL">All Actions</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="AI_ACCEPTED">AI Accepted</option>
                                    <option value="AI_REJECTED">AI Rejected</option>
                                    <option value="MANUAL_ACCEPTED">Manual Accepted</option>
                                    <option value="MANUAL_REJECTED">Manual Rejected</option>
                                    <option value="STATUS_CHANGED">Status Changed</option>
                                </select>
                            </div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto w-full custom-scroll">
                            {filteredLogs.length === 0 ? (
                                <div className="p-16 text-center text-gray-400 text-sm font-medium">No actions match the current filters.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-gray-50 border-b border-border text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-sm">
                                        <tr>
                                            <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                                            <th className="px-6 py-4">Actor</th>
                                            <th className="px-6 py-4">Event Flow</th>
                                            <th className="px-6 py-4 border-l border-gray-200 text-right">Target</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLogs.map(log => (
                                            <tr key={log.id} className="text-xs hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap font-medium">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800">{log.actorName || 'System'}</span>
                                                        <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase">{log.actor.replace('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 max-w-sm">
                                                        <span className="font-black text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-700 w-fit uppercase tracking-widest">
                                                            {log.action.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-gray-600 truncate" title={log.details}>
                                                            {log.details}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-l border-gray-50 text-right">
                                                    <span className={`px-2 py-1 rounded font-black text-[10px] uppercase tracking-widest ${log.entityType === 'POTHOLE' ? 'bg-orange-100 text-orange-800 border-orange-200 border' : 'bg-blue-100 text-blue-800 border-blue-200 border'}`}>
                                                        {log.entityType}
                                                    </span>
                                                    <div className="text-[10px] text-gray-400 font-mono mt-1">
                                                        {log.entityId}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
