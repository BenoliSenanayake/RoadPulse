import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getRepairUpdates,
    getPotholes,
    updatePotholeStatus
} from '../mockData';
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
    History,
    MessageSquare,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import type { PotholeEvent, PotholeStatus } from '../types';

const STATUS_OPTS: PotholeStatus[] = ['New', 'Confirmed', 'Scheduled', 'Fixed', 'Rejected'];

const PotholeDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const [pothole, setPothole] = useState<PotholeEvent | null>(null);
    const [updates, setUpdates] = useState<any[]>([]);
    const [newStatus, setNewStatus] = useState<PotholeStatus>('New');
    const [note, setNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const list = getPotholes();
        const item = list.find(p => p.id === id);
        if (item) {
            setPothole(item);
            setNewStatus(item.status);
            setUpdates(getRepairUpdates(id!));
        }
    }, [id]);

    const handleStatusUpdate = () => {
        if (!id || !user) return;
        setIsUpdating(true);
        setTimeout(() => {
            updatePotholeStatus(id, newStatus, note || `Status changed to ${newStatus}`, user.name);
            // Refresh
            const list = getPotholes();
            const item = list.find(p => p.id === id);
            if (item) setPothole(item);
            setUpdates(getRepairUpdates(id));
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
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Detection Data</p>
                                        <p className="text-sm font-semibold">Confidence: {(pothole.confidence * 100).toFixed(1)}% | Severity: {pothole.severity}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-0 relative min-h-[250px]">
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
                    <div className="card">
                        <div className="p-4 border-b border-border font-semibold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} className="text-primary" />
                                Visual Evidence Analysis
                            </div>
                            <div className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">AI Verified</div>
                        </div>
                        <div className="p-4 bg-gray-900 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
                            {pothole.imageUrl ? (
                                <>
                                    <img
                                        src={pothole.imageUrl}
                                        alt="Pothole Evidence"
                                        className="rounded-lg shadow-2xl max-w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity"
                                    />

                                    {/* Mock Bounding Box Overlay */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-emerald-400 rounded-sm shadow-[0_0_15px_rgba(52,211,153,0.5)] flex flex-col items-start justify-start p-1 pointer-events-none">
                                        <div className="bg-emerald-400 text-black text-[8px] font-black px-1 rounded-sm uppercase mb-1">
                                            Detection CID: {pothole.id}
                                        </div>
                                    </div>

                                    {/* Overlay Data Panels */}
                                    <div className="absolute top-8 left-8 flex flex-col gap-2">
                                        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500 rounded-lg text-white">
                                                <BarChart size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Confidence</p>
                                                <p className="text-sm font-black text-white">{(pothole.confidence * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg text-white",
                                                pothole.severity === 'High' ? 'bg-red-500' : 'bg-amber-500'
                                            )}>
                                                <AlertCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Severity</p>
                                                <p className="text-sm font-black text-white uppercase">{pothole.severity}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Technical Telemetry Metadata */}
                                    <div className="absolute bottom-6 right-6 text-[9px] font-mono text-white/40 flex flex-col items-end">
                                        <span>FRAME_ID: {pothole.frameId || '7X-992-B'}</span>
                                        <span>LAT: {pothole.lat.toFixed(6)}</span>
                                        <span>LON: {pothole.lon.toFixed(6)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 mb-2" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Low Signal: No Image Data</p>
                                </div>
                            )}
                        </div>
                    </div>
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

                    {/* Audit Log / History */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center gap-2 font-semibold">
                            <History size={18} />
                            Maintenance History
                        </div>
                        <div className="p-6 relative">
                            <div className="absolute left-8 top-10 bottom-10 w-px bg-gray-200" />
                            <div className="space-y-8 relative z-10">
                                {updates.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-gray-400">No updates yet</div>
                                ) : (
                                    updates.slice().reverse().map((update) => (
                                        <div key={update.id} className="flex gap-4">
                                            <div className="w-4 h-4 rounded-full bg-white border-2 border-primary ring-4 ring-primary/10 mt-1 shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-text uppercase p-1 bg-gray-100 rounded leading-none">{update.status}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(update.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-700 leading-relaxed mb-1">{update.note}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">— {update.updatedBy}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {/* Original Detection Entry */}
                                <div className="flex gap-4">
                                    <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-white mt-1 shrink-0" />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase p-1 bg-gray-50 rounded leading-none">Detected</span>
                                            <span className="text-[10px] text-gray-400">{new Date(pothole.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 italic">Initial system detection from {pothole.runId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PotholeDetail;
