import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    MapPin,
    ShieldAlert,
    Wrench,
    CheckCircle,
    ChevronRight,
    XCircle,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { potholesApi, reportsApi } from '../lib/api';
import type { CitizenReport, PotholeEvent } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName } from '../lib/provinceResolver';

const isOverdue = (item: CitizenReport | PotholeEvent) => {
    const dateStr = 'createdAt' in item ? item.createdAt : (item as PotholeEvent).timestamp;
    if (!dateStr) return false;
    
    const createdDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Status is New or Verified for more than 14 days
    return ['New', 'Verified', 'Confirmed'].includes(item.status) && diffDays > 14;
};


const MaintenanceOverview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [potholes, setPotholes] = useState<PotholeEvent[]>([]);
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async () => {
        try {
            setError('');
            // Pass province filter to API to reduce bandwidth and enforce server-side filtering
            const filters = province && province !== 'Unassigned' ? { provincialCouncil: province } : {};
            
            if (import.meta.env.DEV) {
                console.log(`[Dashboard Debug] Fetching data with filters:`, filters);
            }

            console.log(`[Staff Overview] Syncing data for province: ${province}`);
            const [potholeData, reportData] = await Promise.all([
                potholesApi.list(filters),
                reportsApi.list(filters)
            ]);
            
            console.log(`[Staff Overview] Sync complete. Filtered results: ${potholeData.length} potholes, ${reportData.length} reports for ${province}`);

            setPotholes(potholeData);
            setReports(reportData);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Unable to load maintenance overview. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [province]);

    useEffect(() => {
        setLoading(true);
        fetchDashboardData();

        // Real-time synchronization: Poll every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const { cards } = useMemo(() => {
        // Combined list for overview counts
        const allItems = [...reports, ...potholes.filter(p => !reports.some(r => r.id === p.id))];

        // Verified: status is Verified/Confirmed OR aiClassification is VERIFIED_POTHOLE
        const verified = allItems.filter(item => 
            ['Verified', 'Confirmed'].includes(item.status) || 
            item.aiClassification === 'VERIFIED_POTHOLE'
        ).length;
        
        // Manual Review: status is New OR aiClassification is NEEDS_MANUAL_REVIEW
        const needsReview = allItems.filter(item => 
            item.status === 'New' || 
            item.aiClassification === 'NEEDS_MANUAL_REVIEW'
        ).length;
        
        const inProgress = allItems.filter(item => item.status === 'In Progress').length;
        const completed = allItems.filter(item => ['Completed', 'Fixed'].includes(item.status)).length;
        const rejected = allItems.filter(item => 
            item.status === 'Rejected' || 
            item.aiClassification === 'REJECTED'
        ).length;
        
        const overdue = allItems.filter(isOverdue).length;

        return {
            cards: [
                { label: 'Verified Pothole Reports', value: verified, icon: CheckCircle, color: 'bg-emerald-600', filter: 'verified' },
                { label: 'Manual Review Required', value: needsReview, icon: ShieldAlert, color: 'bg-amber-500', filter: 'manual-review' },
                { label: 'In Progress Repairs', value: inProgress, icon: Wrench, color: 'bg-blue-600', filter: 'in-progress' },
                { label: 'Completed Repairs', value: completed, icon: CheckCircle2, color: 'bg-slate-900', filter: 'completed' },
                { label: 'Overdue Repairs', value: overdue, icon: AlertTriangle, color: 'bg-rose-600', filter: 'overdue' },
                { label: 'Rejected Reports', value: rejected, icon: XCircle, color: 'bg-slate-400', filter: 'rejected' },
            ]
        };
    }, [potholes, reports]);

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center shadow-sm">
                <AlertTriangle className="mx-auto mb-3 text-rose-500" size={32} />
                <h2 className="text-lg font-black text-slate-900">Overview unavailable</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="section-heading mb-1">Maintenance Overview</h1>
                    <p className="text-sm font-bold text-slate-500">Provincial operational summary. Click cards to view detailed reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setLoading(true); fetchDashboardData(); }}
                        className="btn-premium bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-slate-50"
                    >
                        <RefreshCw size={14} className={cn("text-blue-500", loading && "animate-spin")} />
                        Manual Sync
                    </button>
                    {province && province !== 'Unassigned' && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                            <MapPin size={12} /> {getProvinceShortName(province)} Sector
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {cards.map(card => (
                    <button 
                        key={card.label} 
                        onClick={() => navigate(`/staff/reports/${card.filter}`)}
                        className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 text-left shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                    >
                        <div className="flex flex-col gap-6">
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3', card.color)}>
                                <card.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight mb-2">{card.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black tracking-tight text-slate-950">
                                        {loading ? <span className="animate-pulse opacity-20">--</span> : card.value}
                                    </p>
                                    <ChevronRight className="text-slate-200 group-hover:text-slate-950 group-hover:translate-x-1 transition-all" size={20} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Subtle background glow on hover */}
                        <div className={cn("absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500", card.color)} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MaintenanceOverview;
