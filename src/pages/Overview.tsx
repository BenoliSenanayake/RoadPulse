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
import { getPotholes } from '../mockData';
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

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="card p-6 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-text">{value}</h3>
            {trend && (
                <div className="flex items-center gap-1 mt-2 text-xs font-medium text-green-600">
                    <TrendingUp size={14} />
                    <span>{trend}</span>
                </div>
            )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}/10 text-${color}`}>
            <Icon size={24} />
        </div>
    </div>
);

const STATUS_COLORS = {
    New: '#2563EB',
    Confirmed: '#F59E0B',
    Scheduled: '#A855F7',
    Fixed: '#16A34A',
    Rejected: '#EF4444',
};

const Overview = () => {
    const potholes = useMemo(() => getPotholes(), []);

    const stats = useMemo(() => {
        const total = potholes.length;
        const fixed = potholes.filter(p => p.status === 'Fixed').length;
        const newItems = potholes.filter(p => p.status === 'New').length;
        return [
            { title: 'Total Detections', value: total, icon: AlertTriangle, color: '[#2563EB]', trend: '+12% from last week' },
            { title: 'New (Unconfirmed)', value: newItems, icon: Clock, color: '[#F59E0B]', trend: '-4% from yesterday' },
            { title: 'Total Repaired', value: fixed, icon: CheckCircle2, color: '[#16A34A]', trend: '+8% this month' },
            { title: 'Avg. Confidence', value: '88.4%', icon: TrendingUp, color: '[#14B8A6]' },
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text">Operations Overview</h1>
                <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 card p-6">
                    <h4 className="text-base font-semibold mb-6">Weekly Detection Trends</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={detectionsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#2563EB"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="card p-6">
                    <h4 className="text-base font-semibold mb-6">Status Distribution</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {statusData.map((s) => (
                            <div key={s.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name as keyof typeof STATUS_COLORS] }} />
                                    <span className="font-medium text-gray-600">{s.name}</span>
                                </div>
                                <span className="font-bold">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mini Map */}
                <div className="card h-[400px]">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h4 className="text-base font-semibold">Active Hotspots</h4>
                        <button className="text-primary text-xs font-semibold hover:underline">View Full Map</button>
                    </div>
                    <div className="h-[344px] relative z-0">
                        <MapContainer center={[6.9271, 79.8612]} zoom={10} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {potholes.slice(0, 10).map((p) => (
                                <Marker key={p.id} position={[p.lat, p.lon]}>
                                    <Popup>
                                        <div className="text-xs">
                                            <p className="font-bold">{p.id}</p>
                                            <p>{p.roadName}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="card">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h4 className="text-base font-semibold">Recent Detections</h4>
                        <button className="text-primary text-xs font-semibold hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-border">
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-500">ID</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-500">Road</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-500">Severity</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {potholes.slice(0, 6).map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-primary">{p.id}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[150px]">{p.roadName}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold",
                                                p.severity === 'High' ? "bg-red-100 text-red-700" :
                                                    p.severity === 'Medium' ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-green-100 text-green-700"
                                            )}>
                                                {p.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[p.status as keyof typeof STATUS_COLORS] }} />
                                                <span className="text-sm font-medium">{p.status}</span>
                                            </div>
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
