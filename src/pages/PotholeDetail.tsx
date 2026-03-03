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
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
            >
                <ArrowLeft size={16} />
                Back to List
            </button>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Info & Map */}
                <div className="flex-1 space-y-6">
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-border bg-gray-50/50 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-text">{pothole.id}</h1>
                                <p className="text-sm text-gray-500">{pothole.roadName}, {pothole.district}</p>
                            </div>
                            <div className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white",
                                pothole.status === 'New' ? 'bg-blue-600' :
                                    pothole.status === 'Confirmed' ? 'bg-amber-500' :
                                        pothole.status === 'Scheduled' ? 'bg-purple-500' :
                                            pothole.status === 'Fixed' ? 'bg-emerald-600' : 'bg-red-500'
                            )}>
                                {pothole.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
                            <div className="bg-white p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-400"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Detected On</p>
                                        <p className="text-sm font-semibold">{new Date(pothole.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-400"><MapPin size={18} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Coordinates</p>
                                        <p className="text-sm font-semibold">{pothole.lat.toFixed(6)}, {pothole.lon.toFixed(6)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-gray-100 text-gray-400"><BarChart size={18} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Source Data</p>
                                        <p className="text-sm font-semibold">Report ID: {pothole.reportId}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Citizen Report Info inserted above the map if available */}
                            {report && (
                                <div className="bg-white p-6 md:col-span-2 border-t border-border">
                                    <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Citizen Report Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Reporter</p>
                                            <p className="text-sm font-semibold">{report.submittedBy || 'Anonymous'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Citizen Description</p>
                                            <p className="text-sm italic text-gray-600">"{report.description || 'No description provided.'}"</p>
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
                            severity: pothole.severity,
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
                    <div className="card p-6">
                        <div className="flex items-center gap-2 mb-4 font-semibold text-text border-b border-border pb-2">
                            <ShieldCheck size={18} className="text-primary" />
                            Workflow Management
                        </div>

                        {!canUpdate ? (
                            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg flex gap-2">
                                <span className="font-bold">Note:</span>
                                You don't have permission to modify this record.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Update Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STATUS_OPTS.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setNewStatus(opt)}
                                                className={cn(
                                                    "px-3 py-2 text-xs font-medium border rounded-lg transition-all",
                                                    newStatus === opt
                                                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                                        : "border-border text-gray-600 hover:border-gray-400"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Internal Note</label>
                                    <textarea
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-border rounded-lg focus:outline-none"
                                        rows={3}
                                        placeholder="Add repair notes or scheduling info..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdating || newStatus === pothole.status && !note}
                                    className="w-full btn-primary disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Confirm Update'}
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
