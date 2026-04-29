import { useMemo, useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    FileText,
    Calendar,
    Target,
    XCircle,
    HardHat,
    Hammer,
    Inbox
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { potholesApi, reportsApi } from '../lib/api';
import { StatusPill } from '../components/StatusPill';
import { Skeleton } from '../components/Skeleton';
import { subDays, isAfter, format } from 'date-fns';
import { cn } from '../lib/utils';

// Fix leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const STATUS_COLORS = {
    New: '#2563EB',
    Confirmed: '#F59E0B',
    Scheduled: '#A855F7',
    Fixed: '#10B981',
    Rejected: '#F43F5E',
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass = "text-slate-900 bg-slate-900", loading }: any) => {
    if (loading) return (
        <div className="card-premium p-6 flex items-start justify-between">
            <div className="flex-1">
                <Skeleton variant="text" className="w-20 mb-3" />
                <Skeleton variant="text" className="w-12 h-8 mb-4" />
                <Skeleton variant="text" className="w-24 h-4" />
            </div>
            <Skeleton variant="circle" className="w-12 h-12" />
        </div>
    );

    const isPositiveTrend = trend && (trend.includes('+') || trend.includes('High'));
    const isNegativeTrend = trend && (trend.includes('-') || trend.includes('Low'));

    return (
        <div className="card-premium p-6 flex items-start justify-between hover-lift">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 mt-3">
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            isPositiveTrend ? "bg-emerald-50 text-emerald-700" :
                                isNegativeTrend ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
                        )}>
                            {isPositiveTrend && <TrendingUp size={10} />}
                            <span>{trend.split(' ')[0]}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{trend.split(' ').slice(1).join(' ')}</span>
                    </div>
                )}
            </div>
            <div className={cn(`p-3 rounded-2xl text-white shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform`, colorClass)}>
                <Icon size={20} />
            </div>
        </div>
    );
};

