import { useEffect, useMemo, useState } from 'react';
import { 
    Search, 
    UserCog, 
    ShieldCheck, 
    Users as UsersIcon, 
    HardHat, 
    Mail, 
    MapPin,
    ArrowUpRight,
    UserCheck,
    UserX,
    MoreVertical,
    ChevronDown,
    RefreshCw
} from 'lucide-react';
import { authApi } from '../lib/api';
import { PROVINCIAL_COUNCILS } from '../lib/provinceResolver';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import type { User, UserRole, ProvincialCouncil } from '../types';
import { Pagination } from '../components/Pagination';

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [provinceFilter, setProvinceFilter] = useState<ProvincialCouncil | 'ALL'>('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await authApi.listUsers({
                page,
                limit,
                search: searchTerm,
                role: roleFilter === 'ALL' ? undefined : roleFilter,
                provincialCouncil: provinceFilter === 'ALL' ? undefined : provinceFilter
            });
            setUsers(response.data);
            setTotalPages(response.total_pages);
            setTotalItems(response.total);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [page, roleFilter, provinceFilter, searchTerm]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [roleFilter, provinceFilter, searchTerm]);

    const handleToggleStatus = async (userId: string, currentStatus: 'ACTIVE' | 'DEACTIVATED') => {
        const nextStatus = currentStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
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

    // Note: Stats would ideally come from a summary endpoint, but for now we'll use totalItems from the first page fetch.
    // If we need detailed stats, we'd need another API call.
    const stats = useMemo(() => {
        return {
            total: totalItems,
            active: users.filter(u => u.status === 'ACTIVE').length, // This is only for the current page
            maintenance: users.filter(u => u.role === 'MAINTENANCE_OFFICER').length,
            admins: users.filter(u => u.role === 'ADMIN').length,
        };
    }, [totalItems, users]);

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-heading">Personnel Directory</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Managing infrastructure officers and system administrators</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadUsers} className="btn-premium bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-50">
                        <RefreshCw size={14} className={cn("text-blue-500", loading && "animate-spin")} />
                        Refresh Personnel
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-start justify-between group hover:-translate-y-1 transition-all duration-500">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Identity</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.total}</h3>
                    </div>
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
                        <UsersIcon size={20} />
                    </div>
                </div>
                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-start justify-between group hover:-translate-y-1 transition-all duration-500">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Operational</p>
                        <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">LIVE</h3>
                    </div>
                    <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl">
                        <UserCheck size={20} />
                    </div>
                </div>
                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-start justify-between group hover:-translate-y-1 transition-all duration-500">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Active Directory</p>
                        <h3 className="text-4xl font-black text-blue-600 tracking-tighter">SYS</h3>
                    </div>
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl">
                        <HardHat size={20} />
                    </div>
                </div>
                <div className="bg-white p-7 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-start justify-between group hover:-translate-y-1 transition-all duration-500">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Governance</p>
                        <h3 className="text-4xl font-black text-indigo-600 tracking-tighter">OFF</h3>
                    </div>
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl">
                        <ShieldCheck size={20} />
                    </div>
                </div>
            </div>

            {/* Filter Console */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="relative group lg:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search Name or Email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white"
                        />
                    </div>
                    <div className="relative group">
                        <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Clearances</option>
                            <option value="ADMIN">Administrator</option>
                            <option value="MAINTENANCE_OFFICER">Field Officer</option>
                            <option value="CITIZEN">Citizen Reporter</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            value={provinceFilter}
                            onChange={(e) => setProvinceFilter(e.target.value as any)}
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Jurisdictions</option>
                            {PROVINCIAL_COUNCILS.map(pc => (
                                <option key={pc} value={pc}>{pc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    </div>
                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('ALL');
                            setProvinceFilter('ALL');
                            setPage(1);
                        }}
                        className="btn-premium bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        Reset Console
                    </button>
                </div>
            </div>

            {/* User Directory Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="table-premium">
                        <thead>
                            <tr>
                                <th>Personnel Identity</th>
                                <th>Operational Clearance</th>
                                <th>Primary Jurisdiction</th>
                                <th>System Status</th>
                                <th>Onboarded</th>
                                <th className="text-right px-8">Governance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!loading && users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                        <td className="whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center text-[13px] font-black text-slate-500 border border-slate-100 uppercase group-hover:bg-white transition-colors shadow-inner">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-black text-slate-900 tracking-tight leading-none mb-1">{user.name}</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail size={10} className="text-slate-300" />
                                                        <span className="text-[10px] font-bold text-slate-400">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={cn(
                                                "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                                                user.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                user.role === 'MAINTENANCE_OFFICER' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                'bg-slate-50 text-slate-400 border-slate-100'
                                            )}>
                                                {String(user.role ?? '').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[150px]">
                                                    {user.provincialCouncil || 'Global Oversight'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border",
                                                user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{user.status}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-slate-900">
                                                    {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {user.id.split('-')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="text-right px-8">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleToggleStatus(user.id, user.status)}
                                                    disabled={actionLoading === user.id || user.role === 'ADMIN'}
                                                    title={user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                                                    className={cn(
                                                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 border",
                                                        user.status === 'ACTIVE' ? 'text-rose-500 border-rose-100 hover:bg-rose-50' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'
                                                    )}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <RefreshCw className="animate-spin" size={14} />
                                                    ) : user.status === 'ACTIVE' ? (
                                                        <UserX size={16} />
                                                    ) : (
                                                        <UserCheck size={16} />
                                                    )}
                                                </button>
                                                <button className="h-9 w-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-8 py-5">
                                            <div className="h-6 w-full bg-slate-50 animate-pulse rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                                                <UsersIcon size={32} />
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Zero Personnel Found</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Adjust search or clearance filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                    <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={totalItems}
                        limit={limit}
                    />
                </div>
            </div>

            {/* Governance Summary */}
            <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-slate-950/30 border border-white/5 relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                    <ShieldCheck size={280} />
                </div>
                <div className="relative z-10 flex items-center gap-8">
                    <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner">
                        <ShieldCheck size={36} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black uppercase tracking-tight">Governance Oversight</h4>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Full jurisdiction over authorized maintenance officers</p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <button className="btn-premium bg-white text-slate-950 hover:bg-blue-50 transition-all shadow-xl shadow-white/5">
                        Audit Personnel History <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Users;
