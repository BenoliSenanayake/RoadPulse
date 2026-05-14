import { useState, useMemo, useEffect } from 'react';
import { reportsApi } from '../lib/api';
import type { CitizenReport } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, AlertTriangle, ChevronRight, Inbox, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ResponsiveDataList } from '../components/ResponsiveDataList';
import { cn } from '../lib/utils';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { normalizeProvince } from '../lib/provinceResolver';
import { filterReportsForProvince, hasOfficerProvince, logStaffReportFilter, OFFICER_PROVINCE_MISSING } from '../lib/staffReportFilters';

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
    const { user } = useAuth();
    const province = user?.provincialCouncil;
    const [reports, setReports] = useState<CitizenReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Tabs
    const [activeTab, setActiveTab] = useState<'AI_VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED'>('AI_VERIFIED');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!hasOfficerProvince(province)) {
                setError(OFFICER_PROVINCE_MISSING);
                setLoading(false);
                return;
            }
            const staffProvince = normalizeProvince(province);
            console.log(`[ReviewQueue Debug] Current User:`, user?.email, staffProvince);
            
            // Fetch from backend with province filter
            const response = await reportsApi.list({ 
                provincialCouncil: province,
                limit: 100 // Fetch a larger chunk for the review queue
            });
            const data = response.data || [];
            console.log(`[ReviewQueue] Raw telemetry: ${data.length} reports.`);
            
            const filtered = filterReportsForProvince(data, province);
            console.log(`[ReviewQueue] Filtered for ${staffProvince}: ${filtered.length} reports.`);
            logStaffReportFilter('Review Queue', province, data, filtered);
            
            setReports(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
            console.error(e);
            setError("Failed to load review queue. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        // Real-time synchronization: Poll every 30 seconds
        const interval = setInterval(fetchReports, 30000);
        return () => clearInterval(interval);
    }, [province]);

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const cls = r.aiClassification || 'NEEDS_MANUAL_REVIEW';
            if (activeTab === 'AI_VERIFIED') return cls === 'VERIFIED_POTHOLE';
            if (activeTab === 'NEEDS_REVIEW') return cls === 'NEEDS_MANUAL_REVIEW';
            if (activeTab === 'REJECTED') return cls === 'REJECTED';
            return false;
        });
    }, [reports, activeTab]);

    const handleAction = (id: string, action: 'accept' | 'reject' | 'request_info') => {
        if ((action === 'reject' || action === 'request_info') && !rejectionReason.trim()) {
            alert(`Please provide a note to ${action === 'reject' ? 'reject' : 'request info'}.`);
            return;
        }
        if (window.confirm(`Are you sure you want to manually ${action} this report?`)) {
            setLoading(true);
            reportsApi.review(id, action, (action === 'reject' || action === 'request_info') ? rejectionReason : undefined)
                .then(() => reportsApi.list({ provincialCouncil: province, limit: 100 }))
                .then(response => {
                    const fresh = response.data || [];
                    const sorted = filterReportsForProvince(fresh, province)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setReports(sorted);
                    setSelectedReport(sorted.find(r => r.id === id) || null);
                    setRejectionReason('');
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    };

    const columns = [
        {
            header: 'Incident ID',
            render: (report: CitizenReport) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                    <span className={cn(
                        "text-xs font-bold tracking-tight transition-colors",
                        selectedReport?.id === report.id ? "text-white" : "text-slate-900 group-hover:text-[var(--accent-solid)]"
                    )}>
                        #{report.id.slice(0, 8)}
                    </span>
                </div>
            )
        },
        {
            header: 'Operational Area',
            render: (report: CitizenReport) => (
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        selectedReport?.id === report.id ? "bg-white/10 text-white" : "bg-slate-50 text-slate-400"
                    )}>
                        <MapPin size={12} />
                    </div>
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-[11px] font-bold truncate max-w-[120px] uppercase tracking-tight",
                            selectedReport?.id === report.id ? "text-white" : "text-slate-700"
                        )}>
                            {report.description ? report.description.split('] ')[0].replace('[', '') : `${report.lat.toFixed(2)}, ${report.lon.toFixed(2)}`}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Classification',
            className: 'text-center',
            render: (report: CitizenReport) => (
                <div className="flex flex-col items-center gap-1.5">
                    <StatusPill status={(report.aiClassification as any) || 'NEEDS_MANUAL_REVIEW'} />
                </div>
            )
        }
    ];

    const renderCard = (report: CitizenReport) => (
        <div className={cn(
            "p-5 transition-all duration-300",
            selectedReport?.id === report.id ? 'bg-slate-900 text-white shadow-2xl' : 'hover:bg-slate-50'
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                    <h3 className="text-sm font-bold tracking-tight">#{report.id.slice(0, 8)}</h3>
                </div>
                <StatusPill status={(report.aiClassification as any) || 'NEEDS_MANUAL_REVIEW'} />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin size={12} className={selectedReport?.id === report.id ? "text-white/40" : "text-slate-400"} />
                    <span className="text-[10px] font-bold truncate max-w-[150px]">
                        {report.description ? report.description.split('] ')[0].replace('[', '') : `${report.lat.toFixed(2)}, ${report.lon.toFixed(2)}`}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-fade-in-up">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 px-2">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">Report Review</h1>
                    <p className="text-slate-500 font-medium text-sm">Review citizen road reports and decide whether they should become repair records.</p>
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-100 shadow-inner">
                    <button
                        onClick={() => { setActiveTab('AI_VERIFIED'); setSelectedReport(null); }}
                        className={cn("px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", activeTab === 'AI_VERIFIED' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700")}
                    >
                        AI-Verified
                    </button>
                    <button
                        onClick={() => { setActiveTab('NEEDS_REVIEW'); setSelectedReport(null); }}
                        className={cn("px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", activeTab === 'NEEDS_REVIEW' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700")}
                    >
                        Manual Review
                    </button>
                    <button
                        onClick={() => { setActiveTab('REJECTED'); setSelectedReport(null); }}
                        className={cn("px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", activeTab === 'REJECTED' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700")}
                    >
                        Rejected
                    </button>
                </div>
            </div>


            {error ? (
                <div className="flex-1 flex items-center justify-center pb-12">
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md w-full">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="text-rose-500 w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">Failed to load data</h2>
                        <p className="text-slate-500 font-bold">{error}</p>
                    </div>
                </div>
            ) : !loading && reports.length === 0 ? (
                <div className="flex-1 flex items-center justify-center pb-12">
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm max-w-md w-full">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Inbox className="text-slate-400 w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">Queue Empty</h2>
                        <p className="text-slate-500 font-bold">There are no reports in the system.</p>
                    </div>
                </div>
            ) : (
                <div className="flex gap-6 overflow-hidden flex-1 pb-4">
                {/* List View */}
                <div className={cn(
                    "card-premium flex-1 flex flex-col overflow-hidden transition-all duration-500 border-none shadow-premium",
                    selectedReport ? "hidden lg:flex lg:w-1/2" : "w-full"
                )}>
                    <ResponsiveDataList
                        data={filteredReports}
                        columns={columns}
                        renderCard={renderCard}
                        keyExtractor={(r) => r.id}
                        onRowClick={(r) => setSelectedReport(r)}
                        className="flex-1 overflow-y-auto custom-scroll"
                        emptyState={
                            loading ? (
                                <div className="p-12 flex justify-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                                    Loading reports...
                                </div>
                            ) : (
                                <div className="p-12">
                                    <EmptyState
                                        title="Jurisdiction Clear"
                                        description="No citizen reports match the selected review filter."
                                        icon={Inbox}
                                    />
                                </div>
                            )
                        }
                    />
                </div>

                {/* Detail View Drawer/Pane */}
                {selectedReport && (
                    <div className="flex-1 lg:w-1/2 flex flex-col overflow-hidden bg-white shadow-premium rounded-2xl border border-slate-100 relative z-20 animate-fade-in-up">
                        <div className="lg:hidden flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/50">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Report Details</span>
                            <button onClick={() => setSelectedReport(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 custom-scroll">
                            {/* Hero Image Container */}
                            <div className="relative border-b border-slate-50">
                                <div className="bg-slate-50">
                                    <img src={selectedReport.imageUrl} alt="Road damage evidence" className="h-[320px] w-full object-cover" />
                                </div>
                            </div>

                            <div className="p-8 space-y-10">
                                {/* Metadata & Map Grid */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Reporter</p>
                                            <p className="text-sm font-bold text-slate-900 tracking-tight">{selectedReport.submittedBy}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Citizen Description</p>
                                            <p className="text-xs font-medium text-slate-500 italic leading-relaxed border-l-2 border-slate-100 pl-4 py-0.5">
                                                "{selectedReport.description || 'No testimony provided.'}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-40 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative">
                                        <MapContainer center={[selectedReport.lat, selectedReport.lon]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <MapController center={[selectedReport.lat, selectedReport.lon]} />
                                            <Marker position={[selectedReport.lat, selectedReport.lon]} />
                                        </MapContainer>
                                        <div className="absolute inset-0 ring-1 ring-inset ring-slate-900/5 rounded-xl pointer-events-none" />
                                    </div>
                                </div>

                                {/* Review Summary */}
                                <div className={cn(
                                    "rounded-xl p-6 border shadow-sm",
                                    selectedReport.aiStatus === 'PENDING' ? 'bg-amber-50/20 border-amber-100' :
                                        selectedReport.aiStatus === 'ACCEPTED' ? 'bg-[var(--accent-bg)] border-[var(--accent-border)]' :
                                            'bg-rose-50/20 border-rose-100'
                                )}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle size={14} className={cn(
                                                selectedReport.aiStatus === 'ACCEPTED' ? 'text-[var(--accent-solid)]' :
                                                    selectedReport.aiStatus === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'
                                            )} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Review Summary</span>
                                        </div>
                                        <StatusPill status={selectedReport.aiStatus as any} />
                                    </div>

                                    {selectedReport.aiReason && (
                                        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm">
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Review Note</span>
                                            <p className="text-xs font-semibold leading-relaxed text-slate-700">{selectedReport.aiReason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Operational Timeline */}
                                <div className="pt-2">
                                    <ActivityTimeline entityId={selectedReport.id} />
                                </div>
                            </div>
                        </div>

                        {/* Tactical Actions Footer */}
                        <div className="p-8 border-t border-slate-50 bg-white/80 backdrop-blur-sm shrink-0">
                            {selectedReport.aiStatus === 'ACCEPTED' && selectedReport.linkedPotholeId ? (
                                <Link
                                    to={`/staff/reports/${selectedReport.linkedPotholeId}`}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-all"
                                >
                                    Access Official Record
                                    <ChevronRight size={16} />
                                </Link>
                            ) : (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Enter mandatory audit rationale..."
                                        className="w-full px-5 py-3 text-[11px] font-semibold bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:bg-white focus:border-[var(--accent-border)] transition-all"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleAction(selectedReport.id, 'reject')}
                                            className="flex-1 py-3 bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedReport.id, 'request_info')}
                                            className="flex-1 py-3 bg-white text-amber-600 border border-amber-100 hover:bg-amber-50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                        >
                                            Inquiry
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedReport.id, 'accept')}
                                            className="flex-[2] min-w-full sm:min-w-0 py-3 bg-slate-900 text-white hover:bg-black font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg"
                                        >
                                            Confirm Case
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default ReviewQueue;
