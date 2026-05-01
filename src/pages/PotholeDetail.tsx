import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    updatePotholeStatus,
    getPotholeById
} from '../lib/api';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from 'react-leaflet';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    BarChart,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import type { PotholeEvent, PotholeStatus } from '../types';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { listCitizenReports } from '../lib/api';
import type { CitizenReport } from '../types';

const STATUS_OPTS: PotholeStatus[] = ['New', 'Confirmed', 'Scheduled', 'Fixed', 'Rejected'];

const PotholeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const [pothole, setPothole] = useState<PotholeEvent | null>(null);
    const [newStatus, setNewStatus] = useState<PotholeStatus>('New');
    const [note, setNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [report, setReport] = useState<CitizenReport | null>(null);

    useEffect(() => {
        const item = id ? getPotholeById(id) : undefined;
        if (item) {
            setPothole(item);
            setNewStatus(item.status);

            if (item.reportId) {
                const reps = listCitizenReports();
                const matched = reps.find(r => r.id === item.reportId);
                if (matched) setReport(matched);
            }
        }
    }, [id]);

    const handleStatusUpdate = () => {
        if (!id || !user) return;
        setIsUpdating(true);
        setTimeout(() => {
            updatePotholeStatus(id, newStatus, note || `Status changed to ${newStatus}`, user.name);
            // Refresh
            const item = id ? getPotholeById(id) : undefined;
            if (item) setPothole(item);
            setNote('');
            setIsUpdating(false);
        }, 500);
    };

    if (!pothole) return <div>Pothole not found</div>;

    const canUpdate = hasRole(['ADMIN', 'MAINTENANCE_OFFICER']);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all hover:-translate-x-1 group leading-none"
            >
                <ArrowLeft size={14} className="group-hover:scale-125 transition-transform" />
                Back to Operations
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Info & Map */}
                <div className="flex-1 space-y-8">
                    <div className="card-premium overflow-hidden border-none shadow-2xl shadow-slate-900/5">
                        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{pothole.id}</h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{pothole.roadName}, {pothole.district}</p>
                            </div>
                            <span className={cn(
                                "badge px-6 py-2 border-none shadow-sm",
                                pothole.status === 'New' ? 'bg-blue-50 text-blue-700' :
                                    pothole.status === 'Confirmed' ? 'bg-amber-50 text-amber-700' :
                                        pothole.status === 'Scheduled' ? 'bg-purple-50 text-purple-700' :
                                            pothole.status === 'Fixed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            )}>
                                {pothole.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-50 uppercase">
                            <div className="bg-white p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-slate-900 transition-colors"><Calendar size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-slate-300 font-black tracking-widest leading-none mb-1.5">Detected On</p>
                                        <p className="text-[11px] font-black text-slate-900 tracking-tight">{new Date(pothole.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-slate-900 transition-colors"><MapPin size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-slate-300 font-black tracking-widest leading-none mb-1.5">Precision Geo</p>
                                        <p className="text-[11px] font-black text-slate-900 tracking-tight">{pothole.lat.toFixed(6)}, {pothole.lon.toFixed(6)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-slate-900 transition-colors"><BarChart size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-slate-300 font-black tracking-widest leading-none mb-1.5">Source Telemetry</p>
                                        <p className="text-[11px] font-black text-slate-900 tracking-tight">#{pothole.reportId}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Citizen Report Info inserted above the map if available */}
                            {report && (
                                <div className="bg-white p-8 md:col-span-2 border-t border-slate-50">
                                    <h3 className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-6">Citizen Intelligence Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Primary Reporter</p>
                                            <p className="text-xs font-black text-slate-900">{report.submittedBy || report.citizenId}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Evidence description</p>
                                            <p className="text-xs font-bold text-slate-600 italic">"{report.description || 'No description provided.'}"</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-0 relative min-h-[250px] md:col-span-2">
                                <MapContainer center={[pothole.lat, pothole.lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[pothole.lat, pothole.lon]}>
                                        <Popup>{pothole.id}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Evidence Viewer */}
                    <EvidenceViewer
                        imageUrl={pothole.imageUrl}
                        badges={{
                            confidence: pothole.confidence,
                            status: pothole.status
                        }}
                        metadata={{
                            timestamp: pothole.timestamp,
                            lat: pothole.lat,
                            lon: pothole.lon,
                            district: pothole.district,
                            roadName: pothole.roadName,

                            // Inject AI/ML metadata sourced from CitizenReport directly or Pothole 
                            ...(pothole.bbox ? { bbox: pothole.bbox } : {}),
                            ...(report?.modelName ? { modelName: report.modelName } : {}),
                            ...(report?.modelVersion ? { modelVersion: report.modelVersion } : {}),
                            ...(report?.inferenceTimeMs ? { inferenceTimeMs: report.inferenceTimeMs } : {})
                        }}
                    />
                </div>

                {/* Right Column: Workflow & Audit */}
                <div className="w-full lg:w-96 space-y-6">
                    {/* Status Update Card */}
                    <div className="card-premium p-8 border-none shadow-2xl shadow-slate-900/5">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                            <ShieldCheck size={16} className="text-slate-900" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] leading-none">Operations Workflow</span>
                        </div>

                        {!canUpdate ? (
                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 p-6 rounded-2xl border border-amber-100 leading-relaxed">
                                <span className="block mb-2 text-amber-500 opacity-60">Security Notice</span>
                                Restricted access. Elevated privileges required to modify deployment status.
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Transition Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STATUS_OPTS.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setNewStatus(opt)}
                                                className={cn(
                                                    "px-3 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                                                    newStatus === opt
                                                        ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                                                        : "border-slate-100 text-slate-400 hover:border-slate-300"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Command Log Note</label>
                                    <textarea
                                        className="w-full px-5 py-4 text-xs font-bold bg-slate-50 border-none rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 placeholder:text-slate-300"
                                        rows={4}
                                        placeholder="Enter operational deployment details..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdating || newStatus === pothole.status && !note}
                                    className="btn-premium w-full py-5 bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
                                >
                                    {isUpdating ? 'Executing...' : 'Confirm Deployment'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Activity Timeline */}
                    <ActivityTimeline entityId={pothole.id} />
                </div>
            </div>
        </div>
    );
};

export default PotholeDetail;
