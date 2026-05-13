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
    CalendarClock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../lib/api';
import type { CitizenReport } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getProvinceShortName } from '../lib/provinceResolver';
import {
    filterReportsForProvince,
    hasOfficerProvince,
    isCompletedReport,
    isInProgressReport,
    isManualReviewReport,
    isOverdueReport,
    isRejectedReport,
    isScheduledReport,
    isVerifiedReport,
    logStaffReportFilter,
    OFFICER_PROVINCE_MISSING
} from '../lib/staffReportFilters';

const MaintenanceOverview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async () => {
        try {
            setError('');
            
            if (!hasOfficerProvince(province)) {
                setError(OFFICER_PROVINCE_MISSING);
                setLoading(false);
                return;
            }

            
            const response = await reportsApi.list({ provincialCouncil: province, limit: 1000 });
            const reportData = response.data || [];
            const filteredReports = filterReportsForProvince(reportData, province);

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
        const scheduled = reports.filter(isScheduledReport).length;
        const inProgress = reports.filter(isInProgressReport).length;
        const completed = reports.filter(isCompletedReport).length;
        const rejected = reports.filter(isRejectedReport).length;
        const overdue = reports.filter(isOverdueReport).length;

        return {
            cards: [
                { label: 'Manual Review Required', value: needsReview, icon: ShieldAlert, color: 'bg-amber-500', filter: 'manual-review' },
                { label: 'Verified Pothole Reports', value: verified, icon: CheckCircle, color: 'bg-emerald-600', filter: 'verified' },
                { label: 'Scheduled Repairs', value: scheduled, icon: CalendarClock, color: 'bg-orange-500', filter: 'scheduled' },
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
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="section-heading mb-1">Maintenance Overview</h1>
                    <p className="text-sm text-slate-600">Provincial operational summary. Click a card to view matching reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setLoading(true); fetchDashboardData(); }}
                        className="btn-premium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                        Refresh
                    </button>
                    {province && province !== 'Unassigned' && (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                            <MapPin size={14} /> {getProvinceShortName(province)}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(card => (
                    <button 
                        key={card.label} 
                        onClick={() => navigate(`/staff/reports/${card.filter}`)}
                        className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-2 text-sm font-medium text-slate-600">{card.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-semibold tracking-tight text-slate-950">
                                        {loading ? <span className="opacity-20">--</span> : card.value}
                                    </p>
                                    <ChevronRight className="text-slate-400" size={18} />
                                </div>
                            </div>
                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-white', card.color)}>
                                <card.icon size={19} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MaintenanceOverview;