const Overview = () => {
    const [potholes, setPotholes] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            potholesApi.list(),
            reportsApi.list()
        ]).then(([pData, rData]) => {
            setPotholes(pData);
            setReports(rData);
        }).catch(err => {
            console.error("Failed to load overview data:", err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const { stats, statusData, weeklyTrendData, repairProgressData } = useMemo(() => {
        const totalReports = reports.length;
        const pendingReview = reports.filter(r => r.aiStatus === 'PENDING').length;
        const rejectedSubmissions = reports.filter(r => r.aiStatus === 'REJECTED').length;

        const reportsThisWeekCount = reports.filter(r => isAfter(new Date(r.createdAt), subDays(new Date(), 7))).length;

        const aiReportsWithConf = reports.filter(r => r.aiConfidence !== undefined);
        const avgAiConfidence = aiReportsWithConf.length > 0
            ? aiReportsWithConf.reduce((acc, r) => acc + (r.aiConfidence || 0), 0) / aiReportsWithConf.length
            : 0;

        const confirmedPotholes = potholes.filter(p => p.status === 'Confirmed').length;
        const scheduledRepairs = potholes.filter(p => p.status === 'Scheduled').length;
        const fixedPotholes = potholes.filter(p => p.status === 'Fixed').length;

        const calculatedStats = [
            { title: 'Total Reports', value: totalReports, icon: FileText, trend: '+12% vs last month', colorClass: 'bg-blue-600' },
            { title: 'Pending AI Review', value: pendingReview, icon: Clock, trend: 'Action Required', colorClass: 'bg-amber-500' },
            { title: 'Avg AI Confidence', value: `${(avgAiConfidence * 100).toFixed(1)}%`, icon: Target, trend: 'High Accuracy', colorClass: 'bg-slate-900' },
            { title: 'Reports This Week', value: reportsThisWeekCount, icon: Calendar, trend: '+5% vs last week', colorClass: 'bg-indigo-500' },
            { title: 'Confirmed Potholes', value: confirmedPotholes, icon: AlertTriangle, trend: 'Awaiting Schedule', colorClass: 'bg-orange-500' },
            { title: 'Scheduled Repairs', value: scheduledRepairs, icon: HardHat, trend: 'In Pipeline', colorClass: 'bg-purple-500' },
            { title: 'Fixed Potholes', value: fixedPotholes, icon: Hammer, trend: '+8% this month', colorClass: 'bg-emerald-500' },
            { title: 'Rejected Submissions', value: rejectedSubmissions, icon: XCircle, trend: 'Low priority', colorClass: 'bg-rose-500' },
        ];

        // Group all reports by day of week
        const today = new Date();
        const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(today, 6 - i), 'EEE'));

        const trendData = last7Days.map(dayName => ({ name: dayName, count: 0 }));
        reports.forEach(r => {
            const rDate = new Date(r.createdAt);
            if (isAfter(rDate, subDays(today, 7))) {
                const dName = format(rDate, 'EEE');
                const dayEntry = trendData.find(d => d.name === dName);
                if (dayEntry) dayEntry.count++;
            }
        });

        const statusCounts = [
            { name: 'New', value: potholes.filter(p => p.status === 'New').length },
            { name: 'Confirmed', value: potholes.filter(p => p.status === 'Confirmed').length },
            { name: 'Scheduled', value: potholes.filter(p => p.status === 'Scheduled').length },
            { name: 'Fixed', value: potholes.filter(p => p.status === 'Fixed').length },
            { name: 'Rejected', value: potholes.filter(p => p.status === 'Rejected').length },
        ].filter(d => d.value > 0);

        const repairData = [
            { stage: 'New', count: potholes.filter(p => p.status === 'New').length },
            { stage: 'Confirmed', count: potholes.filter(p => p.status === 'Confirmed').length },
            { stage: 'Scheduled', count: potholes.filter(p => p.status === 'Scheduled').length },
            { stage: 'Fixed', count: potholes.filter(p => p.status === 'Fixed').length },
        ];

        return { stats: calculatedStats, statusData: statusCounts, weeklyTrendData: trendData, repairProgressData: repairData };
    }, [potholes, reports]);

    return (
        <div className="space-y-8 animate-fade-in-up pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="section-heading mb-1">Municipality Overview</h1>
                    <p className="text-slate-500 font-bold text-sm">Real-time telemetry and infrastructure tracking dashboard.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Live Sync Active</span>
                    <span className="text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-3">{currentTime.toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} loading={loading} />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Trend Chart */}
                <div className="xl:col-span-2 card-premium p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Weekly Report Submissions</h4>
                            <p className="text-xs font-bold text-slate-400">Trend of incoming citizen reports over the last 7 days</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                            Last 7 Days
                        </div>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 900 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        borderRadius: '16px',
                                        border: 'none',
                                        color: '#fff',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)'
                                    }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3B82F6"
                                    strokeWidth={4}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3B82F6' }}
                                    activeDot={{ r: 8, fill: '#2563EB', strokeWidth: 4, stroke: '#fff' }}
                                    name="Reports Submitted"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="card-premium p-8 flex flex-col">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight mb-1 uppercase">Defect Status</h4>
                    <p className="text-xs font-bold text-slate-400 mb-8">Distribution of all logged infrastructure defects</p>
                    <div className="h-[220px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#CBD5E1'}
                                            className="hover:opacity-80 transition-opacity outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-auto space-y-3 pt-6">
                        {statusData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: STATUS_COLORS[s.name as keyof typeof STATUS_COLORS] || '#CBD5E1' }} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg min-w-[32px] text-center tracking-tight border border-slate-100">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Repair Progress Bar Chart */}
                <div className="card-premium p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Repair Progress Pipeline</h4>
                            <p className="text-xs font-bold text-slate-400">Current stages of active maintenance requests</p>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={repairProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="stage"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 900 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        borderRadius: '12px',
                                        border: 'none',
                                        color: '#fff',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                    {repairProgressData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.stage as keyof typeof STATUS_COLORS] || '#94A3B8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map View */}
                <div className="card-premium h-[420px] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Geographical Hotspots</h4>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Map Tracking</span>
                        </div>
                    </div>
                    <div className="flex-1 relative z-0">
                        <MapContainer center={[6.9271, 79.8612]} zoom={10} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {potholes.slice(0, 15).map((p) => (
                                <Marker key={p.id} position={[p.lat, p.lon]}>
                                    <Popup>
                                        <div className="p-1">
                                            <p className="text-[10px] font-black text-slate-900 uppercase mb-1">#{p.id.split('-')[0]}</p>
                                            <p className="text-[11px] font-bold text-slate-500">{p.roadName}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
