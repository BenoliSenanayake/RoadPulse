import { useState, useMemo, useEffect } from 'react';
import { listCitizenReports, reviewCitizenReport } from '../lib/api';
import type { CitizenReport } from '../types';
import { formatDistanceToNow, isAfter, subHours, subDays } from 'date-fns';
import { CheckCircle, XCircle, MapPin, AlertTriangle, Filter, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { ActivityTimeline } from '../components/ActivityTimeline';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

const ReviewQueue = () => {
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Filters
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('PENDING');
    const [filterDate, setFilterDate] = useState<'ALL' | '24H' | '7D'>('ALL');
    const [filterConfidence, setFilterConfidence] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');

    useEffect(() => {
        setReports(listCitizenReports().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, []);

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            // Status filter
            if (filterStatus !== 'ALL' && r.aiStatus !== filterStatus) return false;

            // Date filter
            if (filterDate === '24H' && !isAfter(new Date(r.createdAt), subHours(new Date(), 24))) return false;
            if (filterDate === '7D' && !isAfter(new Date(r.createdAt), subDays(new Date(), 7))) return false;

            // Confidence filter
            if (filterConfidence === 'HIGH' && (r.aiConfidence || 0) < 0.8) return false;
            if (filterConfidence === 'LOW' && (r.aiConfidence || 0) >= 0.8) return false;

            return true;
        });
    }, [reports, filterStatus, filterDate, filterConfidence]);

    const handleAction = (id: string, action: 'accept' | 'reject') => {
        if (action === 'reject' && !rejectionReason.trim()) {
            alert("Please provide a rejection reason.");
            return;
        }
        if (window.confirm(`Are you sure you want to manually ${action} this report?`)) {
            reviewCitizenReport(id, action, action === 'reject' ? rejectionReason : undefined);
            const fresh = listCitizenReports().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setReports(fresh);
            setSelectedReport(fresh.find(r => r.id === id) || null);
            setRejectionReason('');
        }
    };

    const getStatusStyles = (status: CitizenReport['aiStatus']) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight mb-2">Review Queue</h1>
                    <p className="text-gray-500">Citizen reports requiring validation or already processed by AI.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-border">
                    <div className="flex items-center gap-2 pl-2 border-r border-border pr-3">
                        <Filter size={16} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filters</span>
                    </div>

                    <select
                        value={filterStatus}
                        onChange={e => {
                            setFilterStatus(e.target.value as any);
                            setSelectedReport(null);
                        }}
                        className="text-sm bg-gray-50 border-none rounded-lg focus:ring-0 cursor-pointer font-medium text-gray-700"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="ACCEPTED">Accepted Only</option>
                        <option value="REJECTED">Rejected Only</option>
                    </select>

                    <select
                        value={filterDate}
                        onChange={e => {
                            setFilterDate(e.target.value as any);
                            setSelectedReport(null);
                        }}
                        className="text-sm bg-gray-50 border-none rounded-lg focus:ring-0 cursor-pointer font-medium text-gray-700"
                    >
                        <option value="ALL">All Time</option>
                        <option value="24H">Last 24 Hours</option>
                        <option value="7D">Last 7 Days</option>
                    </select>

                    <select
                        value={filterConfidence}
                        onChange={e => {
                            setFilterConfidence(e.target.value as any);
                            setSelectedReport(null);
                        }}
                        className="text-sm bg-gray-50 border-none rounded-lg focus:ring-0 cursor-pointer font-medium text-gray-700"
                    >
                        <option value="ALL">Any Confidence</option>
                        <option value="HIGH">High (&gt;80%)</option>
                        <option value="LOW">Low (&lt;80%)</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-6 overflow-hidden flex-1">
                {/* Table View */}
                <div className={`card flex-1 flex flex-col overflow-hidden transition-all duration-300 ${selectedReport ? 'hidden lg:flex lg:w-1/2' : 'w-full'}`}>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-4 text-xs uppercase tracking-wider font-bold text-gray-500 border-b border-border">Date & ID</th>
                                    <th className="px-4 py-4 text-xs uppercase tracking-wider font-bold text-gray-500 border-b border-border">Location</th>
                                    <th className="px-4 py-4 text-xs uppercase tracking-wider font-bold text-gray-500 border-b border-border w-32">AI Status</th>
                                    <th className="px-4 py-4 text-xs uppercase tracking-wider font-bold text-gray-500 border-b border-border text-center">Config</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border overflow-y-auto">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-gray-500">
                                            <CheckCircle size={40} className="mx-auto mb-4 text-gray-300" />
                                            No reports match your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map(report => (
                                        <tr
                                            key={report.id}
                                            onClick={() => setSelectedReport(report)}
                                            className={`cursor-pointer transition-colors group ${selectedReport?.id === report.id ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-400 mb-1">
                                                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                                    </span>
                                                    <span className={`text-sm font-mono font-bold ${selectedReport?.id === report.id ? 'text-primary' : 'text-gray-900 group-hover:text-primary transition-colors'}`}>
                                                        {report.id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400 shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-700 truncate max-w-[150px]">
                                                            {report.description ? report.description.split('] ')[0].replace('[', '') : `${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">
                                                            {report.lat.toFixed(4)}, {report.lon.toFixed(4)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 flex items-center justify-center rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(report.aiStatus)}`}>
                                                    {report.aiStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center align-middle">
                                                {report.aiConfidence !== undefined ? (
                                                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded bg-gray-100 inline-block ${report.aiConfidence >= 0.8 ? 'text-green-600' : report.aiConfidence < 0.5 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                        {(report.aiConfidence * 100).toFixed(0)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail View Drawer/Pane */}
                {selectedReport && (
                    <div className="card w-full lg:w-1/2 flex flex-col overflow-hidden bg-white shadow-xl lg:shadow-none border-l-0 lg:border-l border-border rounded-none lg:rounded-2xl">
                        {/* Drawer Header for Mobile */}
                        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-gray-50">
                            <span className="font-bold text-gray-700">Report Details</span>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-500 hover:text-gray-900">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {/* Hero Image Container */}
                            <div className="relative h-64 bg-gray-900 flex items-center justify-center custom-scroll">
                                <img
                                    src={selectedReport.imageUrl}
                                    alt="Pothole"
                                    className="max-w-full max-h-full object-contain"
                                />

                                {/* BBox Overlay if available */}
                                {selectedReport.aiStatus === 'ACCEPTED' && selectedReport.bbox && (
                                    <div
                                        className="absolute border-4 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)] pointer-events-none z-10"
                                        style={{
                                            left: `${selectedReport.bbox[0] * 100}%`,
                                            top: `${selectedReport.bbox[1] * 100}%`,
                                            width: `${selectedReport.bbox[2] * 100}%`,
                                            height: `${selectedReport.bbox[3] * 100}%`
                                        }}
                                    >
                                        <div className="absolute -top-7 left-[-4px] bg-emerald-400 text-black text-[10px] font-black px-2 py-1 uppercase tracking-wider shadow-md whitespace-nowrap">
                                            {selectedReport.modelName || 'POTHOLE'} {(selectedReport.aiConfidence! * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Metadata & Map Grid */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reporter</p>
                                            <p className="text-sm font-semibold text-gray-800">{selectedReport.submittedBy}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Citizen Note</p>
                                            <p className="text-sm text-gray-600 italic">"{selectedReport.description || 'No notes provided.'}"</p>
                                        </div>
                                    </div>
                                    <div className="h-32 rounded-xl overflow-hidden border border-gray-200 shadow-inner translate-z-0">
                                        <MapContainer center={[selectedReport.lat, selectedReport.lon]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapController center={[selectedReport.lat, selectedReport.lon]} />
                                            <Marker position={[selectedReport.lat, selectedReport.lon]} />
                                        </MapContainer>
                                    </div>
                                </div>

                                {/* AI Analysis Panel */}
                                <div className={`rounded-xl p-5 border ${selectedReport.aiStatus === 'PENDING' ? 'bg-blue-50 border-blue-100' :
                                    selectedReport.aiStatus === 'ACCEPTED' ? 'bg-green-50 border-green-100' :
                                        'bg-red-50 border-red-100'
                                    }`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={16} className={selectedReport.aiStatus === 'ACCEPTED' ? 'text-green-600' : selectedReport.aiStatus === 'REJECTED' ? 'text-red-600' : 'text-blue-600'} />
                                            <span className="font-black text-sm uppercase tracking-wider text-gray-800">System Analysis</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white shadow-sm ${selectedReport.aiStatus === 'ACCEPTED' ? 'text-green-700' : selectedReport.aiStatus === 'REJECTED' ? 'text-red-700' : 'text-blue-700'}`}>
                                            {selectedReport.aiStatus}
                                        </span>
                                    </div>

                                    {selectedReport.aiConfidence !== undefined && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-gray-500">Confidence Score</span>
                                                <span className="text-gray-700">{(selectedReport.aiConfidence * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                                                <div
                                                    className={`h-full ${selectedReport.aiConfidence >= 0.6 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    style={{ width: `${selectedReport.aiConfidence * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedReport.aiReason && (
                                        <p className="text-sm font-medium text-red-800 bg-white/50 p-3 rounded-lg mt-3 border border-red-100">
                                            <span className="block text-[10px] font-black text-red-600/70 uppercase mb-1">Rejection Reason</span>
                                            {selectedReport.aiReason}
                                        </p>
                                    )}
                                </div>

                                {/* Timeline Integration */}
                                <div className="mt-4">
                                    <ActivityTimeline entityId={selectedReport.id} />
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-border bg-gray-50 shrink-0">
                            {selectedReport.aiStatus === 'ACCEPTED' && selectedReport.linkedPotholeId ? (
                                <Link
                                    to={`/potholes/${selectedReport.linkedPotholeId}`}
                                    className="w-full py-4 bg-white border border-gray-300 text-gray-900 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    Open Official Pothole Record
                                    <ExternalLink size={18} />
                                </Link>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Reason for rejection (required if rejecting)..."
                                        className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction(selectedReport.id, 'reject')}
                                            className="flex-1 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors shadow-sm"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedReport.id, 'accept')}
                                            className="flex-[2] py-3 bg-gray-900 border border-transparent text-white hover:bg-black font-bold rounded-xl transition-all shadow-md active:scale-95"
                                        >
                                            Accept & Link
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewQueue;
