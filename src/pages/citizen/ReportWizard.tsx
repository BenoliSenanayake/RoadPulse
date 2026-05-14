import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import {
    MapPin, CheckCircle2,
    Locate, Navigation, ArrowRight, ArrowLeft,
    AlertCircle, X, LogIn, Camera,
    ShieldCheck, Activity, Loader2, Info, CheckCircle, AlertTriangle,
    Trash2, RefreshCw, Image as ImageIcon
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { reportsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

// Import guidance images v2
import correctExample from '../../assets/photo-guidance-correct-v2.png';
import incorrectExample from '../../assets/photo-guidance-incorrect-v2.png';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
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

type Step = 'PHOTO' | 'LOCATION' | 'DETAILS' | 'REVIEW' | 'AUTH' | 'SUBMITTING' | 'SUCCESS';

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
    { id: 'PHOTO', label: 'Photo', icon: Camera },
    { id: 'LOCATION', label: 'Location', icon: MapPin },
    { id: 'DETAILS', label: 'Details', icon: Activity },
    { id: 'REVIEW', label: 'Review', icon: CheckCircle2 },
];

const ReportWizard = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('PHOTO');
    const [showGuidance, setShowGuidance] = useState(true);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [lat, setLat] = useState(6.9271);
    const [lon, setLon] = useState(79.8612);
    const [roadName, setRoadName] = useState('');
    const [description, setDescription] = useState('');

    const [error, setError] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [qualityHints, setQualityHints] = useState<string[]>([]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setQualityHints([]);
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        
        if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return; }
        if (file.size > 10 * 1024 * 1024) { setError('Image is too large. Maximum size is 10MB.'); return; }

        const hints = [];
        if (file.size < 50000) hints.push("Image might be too blurry or low resolution.");
        setQualityHints(hints);

        setImageFile(file);
        const compressed = await compressImage(file);
        setPreviewUrl(compressed);
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
        if (!isAuthenticated || !user) {
            console.error('[ReportWizard] Submission blocked: User not authenticated.');
            navigate('/login', { state: { from: { pathname: '/citizen/report' } }, replace: true });
            return;
        }

        setStep('SUBMITTING');
        try {
            const formData = new FormData();
            formData.append('citizen_id', user.id);
            formData.append('latitude', lat.toString());
            formData.append('longitude', lon.toString());
            
            const fullDesc = `${roadName ? `[${roadName}] ` : ''}${description}`.trim();
            if (fullDesc) formData.append('description', fullDesc);
            if (imageFile) formData.append('image', imageFile);

            const report = await reportsApi.submit(formData);
            
            setTimeout(() => {
                navigate(`/citizen/status/${report.id}`, { replace: true });
            }, 2000);
            setStep('SUCCESS');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Please check your connection and try again.';
            setError(`Submission failed: ${message}`);
            setStep('REVIEW');
        }
    };

    const stepIndex = STEPS_INFO.findIndex(s => s.id === step);

    if (step === 'SUBMITTING') return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center theme-citizen">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <Loader2 size={22} className="animate-spin text-[var(--accent-text)]" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-slate-900">Submitting report</h2>
            <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
                RoadPulse is saving your report and routing it to the correct maintenance team.
            </p>
        </div>
    );

    if (step === 'SUCCESS') return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center theme-citizen">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={28} />
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-slate-900">Report submitted</h2>
            <p className="mb-8 max-w-md text-sm leading-6 text-slate-500">
                Your report has been recorded. Redirecting you to the status page.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Opening status page
            </div>
        </div>
    );

    if (step === 'AUTH') return (
        <div className="mx-auto max-w-md px-6 py-20 text-center theme-citizen">
            <div className="space-y-8 rounded-xl card-premium p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)]">
                    <LogIn size={22} className="text-[var(--accent-text)]" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-900">Sign in required</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        To maintain report integrity and provide live updates, please sign in before submitting.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/login"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="btn-premium btn-primary w-full py-3.5"
                    >
                        <LogIn size={18} /> Sign In to Continue
                    </Link>
                    <Link
                        to="/signup"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="btn-premium btn-secondary w-full py-3.5"
                    >
                        Create Free Account
                    </Link>
                    <button
                        onClick={() => setStep('REVIEW')}
                        className="pt-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900"
                    >
                        Return to review
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-2xl px-4 py-12 pb-28 sm:px-6 lg:py-16 theme-citizen">
            {/* Guidance Modal */}
            {showGuidance && step === 'PHOTO' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
                    <div className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl animate-fade-in-up">
                        <button onClick={() => setShowGuidance(false)} className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900">
                            <X size={20} />
                        </button>
                        <div className="space-y-6 p-8 sm:p-10">
                            <div className="space-y-2 text-center sm:text-left">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-1">
                                    <Info size={14} className="text-[var(--accent-text)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-text)]">Reporting Protocol</span>
                                </div>
                                <h2 className="text-2xl font-semibold leading-tight text-slate-900">Ensure clear damage visibility</h2>
                                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500 sm:mx-0">
                                    Capture the pothole between road edge markings. This scale reference helps our teams estimate repair resources accurately.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="relative h-40 overflow-hidden rounded-xl border border-emerald-100 shadow-sm sm:h-44">
                                        <img src={correctExample} alt="Correct" className="w-full h-full object-cover" />
                                        <div className="absolute left-2 top-2 rounded-lg bg-emerald-500 p-1 text-white shadow-lg">
                                            <CheckCircle size={14} />
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-[11px] font-medium text-slate-500">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Centered and clear focus</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Road boundaries visible</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <div className="relative h-40 overflow-hidden rounded-xl border border-rose-100 shadow-sm sm:h-44">
                                        <img src={incorrectExample} alt="Incorrect" className="w-full h-full object-cover" />
                                        <div className="absolute left-2 top-2 rounded-lg bg-rose-500 p-1 text-white shadow-lg">
                                            <X size={14} />
                                        </div>
                                    </div>
                                    <ul className="space-y-2 text-[11px] font-medium text-slate-500">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400" />Missing road context</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-400" />Obscured or too close</li>
                                    </ul>
                                </div>
                            </div>
                            <button onClick={() => setShowGuidance(false)} className="btn-premium btn-primary w-full py-4 text-sm font-bold shadow-lg">
                                Understand and Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-12 space-y-3 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    {step === 'PHOTO' ? 'Report Road Damage' : 'Submission Progress'}
                </h1>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
                    {step === 'PHOTO' && 'Capture evidence for maintenance review.'}
                    {step === 'LOCATION' && 'Identify the precise coordinates.'}
                    {step === 'DETAILS' && 'Add context for repair crews.'}
                    {step === 'REVIEW' && 'Confirm your submission data.'}
                </p>
            </div>

            {/* Progress Indicator */}
            {step !== 'PHOTO' && (
                <div className="mb-10 flex items-center justify-between card-premium p-4 shadow-sm border-slate-100">
                    {STEPS_INFO.map((s, i) => (
                        <div key={s.id} className="flex-1 flex flex-col items-center gap-2 relative">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300",
                                step === s.id ? "bg-[var(--accent-solid)] text-white shadow-md ring-4 ring-[var(--accent-bg)]" :
                                    stepIndex > i ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-50 text-slate-400 border border-slate-100"
                            )}>
                                {stepIndex > i ? <CheckCircle2 size={20} /> : <s.icon size={18} />}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                step === s.id ? "text-slate-900" : "text-slate-400"
                            )}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Step Content */}
            <div className="animate-fade-in-up">
                {step === 'PHOTO' && (
                    <div className="space-y-6">
                        {!previewUrl ? (
                            <div className="space-y-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm transition-all hover:border-[var(--accent-border)] hover:bg-[var(--bg-soft)] sm:p-14">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 shadow-inner">
                                    <Camera size={26} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-semibold text-slate-900">Upload evidence photo</h3>
                                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
                                        High-quality images help our officers prioritize repairs efficiently.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <label className="cursor-pointer block">
                                        <div className="btn-premium btn-primary w-full py-4 shadow-md">
                                            <Camera size={18} />
                                            Capture or Select Photo
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button onClick={() => setShowGuidance(true)} className="mx-auto flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-text)] transition-colors hover:text-slate-900">
                                        <Info size={14} /> Review capture guidelines
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 card-premium p-6 shadow-md border-slate-200/60">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-inner group">
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    {qualityHints.length > 0 && (
                                        <div className="absolute left-4 right-4 top-4 flex items-start gap-3 rounded-xl border border-amber-100 bg-white/95 backdrop-blur-sm p-4 shadow-lg animate-fade-in-up">
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quality Notice</p>
                                                {qualityHints.map((hint, i) => (
                                                    <p key={i} className="text-xs text-amber-700 font-semibold leading-tight">{hint}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-sm">
                                            <ImageIcon size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected Evidence</p>
                                            <p className="max-w-[200px] truncate text-sm font-semibold text-slate-900">
                                                {imageFile?.name || 'pothole-report-image.jpg'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setImageFile(null); setPreviewUrl(''); setQualityHints([]); }} className="rounded-lg border border-red-50 bg-red-50 p-3 text-red-500 transition-all hover:bg-red-100 hover:text-red-600 shadow-sm">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <label className="cursor-pointer block">
                                        <div className="btn-premium btn-secondary w-full py-3.5">
                                            <RefreshCw size={16} /> Retake
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button onClick={() => setStep('LOCATION')} className="btn-premium btn-primary w-full py-3.5 shadow-md">
                                        Continue <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'LOCATION' && (
                    <div className="space-y-6">
                        <div className="space-y-6 card-premium p-8 shadow-md border-slate-200/60 bg-white">
                            <button onClick={handleGetLocation} className="btn-premium btn-primary w-full py-4 shadow-md">
                                <Locate size={20} /> 
                                Detect GPS Location
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-slate-100" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">or manual placement</span>
                                <div className="h-[1px] flex-1 bg-slate-100" />
                            </div>
                            <button onClick={() => setIsMapModalOpen(true)} className="btn-premium btn-secondary w-full py-4">
                                <MapPin size={18} /> Select Location on Map
                            </button>
                            {lat !== 6.9271 && (
                                <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm border border-emerald-100">
                                            <Navigation size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-0.5">Coordinates Locked</p>
                                            <p className="text-sm font-semibold text-slate-900 font-mono tracking-tight">{lat.toFixed(6)}, {lon.toFixed(6)}</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 size={22} className="text-emerald-500" />
                                </div>
                            )}
                        </div>
                        {isMapModalOpen && (
                            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in-up">
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)] shadow-sm">
                                            <MapPin size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900">Map Localization</h3>
                                            <p className="text-xs font-medium text-slate-500">Tap to confirm the exact incident point</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMapModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 shadow-sm">
                                        <X size={22} />
                                    </button>
                                </div>
                                <div className="flex-1 relative z-0">
                                    <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                        <MapController center={[lat, lon]} />
                                        <MapEvents onLocationSelect={(la, lo) => { setLat(la); setLon(lo); }} />
                                        <Marker position={[lat, lon]} icon={L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [30, 48], iconAnchor: [15, 48] })} />
                                    </MapContainer>
                                    <div className="absolute bottom-0 left-0 right-0 z-[1000] border-t border-slate-100 bg-white/95 backdrop-blur-md p-6">
                                        <button onClick={() => setIsMapModalOpen(false)} className="btn-premium btn-primary w-full py-4 shadow-xl">
                                            Lock This Position
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setStep('PHOTO')} className="btn-premium btn-secondary px-4 shadow-sm">
                                <ArrowLeft size={22} />
                            </button>
                            <button
                                onClick={() => { if (lat === 6.9271) { setError('Please specify location.'); return; } setError(''); setStep('DETAILS'); }}
                                className="btn-premium btn-primary flex-1 py-4 shadow-md"
                            >
                                Continue <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'DETAILS' && (
                    <div className="space-y-6">
                        <div className="space-y-8 card-premium p-8 shadow-md border-slate-200/60 bg-white">
                            <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-inner shrink-0 relative group shadow-md">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Media Secured</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900 leading-none">Geo-data Authenticated</p>
                                    <p className="text-xs font-mono text-slate-400 tracking-tight">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Street / Landmark</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Near Galle Face Green..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)] shadow-sm"
                                        value={roadName}
                                        onChange={e => setRoadName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Report Context</label>
                                    <textarea
                                        placeholder="Describe the damage — depth, size, or hazard level..."
                                        className="h-40 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-semibold leading-relaxed text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[var(--accent-border)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-bg)] shadow-sm"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('LOCATION')} className="btn-premium btn-secondary px-4 shadow-sm">
                                <ArrowLeft size={22} />
                            </button>
                            <button
                                onClick={() => { if (!description.trim() && !roadName.trim()) { setError('Please provide a landmark or description.'); return; } setError(''); setStep('REVIEW'); }}
                                className="btn-premium btn-primary flex-1 py-4 shadow-md"
                            >
                                Review Summary <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="space-y-6">
                        <div className="overflow-hidden card-premium shadow-lg border-slate-200/60 bg-white">
                            <div className="h-64 relative group">
                                <img src={previewUrl} alt="Pothole preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white backdrop-blur-md shadow-lg">
                                        <Camera size={22} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Evidence Preview</p>
                                        <p className="text-base font-semibold text-white">Visual Documentation</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8 p-8">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coordinates</p>
                                        <p className="font-mono text-sm font-bold text-slate-800 tracking-tight">{lat.toFixed(6)}, {lon.toFixed(6)}</p>
                                    </div>
                                    {roadName && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Landmark</p>
                                            <p className="truncate text-sm font-bold text-slate-800">{roadName}</p>
                                        </div>
                                    )}
                                </div>
                                {description && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Context</p>
                                        <p className="text-sm leading-relaxed text-slate-700 font-medium italic">"{description}"</p>
                                    </div>
                                )}
                                <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-6 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--accent-text)] shadow-sm border border-[var(--accent-border)]">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Governance Review</h4>
                                            <p className="text-[13px] leading-relaxed text-slate-600 font-medium">
                                                This report will be submitted to the official maintenance queue. Our officers will verify the data for priority repair action.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('DETAILS')} className="btn-premium btn-secondary px-4 shadow-sm">
                                <ArrowLeft size={22} />
                            </button>
                            <button onClick={handleSubmit} className="btn-premium btn-primary flex-1 py-4 shadow-xl">
                                <Navigation size={20} /> 
                                Transmit Final Report
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-8 flex items-center gap-4 rounded-xl border border-rose-100 bg-rose-50 p-5 text-sm font-bold text-rose-700 shadow-sm animate-shake">
                    <AlertCircle size={20} className="shrink-0" /> {error}
                </div>
            )}
        </div>
    );
};

export default ReportWizard;
