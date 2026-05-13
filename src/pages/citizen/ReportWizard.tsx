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
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <Loader2 size={22} className="animate-spin text-slate-700" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-slate-950">Submitting report</h2>
            <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600">
                RoadPulse is saving your report and routing it to the correct maintenance team.
            </p>
        </div>
    );

    if (step === 'SUCCESS') return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={28} />
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-slate-950">Report submitted</h2>
            <p className="mb-8 max-w-md text-sm leading-6 text-slate-600">
                Your report has been recorded. Redirecting you to the status page.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <Loader2 size={14} className="animate-spin" />
                Opening status page
            </div>
        </div>
    );

    if (step === 'AUTH') return (
        <div className="mx-auto max-w-md px-6 py-16 text-center">
            <div className="space-y-7 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <LogIn size={22} className="text-slate-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-950">Sign in required</h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        To maintain report integrity and provide live updates, please sign in before submitting.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/login"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                        <LogIn size={18} /> Sign In to Continue
                    </Link>
                    <Link
                        to="/signup"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Create Free Account
                    </Link>
                    <button
                        onClick={() => setStep('REVIEW')}
                        className="pt-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                    >
                        Return to review
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 pb-28 sm:px-6 lg:py-10">
            {/* Guidance Modal */}
            {showGuidance && step === 'PHOTO' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-3 sm:p-4">
                    <div className="relative flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-lg">
                        <button onClick={() => setShowGuidance(false)} className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900">
                            <X size={18} />
                        </button>
                        <div className="space-y-4 p-5 sm:p-6">
                            <div className="space-y-1 text-center sm:text-left">
                                <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1">
                                    <Info size={12} className="text-blue-700" />
                                    <span className="text-xs font-medium text-blue-700">Reporting tips</span>
                                </div>
                                <h2 className="text-xl font-semibold leading-tight text-slate-950">Take a clear road-aligned photo</h2>
                                <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600 sm:mx-0">
                                    Align between visible road edge markings to help our officers estimate pothole size accurately.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="relative h-32 overflow-hidden rounded-lg border border-emerald-200 shadow-sm sm:h-36">
                                        <img src={correctExample} alt="Correct" className="w-full h-full object-cover" />
                                        <div className="absolute left-1.5 top-1.5 rounded bg-emerald-600 p-0.5 text-white">
                                            <CheckCircle size={12} />
                                        </div>
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" />Centered within boundaries</li>
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" />Edge markings visible</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative h-32 overflow-hidden rounded-lg border border-rose-200 shadow-sm sm:h-36">
                                        <img src={incorrectExample} alt="Incorrect" className="w-full h-full object-cover" />
                                        <div className="absolute left-1.5 top-1.5 rounded bg-rose-600 p-0.5 text-white">
                                            <X size={12} />
                                        </div>
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-500" />Missing road boundaries</li>
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-500" />Too close to pothole</li>
                                    </ul>
                                </div>
                            </div>
                            <button onClick={() => setShowGuidance(false)} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                Start report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    {step === 'PHOTO' ? 'Report Road Damage' : 'Report in Progress'}
                </h1>
                <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600">
                    {step === 'PHOTO' && 'Start by capturing a clear image of the issue.'}
                    {step === 'LOCATION' && 'Precisely pin the location on the map.'}
                    {step === 'DETAILS' && 'Provide context for our maintenance teams.'}
                    {step === 'REVIEW' && 'Verify all details before final submission.'}
                </p>
            </div>

            {/* Progress Indicator */}
            {step !== 'PHOTO' && (
                <div className="mb-8 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    {STEPS_INFO.map((s, i) => (
                        <div key={s.id} className="flex-1 flex flex-col items-center gap-2 relative">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                                step === s.id ? "bg-slate-900 text-white" :
                                    stepIndex > i ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-400 ring-1 ring-slate-200"
                            )}>
                                {stepIndex > i ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
                            </div>
                            <span className={cn(
                                "text-xs font-medium",
                                step === s.id ? "text-slate-950" : "text-slate-500"
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
                            <div className="space-y-6 rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition-colors hover:border-slate-400 sm:p-10">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                    <Camera size={22} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-slate-950">Upload a road photo</h3>
                                    <p className="mx-auto max-w-sm text-sm leading-6 text-slate-600">
                                        Take or upload a clear photo of the pothole. JPG, PNG, or WEBP up to 10MB.
                                    </p>
                                </div>
                                <div>
                                    <label className="cursor-pointer block">
                                        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                            <Camera size={17} />
                                            Choose photo
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button onClick={() => setShowGuidance(true)} className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800">
                                        <Info size={14} /> View photo guidelines
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    {qualityHints.length > 0 && (
                                        <div className="absolute left-4 right-4 top-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
                                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium text-slate-500">Photo guidance</p>
                                                {qualityHints.map((hint, i) => (
                                                    <p key={i} className="text-[11px] text-amber-700 font-bold leading-tight">{hint}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                            <ImageIcon size={19} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="mb-1 text-xs font-medium leading-none text-slate-500">Photo selected</p>
                                            <p className="max-w-[180px] truncate text-sm font-semibold text-slate-950">
                                                {imageFile?.name || 'pothole-unit-01.jpg'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setImageFile(null); setPreviewUrl(''); setQualityHints([]); }} className="rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-rose-600 transition-colors hover:bg-rose-100">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <label className="cursor-pointer block">
                                        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                                            <RefreshCw size={14} /> Retake
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button onClick={() => setStep('LOCATION')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                        Confirm <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'LOCATION' && (
                    <div className="space-y-6">
                        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <button onClick={handleGetLocation} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                <Locate size={18} /> 
                                Use current GPS location
                            </button>
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                                <div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" />
                            </div>
                            <button onClick={() => setIsMapModalOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                                <MapPin size={16} /> Select on map
                            </button>
                            {lat !== 6.9271 && (
                                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-200">
                                            <Navigation size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-emerald-700">Coordinates selected</p>
                                            <p className="text-sm font-semibold text-emerald-900">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                </div>
                            )}
                        </div>
                        {isMapModalOpen && (
                            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in-up">
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-950">Pin precise location</h3>
                                            <p className="text-xs text-slate-500">Tap the map to confirm the pothole spot</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMapModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 relative z-0">
                                    <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                        <MapController center={[lat, lon]} />
                                        <MapEvents onLocationSelect={(la, lo) => { setLat(la); setLon(lo); }} />
                                        <Marker position={[lat, lon]} icon={L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [38, 60], iconAnchor: [19, 60] })} />
                                    </MapContainer>
                                    <div className="absolute bottom-0 left-0 right-0 z-[1000] border-t border-slate-200 bg-white p-4">
                                        <button onClick={() => setIsMapModalOpen(false)} className="w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                            Confirm location
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setStep('PHOTO')} className="rounded-lg border border-slate-300 bg-white p-3 text-slate-600 transition-colors hover:bg-slate-50">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={() => { if (lat === 6.9271) { setError('Please specify location.'); return; } setError(''); setStep('DETAILS'); }}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'DETAILS' && (
                    <div className="space-y-6">
                        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-inner shrink-0 relative group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-700">Photo ready</span>
                                    </div>
                                    <p className="mb-0.5 text-sm font-semibold text-slate-950">Location confirmed</p>
                                    <p className="text-xs font-mono text-slate-500">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 ml-1 block text-sm font-medium text-slate-700">Street or landmark name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Near Colombo 7 junction..."
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        value={roadName}
                                        onChange={e => setRoadName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 ml-1 block text-sm font-medium text-slate-700">Description</label>
                                    <textarea
                                        placeholder="Help teams understand the urgency — depth, traffic impact, etc."
                                        className="h-32 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-950 outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('LOCATION')} className="rounded-lg border border-slate-300 bg-white p-3 text-slate-600 transition-colors hover:bg-slate-50">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={() => { if (!description.trim() && !roadName.trim()) { setError('Please provide a landmark or description.'); return; } setError(''); setStep('REVIEW'); }}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                Review report <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="space-y-6">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="h-56 relative group">
                                <img src={previewUrl} alt="Pothole preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                                <div className="absolute bottom-5 left-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/20 text-white">
                                        <Camera size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-white/80">Selected photo</p>
                                        <p className="text-sm font-semibold text-white">Citizen report evidence</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6 p-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-slate-500">GPS coordinates</p>
                                        <p className="font-mono text-sm font-medium text-slate-800">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                    </div>
                                    {roadName && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-slate-500">Landmark</p>
                                            <p className="truncate text-sm font-medium text-slate-800">{roadName}</p>
                                        </div>
                                    )}
                                </div>
                                {description && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-slate-500">Description</p>
                                        <p className="text-sm leading-relaxed text-slate-700">"{description}"</p>
                                    </div>
                                )}
                                <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 text-blue-950">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-100">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-semibold">Review and verification</h4>
                                            <p className="text-sm leading-6 text-blue-900/75">
                                                Your report will be reviewed by official provincial maintenance teams for rapid action. 
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('DETAILS')} className="rounded-lg border border-slate-300 bg-white p-3 text-slate-600 transition-colors hover:bg-slate-50">
                                <ArrowLeft size={24} />
                            </button>
                            <button onClick={handleSubmit} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                <Navigation size={18} /> 
                                Submit report
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                    <AlertCircle size={18} /> {error}
                </div>
            )}
        </div>
    );
};

export default ReportWizard;
