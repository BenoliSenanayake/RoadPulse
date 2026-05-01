import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import {
    MapPin, CheckCircle2,
    Locate, Navigation, ArrowRight, ArrowLeft,
    AlertCircle, PlusCircle, X, LogIn
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { reportsApi, aiApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import type { DetectionResult } from '../../lib/aiValidationService';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
    useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
    return null;
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => { map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 }); }, [center, map]);
    return null;
}

type Step = 'PHOTO' | 'LOCATION' | 'DETAILS' | 'REVIEW' | 'AUTH' | 'SUBMITTING';

const compressImage = (file: File): Promise<string> => new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1200;
            let { width, height } = img;
            if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
            else { if (height > MAX) { width *= MAX / height; height = MAX; } }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    };
});

const STEPS_INFO = [
    { id: 'PHOTO', label: 'Photo' },
    { id: 'LOCATION', label: 'Location' },
    { id: 'DETAILS', label: 'Details' },
    { id: 'REVIEW', label: 'Review' },
];

const ReportWizard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('PHOTO');

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [lat, setLat] = useState(6.9271);
    const [lon, setLon] = useState(79.8612);
    const [roadName, setRoadName] = useState('');
    const [description, setDescription] = useState('');

    const [error, setError] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    // AI runs silently in background — result used for backend only, never shown
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return; }
        if (file.size > 10 * 1024 * 1024) { setError('Image is too large. Maximum size is 10MB.'); return; }
        setImageFile(file);
        const compressed = await compressImage(file);
        setPreviewUrl(compressed);
        setStep('LOCATION');
        // Silently kick off AI analysis — never expose result to user
        aiApi.verifyImage(file).then(setDetectionResult).catch(() => null);
    };

    const handleGetLocation = () => {
        setError('');
        if (!('geolocation' in navigator)) { setError('Geolocation is not supported by your browser.'); return; }
        navigator.geolocation.getCurrentPosition(
            pos => { setLat(pos.coords.latitude); setLon(pos.coords.longitude); setIsMapModalOpen(true); },
            () => setError('Please enable location access or pin your location on the map.'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async () => {
        if (!user) {
            navigate('/login', { state: { from: { pathname: '/citizen/report' } }, replace: true });
            return;
        }

        setStep('SUBMITTING');
        try {
            const formData = new FormData();
            formData.append('citizenId', user.id);
            formData.append('lat', lat.toString());
            formData.append('lon', lon.toString());
            const fullDesc = `${roadName ? `[${roadName}] ` : ''}${description}`.trim();
            if (fullDesc) formData.append('description', fullDesc);
            if (imageFile) formData.append('image', imageFile);
            // Silently attach AI result if available
            if (detectionResult) {
                formData.append('aiStatus', detectionResult.aiStatus);
                formData.append('aiConfidence', String(detectionResult.confidence));
            }
            const report = await reportsApi.submit(formData);
            navigate(`/citizen/status/${report.id}`);
        } catch {
            setError('Submission failed. Please check your connection and try again.');
            setStep('REVIEW');
        }
    };

    const stepIndex = STEPS_INFO.findIndex(s => s.id === step);

    // ── Submitting overlay ──
    if (step === 'SUBMITTING') return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-slate-900 mb-1">Submitting your report…</h2>
            <p className="text-sm text-slate-400">This will only take a moment.</p>
        </div>
    );

    // ── Auth gate ──
    if (step === 'AUTH') return (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-slate-100">
                    <LogIn size={24} className="text-slate-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to submit</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        You need an account to submit a report so we can keep you updated on its progress.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/login"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors"
                    >
                        <LogIn size={16} /> Sign In
                    </Link>
                    <Link
                        to="/signup"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
                    >
                        Create a free account
                    </Link>
                    <button
                        onClick={() => setStep('REVIEW')}
                        className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        ← Go back to review
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-lg mx-auto px-4 py-8 sm:py-10 pb-24">

            {/* ── Progress bar (non-PHOTO steps) ── */}
            {step !== 'PHOTO' && (
                <div className="flex items-center justify-between mb-10 bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                    {STEPS_INFO.map((s, i) => (
                        <div key={s.id} className="flex-1 flex items-center justify-center">
                            <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                step === s.id ? "bg-slate-900 text-white scale-110 shadow-md" :
                                    stepIndex > i ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300"
                            )}>
                                {stepIndex > i ? <CheckCircle2 size={17} /> : i + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Step 1: Photo ── */}
            {step === 'PHOTO' && (
                <div className="space-y-8">
                    <div className="text-center space-y-2 mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Report a Pothole</h1>
                        <p className="text-sm text-slate-500">Start by uploading a clear photo of the road damage.</p>
                    </div>
                    <label className="cursor-pointer group block">
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4 transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] shadow-sm">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <PlusCircle size={30} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 mb-1">Upload a photo</h3>
                                <p className="text-xs text-slate-400">Tap to take or choose a photo from your device</p>
                            </div>
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                        </div>
                    </label>
                    {error && (
                        <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 border border-rose-100 rounded-lg p-3">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: Location ── */}
            {step === 'LOCATION' && (
                <div className="space-y-6">
                    <div className="text-center space-y-1 mb-2">
                        <h2 className="text-xl font-bold text-slate-900">Where is the pothole?</h2>
                        <p className="text-sm text-slate-400">Use GPS or tap the map to pin the exact location.</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                        <button
                            onClick={handleGetLocation}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Locate size={18} className="animate-pulse" /> Use My Current Location
                        </button>

                        <div className="flex items-center gap-3 text-slate-200 text-xs font-medium">
                            <div className="flex-1 h-px bg-slate-100" /> or <div className="flex-1 h-px bg-slate-100" />
                        </div>

                        <button
                            onClick={() => setIsMapModalOpen(true)}
                            className="w-full py-3 border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <MapPin size={15} /> Pin on Map
                        </button>

                        {lat !== 6.9271 && (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Location confirmed</p>
                                    <p className="text-xs font-mono text-emerald-700">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                </div>
                                <CheckCircle2 size={18} className="text-emerald-500" />
                            </div>
                        )}
                    </div>

                    {/* Map Modal */}
                    {isMapModalOpen && (
                        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
                            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Pin Location</h3>
                                    <p className="text-xs text-slate-400">Tap the map to drop a pin</p>
                                </div>
                                <button onClick={() => setIsMapModalOpen(false)} className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-600 border border-slate-100">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 relative z-0">
                                <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                    <MapController center={[lat, lon]} />
                                    <MapEvents onLocationSelect={(la, lo) => { setLat(la); setLon(lo); }} />
                                    <Marker position={[lat, lon]} icon={L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [38, 60], iconAnchor: [19, 60] })} />
                                </MapContainer>
                                <div className="absolute bottom-0 left-0 right-0 z-[1000] p-5 bg-gradient-to-t from-white via-white/80 to-transparent">
                                    <button
                                        onClick={() => setIsMapModalOpen(false)}
                                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-xl active:scale-[0.98] transition-all"
                                    >
                                        Confirm Location
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 border border-rose-100 rounded-lg p-3"><AlertCircle size={14} /> {error}</div>}

                    <div className="flex gap-3">
                        <button onClick={() => { setStep('PHOTO'); setPreviewUrl(''); }} className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={() => {
                                if (lat === 6.9271) { setError('Please pin your location before continuing.'); return; }
                                setError(''); setStep('DETAILS');
                            }}
                            className="flex-1 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            Continue <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Details ── */}
            {step === 'DETAILS' && (
                <div className="space-y-6">
                    <div className="text-center space-y-1 mb-2">
                        <h2 className="text-xl font-bold text-slate-900">Add details</h2>
                        <p className="text-sm text-slate-400">Help our team find and fix the problem faster.</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                        {/* Preview */}
                        <div className="flex gap-4 items-center pb-5 border-b border-slate-50">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-100 shrink-0 relative">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setStep('PHOTO'); setPreviewUrl(''); }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Photo uploaded ✓</p>
                                <p className="text-xs font-mono text-slate-600">{lat.toFixed(4)}, {lon.toFixed(4)}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nearest landmark or road name</label>
                            <input
                                type="text"
                                placeholder="e.g. Near Colombo 7 junction..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all text-sm text-slate-900"
                                value={roadName}
                                onChange={e => setRoadName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description (optional)</label>
                            <textarea
                                placeholder="Describe the pothole — size, depth, how long it's been there..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all text-sm text-slate-900 h-28 resize-none leading-relaxed"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 border border-rose-100 rounded-lg p-3"><AlertCircle size={14} /> {error}</div>}

                    <div className="flex gap-3">
                        <button onClick={() => setStep('LOCATION')} className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={() => {
                                if (!description.trim() && !roadName.trim()) { setError('Please add at least a landmark or short description.'); return; }
                                setError(''); setStep('REVIEW');
                            }}
                            className="flex-1 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            Review Report <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 4: Review ── */}
            {step === 'REVIEW' && (
                <div className="space-y-6">
                    <div className="text-center space-y-1 mb-2">
                        <h2 className="text-xl font-bold text-slate-900">Review & Submit</h2>
                        <p className="text-sm text-slate-400">Check your report before sending it to our team.</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        {/* Image */}
                        <div className="h-48 overflow-hidden">
                            <img src={previewUrl} alt="Pothole preview" className="w-full h-full object-cover" />
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                                    <p className="text-sm font-medium text-slate-700 font-mono">{lat.toFixed(4)}, {lon.toFixed(4)}</p>
                                </div>
                                {roadName && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Landmark</p>
                                        <p className="text-sm font-medium text-slate-700">{roadName}</p>
                                    </div>
                                )}
                            </div>
                            {description && (
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Description</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
                                </div>
                            )}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 size={17} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <strong className="font-semibold">What happens next?</strong> Our team will review your report and schedule a repair. We'll keep you updated on the progress.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 border border-rose-100 rounded-lg p-3"><AlertCircle size={14} /> {error}</div>}

                    <div className="flex gap-3">
                        <button onClick={() => setStep('DETAILS')} className="p-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Navigation size={17} className="fill-white" /> Submit Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportWizard;
