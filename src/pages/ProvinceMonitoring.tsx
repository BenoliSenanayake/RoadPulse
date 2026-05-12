import { useEffect, useMemo, useState } from 'react';
import { 
    Search, 
    ChevronRight, 
    BarChart3,
    TrendingUp,
    Map,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from 'recharts';
import { reportsApi, potholesApi } from '../lib/api';
import { PROVINCIAL_COUNCILS, getProvinceShortName, resolveProvince } from '../lib/provinceResolver';
import { cn } from '../lib/utils';
import type { CitizenReport, PotholeEvent } from '../types';


const ProvinceMonitoring = () => {
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [rResponse, pResponse] = await Promise.all([
                reportsApi.list({ limit: 1000 }),
                potholesApi.list({ limit: 1000 })
            ]);
            setReports(rResponse.data || []);
            setPotholes(pResponse.data || []);
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
            const completed = pPotholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length;
            const inProgress = pPotholes.filter(p => p.status === 'In Progress').length;
            const manualReview = pReports.filter(r => r.aiStatus === 'PENDING').length;
            const rejected = pReports.filter(r => r.aiStatus === 'REJECTED').length;
            const overdue = [...pReports, ...pPotholes].filter(isOverdue).length;
            
            const total = verified + completed + inProgress + manualReview;
            const completionRate = total > 0 ? (completed / total) * 100 : 0;

            return {
                id: council.replace(/\s+/g, '-').toLowerCase(),
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
        }).sort((a, b) => b.total - a.total);
    }, [reports, potholes]);

    const filteredStats = useMemo(() => {
        return provinceStats.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.shortName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [provinceStats, searchTerm]);

    const chartData = useMemo(() => {
        return provinceStats.slice(0, 6).map(p => ({
            name: p.shortName,
            total: p.total,
            completed: p.completed,
            pending: p.manualReview + p.verified + p.inProgress
        }));
    }, [provinceStats]);

    return (
        <div className="space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-heading">Regional Surveillance</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Performance auditing across all Provincial Councils</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Filter Jurisdictions..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 pl-11 pr-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-sm"
                        />
                    </div>
                    <button onClick={loadData} className="btn-premium bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800">
                        <RefreshCw size={14} className={cn("text-blue-400", loading && "animate-spin")} />
                        Reload
                    </button>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <BarChart3 size={20} />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Comparative Analysis</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reports vs Completions by Region</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} 
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                                <Tooltip 
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ 
                                        borderRadius: '1.5rem', 
                                        border: 'none', 
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        fontSize: '11px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase'
                                    }}
                                />
                                <Bar dataKey="total" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="completed" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Map size={160} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <TrendingUp className="text-blue-400" size={20} />
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Efficiency Audit</h4>
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter mb-4">
                            {provinceStats.length > 0 ? (provinceStats.reduce((acc, p) => acc + p.completionRate, 0) / provinceStats.length).toFixed(1) : 0}%
                        </h2>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                            Aggregate national infrastructure resolution rate across all jurisdictions.
                        </p>
                    </div>
                    <div className="relative z-10 pt-8 border-t border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Version</span>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">V4.8 Stable</span>
                        </div>
                        <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5">
                            Audit Detail Logs
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Jurisdiction Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {!loading ? filteredStats.map(stat => (
                    <div key={stat.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-8">
                            <div className="space-y-1">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.total}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
                                </div>
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110",
                                stat.completionRate > 60 ? "bg-emerald-500 text-white" : stat.completionRate > 30 ? "bg-blue-600 text-white" : "bg-rose-500 text-white"
                            )}>
                                <BarChart3 size={20} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-50 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">In Progress</span>
                                <span className="text-lg font-black text-slate-900 leading-none">{stat.inProgress}</span>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-50 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</span>
                                <span className="text-lg font-black text-slate-900 leading-none">{stat.completed}</span>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-50 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Awaiting</span>
                                <span className="text-lg font-black text-slate-900 leading-none">{stat.manualReview + stat.verified}</span>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-50 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Overdue</span>
                                <span className="text-lg font-black text-rose-600 leading-none">{stat.overdue}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency</span>
                                <span className="text-xs font-black text-slate-900">{stat.completionRate.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        stat.completionRate > 60 ? "bg-emerald-500" : stat.completionRate > 30 ? "bg-blue-600" : "bg-rose-500"
                                    )} 
                                    style={{ width: `${Math.max(5, stat.completionRate)}%` }} 
                                />
                            </div>
                        </div>

                        <button className="w-full mt-8 py-3 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                            Open Dashboard
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )) : (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-96 bg-white animate-pulse rounded-[2.5rem] border border-slate-50 shadow-sm" />
                    ))
                )}
            </div>
        </div>
    );
};

export default ProvinceMonitoring;
