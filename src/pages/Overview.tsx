import { useMemo } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp
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
    Line
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { listPotholes, listCitizenReports } from '../lib/api';
import { StatusPill } from '../components/StatusPill';
import { Skeleton } from '../components/Skeleton';

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
    Fixed: '#16A34A',
    Rejected: '#EF4444',
};

const StatCard = ({ title, value, icon: Icon, trend, loading }: any) => {
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

    return (
        <div className="card-premium p-6 flex items-start justify-between hover-lift">
            <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 mt-3">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                            <TrendingUp size={12} />
                            <span>{trend.split(' ')[0]}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{trend.split(' ').slice(1).join(' ')}</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
        </div>
    );
};

const Overview = () => {
    const potholes = useMemo(() => listPotholes(), []);

    const stats = useMemo(() => {
        const total = potholes.length;
        const fixed = potholes.filter(p => p.status === 'Fixed').length;

        const allReports = listCitizenReports();
        const pendingReports = allReports.filter(r => r.aiStatus === 'PENDING').length;
        const acceptedReports = allReports.filter(r => r.aiStatus === 'ACCEPTED').length;

        return [
            { title: 'Total Potholes', value: total, icon: AlertTriangle, trend: '+12% from last week' },
            { title: 'Pending Reports', value: pendingReports, icon: Clock, trend: 'Requires Review' },
            { title: 'Accepted Reports', value: acceptedReports, icon: TrendingUp, trend: 'Confirmed cases' },
            { title: 'Fixed Count', value: fixed, icon: CheckCircle2, trend: '+8% this month' },
        ];
    }, [potholes]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        potholes.forEach(p => {
            counts[p.status] = (counts[p.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [potholes]);

    const detectionsOverTime = [
        { name: 'Mon', count: 12 },
        { name: 'Tue', count: 18 },
        { name: 'Wed', count: 15 },
        { name: 'Thu', count: 25 },
        { name: 'Fri', count: 32 },
        { name: 'Sat', count: 20 },
        { name: 'Sun', count: 14 },
    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="section-heading">Command Center</h1>
                    <p className="text-slate-500 font-medium font-bold text-sm">Monitoring Sri Lanka's road infrastructure in real-time.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Live Status</span>
                    <span className="text-xs font-bold text-slate-400 border-l border-slate-200 pl-3">{new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 card-premium p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Detection Trends</h4>
                            <p className="text-xs font-bold text-slate-400">Weekly accumulation of reported surface defects</p>
                        </div>
                        <select className="text-xs font-black uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-4 ring-slate-900/5 transition-all">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={detectionsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        borderRadius: '12px',
                                        border: 'none',
                                        color: '#fff',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#0F172A"
                                    strokeWidth={4}
                                    dot={{ r: 0 }}
                                    activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 4, stroke: '#fff' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="card-premium p-8">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2 uppercase">Status Intel</h4>
                    <p className="text-xs font-bold text-slate-400 mb-8">Fleet allocation & defect distribution</p>
                    <div className="h-[240px]">
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
                                            fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                                            className="hover:opacity-80 transition-opacity outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0F172A',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 space-y-3">
                        {statusData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: STATUS_COLORS[s.name as keyof typeof STATUS_COLORS] }} />
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{s.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 bg-slate-50 px-2 py-1 rounded-lg min-w-[32px] text-center font-bold tracking-tight">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mini Map */}
                <div className="card-premium h-[400px] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Hotspots</h4>
                        <button className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline transition-all">Telemetry Link</button>
                    </div>
                    <div className="h-[344px] relative z-0">
                        <MapContainer center={[6.9271, 79.8612]} zoom={10} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {potholes.slice(0, 10).map((p) => (
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

                {/* Recent Activity Table */}
                <div className="card-premium overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Detections</h4>
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Archive Access</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Pothole id</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Road name</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {potholes.slice(0, 6).map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-black text-slate-900 group-hover:text-accent transition-colors">#{p.id.split('-')[0]}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600 truncate max-w-[150px]">{p.roadName}</td>
                                        <td className="px-6 py-4">
                                            <StatusPill status={p.status as any} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
