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
    RefreshCw,
    Bug
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import type { CitizenReport } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName, normalizeProvince } from '../lib/provinceResolver';
import {
    filterReportsForProvince,
    hasOfficerProvince,
    isCompletedReport,
    isInProgressReport,
    isManualReviewReport,
    isOverdueReport,
    isRejectedReport,
    isVerifiedReport,
    logStaffReportFilter,
    OFFICER_PROVINCE_MISSING
} from '../lib/staffReportFilters';

const MaintenanceOverview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [rawReports, setRawReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDebug, setShowDebug] = useState(true); // Toggle for debug panel

    const fetchDashboardData = useCallback(async () => {
        try {
            setError('');
            
            if (!hasOfficerProvince(province)) {
                setError(OFFICER_PROVINCE_MISSING);
                setLoading(false);
                return;
            }

            const staffProvince = normalizeProvince(province);
            
            console.log(`[Staff Debug] Current User:`, user?.email, staffProvince);

            const reportData = await reportsApi.list();
            
            setRawReports(reportData);
            console.log(`[Staff Overview] Raw telemetry: ${reportData.length} reports.`);
            
            const filteredReports = filterReportsForProvince(reportData, province);

            console.log(`[Staff Overview] Filtered results for ${staffProvince}: ${filteredReports.length} reports.`);
            logStaffReportFilter('Staff Overview', province, reportData, filteredReports);
            
            setReports(filteredReports);
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
        const verified = reports.filter(isVerifiedReport).length;
        const needsReview = reports.filter(isManualReviewReport).length;
        const inProgress = reports.filter(isInProgressReport).length;
        const completed = reports.filter(isCompletedReport).length;
        const rejected = reports.filter(isRejectedReport).length;
        const overdue = reports.filter(isOverdueReport).length;

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
    }, [reports]);

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

            {/* Temporary Debug Panel */}
            {showDebug && (
                <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-amber-700">
                            <Bug size={18} />
                            <h2 className="text-xs font-black uppercase tracking-widest">Jurisdictional Debug Panel (Temp)</h2>
                        </div>
                        <button onClick={() => setShowDebug(false)} className="text-amber-400 hover:text-amber-700">
                            <XCircle size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/50 p-3 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-800 uppercase mb-1">Logged Officer</p>
                            <p className="text-xs font-bold text-slate-700">{user?.email}</p>
                            <p className="text-xs font-black text-emerald-600 mt-1">{province}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-800 uppercase mb-1">API Statistics</p>
                            <p className="text-xs font-bold text-slate-700">Total reports fetched from API: {rawReports.length}</p>
                            <p className="text-xs font-bold text-slate-700">Reports after province filter: {reports.length}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-800 uppercase mb-1">Report Provinces Found</p>
                            <p className="text-[10px] font-bold text-slate-600 truncate">
                                {Array.from(new Set(rawReports.map(r => r.provincialCouncil || 'null'))).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
