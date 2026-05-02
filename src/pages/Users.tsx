import { useEffect, useMemo, useState } from 'react';
import { 
    Search, 
    Filter, 
    UserCog, 
    ShieldCheck, 
    Users as UsersIcon, 
    HardHat, 
    Mail, 
    Calendar, 
    Clock, 
    ChevronDown,
    MoreVertical,
    UserCheck,
    UserX,
    MapPin,
    ArrowUpRight
} from 'lucide-react';
import { authApi } from '../lib/api';
import { PROVINCIAL_COUNCILS } from '../lib/provinceResolver';
import { Skeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import type { User, UserRole, ProvincialCouncil } from '../types';

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [provinceFilter, setProvinceFilter] = useState<ProvincialCouncil | 'ALL'>('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await authApi.listUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 user.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            const matchesProvince = provinceFilter === 'ALL' || user.provincialCouncil === provinceFilter;
            
            return matchesSearch && matchesRole && matchesProvince;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [users, searchTerm, roleFilter, provinceFilter]);

    const handleToggleStatus = async (userId: string, currentStatus: 'ACTIVE' | 'DISABLED') => {
        const nextStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        setActionLoading(userId);
        try {
            await authApi.updateUserStatus(userId, nextStatus);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setActionLoading(null);
        }
    };

    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter(u => u.status === 'ACTIVE').length,
            maintenance: users.filter(u => u.role === 'MAINTENANCE_OFFICER').length,
            citizens: users.filter(u => u.role === 'CITIZEN').length,
        };
    }, [users]);

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">System Personnel</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Manage infrastructure officers, administrators and citizen reporters</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <UsersIcon size={16} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Directory</p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{stats.total} Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                            <UserCheck size={20} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Accounts</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.active}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational status verified</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <HardHat size={20} />
                        </div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Field Personnel</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.maintenance}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized maintenance officers</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">System Admins</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{users.filter(u => u.role === 'ADMIN').length}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">High-clearance governance</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search name, email, or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                    </div>
                    <div className="relative">
                        <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Administrators</option>
                            <option value="MAINTENANCE_OFFICER">Maintenance Officers</option>
                            <option value="CITIZEN">Citizen Reporters</option>
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
                            <option value="ALL">All Jurisdictions</option>
                            {PROVINCIAL_COUNCILS.map(pc => (
                                <option key={pc} value={pc}>{pc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('ALL');
                            setProvinceFilter('ALL');
                        }}
                        className="py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* User Directory Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-bottom border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Clearance / Role</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Jurisdiction</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Onboarded</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-8 py-6"><Skeleton variant="text" className="w-32 h-4" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-24 h-4 rounded-lg" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-20 h-4" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-16 h-4 rounded-full" /></td>
                                        <td className="px-6 py-6"><Skeleton variant="text" className="w-24 h-4" /></td>
                                        <td className="px-8 py-6 text-right"><Skeleton variant="circle" className="w-8 h-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-white transition-colors">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">{user.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Mail size={10} className="text-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                user.role === 'ADMIN' ? 'bg-rose-50 text-rose-600' :
                                                user.role === 'MAINTENANCE_OFFICER' ? 'bg-blue-50 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                            )}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                                    {user.provincialCouncil || 'Global Oversight'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
                                                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500')} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-700 tracking-tight">
                                                    {format(new Date(user.createdAt), 'dd MMM yyyy')}
                                                </span>
                                                {user.lastLogin && (
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        Last active: {format(new Date(user.lastLogin), 'HH:mm')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(user.id, user.status)}
                                                    disabled={actionLoading === user.id || user.role === 'ADMIN'}
                                                    title={user.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all disabled:opacity-50",
                                                        user.status === 'ACTIVE' ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'
                                                    )}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <Clock className="animate-spin" size={14} />
                                                    ) : user.status === 'ACTIVE' ? (
                                                        <UserX size={16} />
                                                    ) : (
                                                        <UserCheck size={16} />
                                                    )}
                                                </button>
                                                <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4">
                                                <UsersIcon size={32} />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">No personnel matching criteria</h4>
                                            <p className="text-xs font-bold text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-950/20 border border-white/5">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-sm">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">Security & Oversight</h4>
                        <p className="text-xs font-bold text-slate-400">Total jurisdiction over {stats.maintenance} maintenance officers across 9 provinces</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2">
                        System Audit Logs <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Users;
