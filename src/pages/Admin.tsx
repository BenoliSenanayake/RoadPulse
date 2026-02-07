import { useMemo } from 'react';
import {
    MOCK_USERS,
    getPotholes,
    getRepairUpdates
} from '../mockData';
import {
    Users,
    ShieldCheck,
    Settings,
    FileText,
    UserPlus,
    ArrowRight,
    Database
} from 'lucide-react';
import { cn } from '../lib/utils';

const AdminPage = () => {
    // Aggregate all audit logs for demonstration
    const allAuditLogs = useMemo(() => {
        const potholes = getPotholes();
        let logs: any[] = [];
        potholes.forEach(p => {
            const updates = getRepairUpdates(p.id);
            updates.forEach(u => logs.push({ ...u, potholeId: p.id }));
        });
        return logs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, []);

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
                        <div className="p-4 border-b border-border flex items-center gap-2">
                            <FileText size={18} className="text-primary" />
                            <h4 className="font-bold">Central Governance Audit Log</h4>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {allAuditLogs.length === 0 ? (
                                <div className="p-12 text-center text-gray-400 text-sm">No administrative actions logged yet.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-white border-b border-border text-[9px] font-black text-gray-400 uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Timestamp</th>
                                            <th className="px-6 py-3">Actor</th>
                                            <th className="px-6 py-3">Action</th>
                                            <th className="px-6 py-3">Entity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {allAuditLogs.map(log => (
                                            <tr key={log.id} className="text-[11px] hover:bg-gray-50">
                                                <td className="px-6 py-3 text-gray-500">{new Date(log.updatedAt).toLocaleString()}</td>
                                                <td className="px-6 py-3 font-bold text-gray-700">{log.updatedBy}</td>
                                                <td className="px-6 py-3">
                                                    Changed status to <span className="font-black text-primary uppercase">{log.status}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1 font-mono text-gray-400">
                                                        {log.potholeId} <ArrowRight size={10} />
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
