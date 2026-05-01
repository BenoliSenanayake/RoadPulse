import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Camera, MapPin, BarChart3, PlusCircle, ArrowRight,
    FileText, Clock, CheckCircle2, Wrench, ShieldAlert,
    Loader2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reportsApi } from '../../lib/api';
import { StatusPill } from '../../components/StatusPill';
import { formatDistanceToNow } from 'date-fns';
import type { CitizenReport } from '../../types';

const CitizenHome = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const all = await reportsApi.list({ citizenId: user.id });
                const sorted = all.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setReports(sorted);
            } catch (err) {
                console.error('Failed to load reports:', err);
                setError('Unable to load your reports. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [user]);

    // Compute stats
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.aiStatus === 'PENDING').length;
    const acceptedReports = reports.filter(r => r.aiStatus === 'ACCEPTED').length;
    const fixedReports = reports.filter(
        r => r.aiStatus === 'ACCEPTED' && r.status === 'Fixed' as any
    ).length;

    const recentReports = reports.slice(0, 3);
    const firstName = user?.name?.split(' ')[0] || 'Citizen';

    return (
        <div className="pb-32 md:pb-16">
            {/* ─── Hero Section ─── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24 text-white">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-accent/20 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] -ml-32 -mb-32 pointer-events-none" />

                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-lg border border-white/10 rounded-full mb-6">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Welcome back</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
                        Hello, <span className="text-accent">{firstName}</span> 👋
                    </h1>

                    <p className="text-slate-300 text-base sm:text-lg font-medium leading-relaxed max-w-xl mb-8">
                        Report potholes quickly with image evidence and location. Help us make our roads safer for everyone.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link
                            to="/citizen/report"
                            id="hero-cta-report"
                            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-accent hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.97] shadow-xl shadow-accent/30 hover:shadow-accent/40"
                        >
                            <PlusCircle size={20} />
                            Report a Pothole
                        </Link>
                        <Link
                            to="/citizen/my-reports"
                            id="hero-cta-reports"
                            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/15 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
                        >
                            <FileText size={20} />
                            View My Reports
                        </Link>
                    </div>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ─── Quick Stats Cards ─── */}
                <section className="relative -mt-8 sm:-mt-10 z-20 mb-10" aria-label="Report statistics">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 animate-pulse">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 mb-3" />
                                    <div className="h-7 w-16 bg-slate-100 rounded-lg mb-1" />
                                    <div className="h-4 w-24 bg-slate-50 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <StatCard icon={FileText} value={totalReports} label="Total Reports" color="blue" />
                            <StatCard icon={Clock} value={pendingReports} label="Pending Review" color="amber" />
                            <StatCard icon={CheckCircle2} value={acceptedReports} label="Accepted" color="emerald" />
                            <StatCard icon={Wrench} value={fixedReports} label="Fixed" color="violet" />
                        </div>
                    )}
                </section>

                {/* ─── How It Works ─── */}
                <section className="mb-12" aria-label="How it works">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-6">
                        How it works
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                step: 1,
                                icon: Camera,
                                title: 'Upload Photo',
                                desc: 'Take a clear photo of the pothole using your phone camera.',
                                color: 'bg-blue-50 text-blue-600 border-blue-100',
                            },
                            {
                                step: 2,
                                icon: MapPin,
                                title: 'Confirm Location',
                                desc: 'Use GPS or tap the map to pinpoint the exact pothole location.',
                                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                            },
                            {
                                step: 3,
                                icon: BarChart3,
                                title: 'Track Progress',
                                desc: 'Monitor repair status in real-time from your dashboard.',
                                color: 'bg-violet-50 text-violet-600 border-violet-100',
                            },
                        ].map((item) => (
                            <div
                                key={item.step}
                                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.color} group-hover:scale-105 transition-transform`}>
                                        <item.icon size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Step {item.step}
                                        </span>
                                        <h3 className="text-base font-bold text-slate-900 mt-0.5 mb-1">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── Recent Reports ─── */}
                <section className="mb-12" aria-label="Recent reports">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            Recent Reports
                        </h2>
                        {reports.length > 3 && (
                            <Link
                                to="/citizen/my-reports"
                                className="text-sm font-bold text-accent hover:text-blue-700 flex items-center gap-1 transition-colors"
                            >
                                View all <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-slate-100 rounded" />
                                        <div className="h-3 w-48 bg-slate-50 rounded" />
                                        <div className="h-5 w-24 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-center gap-3 text-rose-600">
                            <AlertTriangle size={20} className="shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    ) : recentReports.length === 0 ? (
                        /* ─── Empty State ─── */
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 sm:p-14 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <FileText size={36} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                No reports yet
                            </h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
                                You haven't submitted any pothole reports. Help improve your roads by reporting the first one!
                            </p>
                            <Link
                                to="/citizen/report"
                                id="empty-state-cta"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.97] shadow-lg shadow-accent/20"
                            >
                                <PlusCircle size={18} />
                                Submit Your First Report
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentReports.map((report) => (
                                <Link
                                    key={report.id}
                                    to={`/citizen/status/${report.id}`}
                                    className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                                        <img
                                            src={report.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate mb-1">
                                            {report.description || `Report at ${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Clock size={12} />
                                            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                                            <span className="text-slate-200">•</span>
                                            <MapPin size={12} />
                                            <span className="truncate">{report.lat.toFixed(4)}, {report.lon.toFixed(4)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <StatusPill status={report.aiStatus} />
                                        <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </Link>
                            ))}

                            {reports.length > 3 && (
                                <Link
                                    to="/citizen/my-reports"
                                    className="block text-center py-3 text-sm font-bold text-accent hover:text-blue-700 transition-colors"
                                >
                                    View all {reports.length} reports →
                                </Link>
                            )}
                        </div>
                    )}
                </section>

                {/* ─── Safety Card ─── */}
                <section className="mb-8" aria-label="Safety reminder">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 sm:p-6 flex gap-4">
                        <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <ShieldAlert size={22} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900 mb-1">
                                Stay safe while reporting
                            </h3>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Only report potholes when it's safe to do so. <strong>Never take photos while driving.</strong> Pull over to a safe location or ask a passenger to capture the image.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

/* ─── Stat Card Sub-component ─── */
interface StatCardProps {
    icon: React.ElementType;
    value: number;
    label: string;
    color: 'blue' | 'amber' | 'emerald' | 'violet';
}

const colorMap = {
    blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-100',
    },
    amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
    },
    emerald: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
    },
    violet: {
        bg: 'bg-violet-50',
        text: 'text-violet-600',
        border: 'border-violet-100',
    },
};

const StatCard = ({ icon: Icon, value, label, color }: StatCardProps) => {
    const c = colorMap[color];
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${c.bg} ${c.text} ${c.border}`}>
                <Icon size={20} />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
        </div>
    );
};

export default CitizenHome;
