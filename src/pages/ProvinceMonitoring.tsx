import { useEffect, useMemo, useState } from 'react';
import { 
    Search, 
    ChevronRight, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Wrench, 
    XCircle,
    LayoutGrid,
    BarChart3,
    ArrowUpRight,
    TrendingUp,
    Map
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { reportsApi, potholesApi } from '../lib/api';
import { PROVINCIAL_COUNCILS, getProvinceShortName, resolveProvince } from '../lib/provinceResolver';
import { Skeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import type { CitizenReport, PotholeEvent } from '../types';

interface ProvinceStats {
    id: string;
    name: string;
    shortName: string;
    total: number;
    verified: number;
    manualReview: number;
    inProgress: number;
    completed: number;
    rejected: number;
    overdue: number;
    completionRate: number;
}

const ProvinceMonitoring = () => {
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [rData, pData] = await Promise.all([
                reportsApi.list(),
                potholesApi.list()
            ]);
            setReports(rData);
            setPotholes(pData);
        } catch (error) {
            console.error("Failed to load province data", error);
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
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const status = 'status' in item ? item.status : '';
        return ['New', 'Verified', 'Confirmed'].includes(status) && diffDays > 14;
    };

    const provinceStats = useMemo(() => {
        return PROVINCIAL_COUNCILS.map(council => {
            const normalizedCouncil = council.toLowerCase().trim();
            
            const pReports = reports.filter(r => {
                const rCouncil = r.provincialCouncil || resolveProvince(r.lat, r.lon).council;
                return rCouncil.toLowerCase().trim() === normalizedCouncil;
            });

            const pPotholes = potholes.filter(p => {
                const pCouncil = p.provincialCouncil || resolveProvince(p.lat, p.lon).council;
                return pCouncil.toLowerCase().trim() === normalizedCouncil;
            });

            const verified = pPotholes.filter(p => ['Verified', 'Confirmed', 'New'].includes(p.status)).length;
            const manualReview = pReports.filter(r => r.aiStatus === 'PENDING').length;
            const inProgress = pPotholes.filter(p => p.status === 'In Progress').length;
            const completed = pPotholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length;
            const rejected = pReports.filter(r => r.aiStatus === 'REJECTED').length;
            const overdue = [...pReports, ...pPotholes].filter(isOverdue).length;
            const total = pReports.length + pPotholes.length;

            const completionRate = total > 0 ? Math.round((completed / (verified + inProgress + completed)) * 100) || 0 : 0;

            return {
                id: council,
                name: council,
                shortName: getProvinceShortName(council as any),
                total,
                verified,
                manualReview,
                inProgress,
                completed,
                rejected,
                overdue,
                completionRate
            };
        });
    }, [reports, potholes]);

    const filteredProvinces = useMemo(() => {
        return provinceStats.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.shortName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [provinceStats, searchTerm]);

    const chartData = useMemo(() => {
        const data = provinceStats.map(p => ({
            name: p.shortName,
            completed: p.completed,
            active: p.verified + p.inProgress,
            pending: p.manualReview,
            total: p.total
        }));
        
        // If all are zero, provide some dummy structure so chart doesn't collapse
        if (data.every(d => d.total === 0)) {
            return PROVINCIAL_COUNCILS.map(c => ({
                name: getProvinceShortName(c as any),
                completed: 0,
                active: 0,
                pending: 0,
                total: 0
            }));
        }
        return data;
    }, [provinceStats]);

    return (
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Provincial Monitoring</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Regional performance and infrastructure workload overview</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search province..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full xl:w-72 pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Performance Overview Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="text-blue-500" size={18} />
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Regional Performance Index</h2>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active workload distribution vs completion</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                labelStyle={{ display: 'none' }}
                            />
                            <Bar dataKey="completed" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={24} />
                            <Bar dataKey="active" stackId="a" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Province Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <Skeleton variant="circle" className="w-12 h-12" />
                                <div className="space-y-2">
                                    <Skeleton variant="text" className="w-24" />
                                    <Skeleton variant="text" className="w-16 h-3" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton variant="text" className="h-10 rounded-xl" />
                                <Skeleton variant="text" className="h-10 rounded-xl" />
                            </div>
                        </div>
                    ))
                ) : filteredProvinces.map((p) => (
                    <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group flex flex-col">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-950/10 group-hover:scale-110 transition-transform">
                                    <Map size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{p.shortName}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp size={10} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.completionRate}% Efficiency</span>
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Progress Visual */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                <span>Repair Progress</span>
                                <span className="text-slate-900">{p.completed} / {p.total} Fixed</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-sm shadow-blue-600/20"
                                    style={{ width: `${p.completionRate}%` }}
                                />
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <CheckCircle2 size={10} className="text-blue-500" /> Verified
                                </p>
                                <p className="text-lg font-black text-slate-900">{p.verified}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Clock size={10} className="text-amber-500" /> Needs Review
                                </p>
                                <p className="text-lg font-black text-slate-900">{p.manualReview}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Wrench size={10} className="text-blue-500" /> In Progress
                                </p>
                                <p className="text-lg font-black text-slate-900">{p.inProgress}</p>
                            </div>
                            <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <AlertTriangle size={10} /> Overdue
                                </p>
                                <p className="text-lg font-black text-rose-600">{p.overdue}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-50">
                             <div className="flex items-center gap-3">
                                 <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rejected</span>
                                     <span className="text-xs font-black text-slate-900">{p.rejected}</span>
                                 </div>
                                 <div className="w-px h-6 bg-slate-100" />
                                 <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Reports</span>
                                     <span className="text-xs font-black text-slate-900">{p.total}</span>
                                 </div>
                             </div>
                             <button className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
                                 View Details <ArrowUpRight size={12} />
                             </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Global Legend Card */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-950/20 border border-white/5">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-sm">
                        <BarChart3 size={32} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">System Performance Monitor</h4>
                        <p className="text-xs font-bold text-slate-400">Monitoring real-time efficiency across all 9 Provincial Councils</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Jurisdiction</p>
                        <p className="text-2xl font-black">9 Councils</p>
                    </div>
                    <div className="w-px h-10 bg-white/10 hidden md:block" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Efficiency</p>
                        <p className="text-2xl font-black text-emerald-400">72% Avg</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProvinceMonitoring;
