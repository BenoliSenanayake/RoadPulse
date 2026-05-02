import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    MapPin,
    ShieldAlert,
    Wrench,
    CheckCircle,
    ChevronRight,
    XCircle
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

    useEffect(() => {
        setLoading(true);
        setError('');

        Promise.all([potholesApi.list(), reportsApi.list()])
            .then(([potholeData, reportData]) => {
                if (province && province !== 'Unassigned') {
                    setPotholes(potholeData.filter(p => p.provincialCouncil === province));
                    setReports(reportData.filter(r => r.provincialCouncil === province));
                } else {
                    setPotholes(potholeData);
                    setReports(reportData);
                }
            })
            .catch(() => setError('Unable to load maintenance overview. Please try again.'))
            .finally(() => setLoading(false));
    }, [province]);

    const { cards } = useMemo(() => {
        // AI-Verified: High confidence reports or already in pothole inventory
        const verified = potholes.filter(p => ['Verified', 'Confirmed', 'New'].includes(p.status)).length;
        
        // Manual Review Required: PENDING reports
        const needsReview = reports.filter(r => r.aiStatus === 'PENDING').length;
        
        const inProgress = potholes.filter(p => p.status === 'In Progress').length;
        const completed = potholes.filter(p => ['Completed', 'Fixed'].includes(p.status)).length;
        const rejected = reports.filter(r => r.aiStatus === 'REJECTED').length;
        
        const overdueReports = reports.filter(isOverdue);
        const overduePotholes = potholes.filter(isOverdue);
        const totalOverdue = overdueReports.length + overduePotholes.length;

        return {
            cards: [
                { label: 'Verified Pothole Reports', value: verified, icon: CheckCircle, color: 'bg-emerald-600', filter: 'verified' },
                { label: 'Manual Review Required', value: needsReview, icon: ShieldAlert, color: 'bg-amber-500', filter: 'manual-review' },
                { label: 'In Progress Repairs', value: inProgress, icon: Wrench, color: 'bg-blue-600', filter: 'in-progress' },
                { label: 'Completed Repairs', value: completed, icon: CheckCircle2, color: 'bg-slate-900', filter: 'completed' },
                { label: 'Overdue Repairs', value: totalOverdue, icon: AlertTriangle, color: 'bg-rose-600', filter: 'overdue' },
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
                {province && province !== 'Unassigned' && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                        <MapPin size={12} /> {getProvinceShortName(province)} Sector
                    </div>
                )}
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
