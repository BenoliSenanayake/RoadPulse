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
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EAF2FF] border border-[#DCE3EE] shadow-xl">
                <Loader2 size={32} className="animate-spin text-[#4F6FAF]" />
            </div>
            <h2 className="mb-3 text-3xl font-extrabold text-[#0F172A]">Processing Submission</h2>
            <p className="mx-auto max-w-sm text-base leading-relaxed text-[#64748B]">
                RoadPulse is validating your geospatial data and routing your report to the regional infrastructure division.
            </p>
        </div>
    );

    if (step === 'SUCCESS') return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center theme-citizen">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-xl">
                <CheckCircle2 size={40} />
            </div>
            <h2 className="mb-3 text-3xl font-extrabold text-[#0F172A]">Report Successfully Logged</h2>
            <p className="mb-10 max-w-md text-base leading-relaxed text-[#64748B]">
                Your report has been received by our administrative systems. You can now track its progress in real-time.
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-[#DCE3EE] bg-white px-6 py-3 text-sm font-bold text-[#4F6FAF] shadow-sm">
                <Loader2 size={16} className="animate-spin" />
                Initializing Status Monitor
            </div>
        </div>
    );

    if (step === 'AUTH') return (
        <div className="mx-auto max-w-md px-6 py-24 text-center theme-citizen">
            <div className="space-y-10 rounded-3xl card-premium p-12 bg-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF2FF] border border-[#DCE3EE] text-[#4F6FAF] shadow-sm">
                    <LogIn size={28} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-[#0F172A]">Verification Required</h2>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                        To maintain infrastructure data integrity and provide status updates, please sign in to complete your submission.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <Link
                        to="/login"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="btn-premium btn-primary w-full py-4 text-base font-bold shadow-lg"
                    >
                        <LogIn size={20} /> Sign In to Proceed
                    </Link>
                    <Link
                        to="/signup"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="btn-premium btn-secondary w-full py-4 text-base font-bold"
                    >
                        Register New Account
                    </Link>
                    <button
                        onClick={() => setStep('REVIEW')}
                        className="pt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] transition-colors hover:text-[#4F6FAF]"
                    >
                        Return to review
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-2xl px-6 py-16 pb-32 theme-citizen">
            {/* Guidance Modal */}
            {showGuidance && step === 'PHOTO' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-md p-4 animate-fade-in">
                    <div className="relative flex w-full max-w-2xl flex-col rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-fade-in-up border border-[#DCE3EE]">
                        <button onClick={() => setShowGuidance(false)} className="absolute right-6 top-6 z-10 rounded-xl p-2.5 text-[#94A3B8] transition-colors hover:bg-[#F7F9FC] hover:text-[#0F172A]">
                            <X size={24} />
                        </button>
                        <div className="space-y-10 p-10 sm:p-12">
                            <div className="space-y-4 text-center sm:text-left">
                                <div className="inline-flex items-center gap-2.5 rounded-lg border border-[#DCE3EE] bg-[#EAF2FF] px-4 py-1.5 shadow-sm">
                                    <Info size={16} className="text-[#4F6FAF]" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4F6FAF]">Administrative Protocol</span>
                                </div>
                                <h2 className="text-3xl font-extrabold text-[#0F172A] leading-tight">Evidence capture guidelines</h2>
                                <p className="text-base leading-relaxed text-[#64748B]">
                                    Our maintenance crews require specific visual context to estimate repair resources and safety requirements.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="relative h-48 overflow-hidden rounded-2xl border-2 border-emerald-100 shadow-sm">
                                        <img src={correctExample} alt="Correct" className="w-full h-full object-cover" />
                                        <div className="absolute left-3 top-3 rounded-xl bg-emerald-500 p-1.5 text-white shadow-lg">
                                            <CheckCircle size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">Approved Documentation</p>
                                        <ul className="space-y-2 text-[13px] text-[#64748B]">
                                            <li className="flex items-center gap-2.5"><CheckCircle size={12} className="text-emerald-500" /> Road markings visible</li>
                                            <li className="flex items-center gap-2.5"><CheckCircle size={12} className="text-emerald-500" /> Clear depth reference</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative h-48 overflow-hidden rounded-2xl border-2 border-rose-100 shadow-sm">
                                        <img src={incorrectExample} alt="Incorrect" className="w-full h-full object-cover" />
                                        <div className="absolute left-3 top-3 rounded-xl bg-rose-500 p-1.5 text-white shadow-lg">
                                            <X size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">Rejected Submissions</p>
                                        <ul className="space-y-2 text-[13px] text-[#64748B]">
                                            <li className="flex items-center gap-2.5"><X size={12} className="text-rose-500" /> Insufficient context</li>
                                            <li className="flex items-center gap-2.5"><X size={12} className="text-rose-500" /> Obscured vision</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowGuidance(false)} className="btn-premium btn-primary w-full py-5 text-base font-bold shadow-xl">
                                I Understand & Agree
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-16 space-y-4 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A]">
                    {step === 'PHOTO' ? 'Document Infrastructure' : 'Reporting Status'}
                </h1>
                <p className="mx-auto max-w-sm text-base leading-relaxed text-[#64748B]">
                    {step === 'PHOTO' && 'Provide high-resolution evidence for division review.'}
                    {step === 'LOCATION' && 'Specify the exact geographic coordinates.'}
                    {step === 'DETAILS' && 'Add situational context for maintenance crews.'}
                    {step === 'REVIEW' && 'Verify all administrative data before final log.'}
                </p>
            </div>

            {/* Progress Indicator */}
            {step !== 'PHOTO' && (
                <div className="mb-12 flex items-center justify-between card-premium p-6 shadow-md border-[#DCE3EE] bg-white">
                    {STEPS_INFO.map((s, i) => {
                        const isCurrent = step === s.id;
                        const isPast = stepIndex > i;
                        return (
                            <div key={s.id} className="flex-1 flex flex-col items-center gap-3 relative">
                                <div className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 border-2",
                                    isCurrent ? "bg-[#4F6FAF] border-[#4F6FAF] text-white shadow-lg ring-[6px] ring-[#EAF2FF]" :
                                        isPast ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" : "bg-white border-[#F1F5F9] text-[#CBD5E1]"
                                )}>
                                    {isPast ? <CheckCircle2 size={24} /> : <s.icon size={22} />}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-[0.15em]",
                                    isCurrent ? "text-[#4F6FAF]" : isPast ? "text-emerald-600" : "text-[#CBD5E1]"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Step Content */}
            <div className="animate-fade-in-up">
                {step === 'PHOTO' && (
                    <div className="space-y-8">
                        {!previewUrl ? (
                            <div className="space-y-10 rounded-3xl border-2 border-dashed border-[#DCE3EE] bg-white p-12 text-center shadow-sm transition-all hover:border-[#4F6FAF] hover:bg-[#F7F9FC] sm:p-20 group">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F7F9FC] text-[#94A3B8] shadow-inner group-hover:bg-[#EAF2FF] group-hover:text-[#4F6FAF] transition-all border border-[#DCE3EE]">
                                    <Camera size={36} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-[#0F172A]">Select evidence photo</h3>
                                    <p className="mx-auto max-w-sm text-base leading-relaxed text-[#64748B]">
                                        Official reports require clear visual documentation for resource prioritization.
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <label className="cursor-pointer block">
                                        <div className="btn-premium btn-primary w-full py-5 text-base font-bold shadow-xl hover:shadow-2xl">
                                            <Camera size={22} />
                                            Capture Incident Photo
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button onClick={() => setShowGuidance(true)} className="mx-auto flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-widest text-[#4F6FAF] hover:text-[#0F172A] transition-colors">
                                        <Info size={16} /> View Capture Guidelines
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 card-premium p-8 shadow-xl border-[#DCE3EE] bg-white relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#DCE3EE] bg-[#F7F9FC] shadow-inner group">
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                    {qualityHints.length > 0 && (
                                        <div className="absolute left-6 right-6 top-6 flex items-start gap-4 rounded-2xl border border-amber-200 bg-white/95 backdrop-blur-md p-5 shadow-2xl animate-fade-in-up">
                                            <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B]">System Audit</p>
                                                {qualityHints.map((hint, i) => (
                                                    <p key={i} className="text-sm text-amber-800 font-bold leading-tight">{hint}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#DCE3EE] bg-[#EAF2FF] text-[#4F6FAF] shadow-sm">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Audit ID</p>
                                            <p className="max-w-[200px] truncate text-base font-bold text-[#0F172A]">
                                                {imageFile?.name || 'INCIDENT_DOC_01.JPG'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setImageFile(null); setPreviewUrl(''); setQualityHints([]); }} className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-500 transition-all hover:bg-rose-100 shadow-sm group">
                                        <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <label className="cursor-pointer block">
                                        <div className="btn-premium btn-secondary w-full py-4 text-sm font-bold shadow-sm">
                                            <RefreshCw size={18} /> Retake Photo
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button onClick={() => setStep('LOCATION')} className="btn-premium btn-primary w-full py-4 text-sm font-bold shadow-xl">
                                        Proceed to Location <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'LOCATION' && (
                    <div className="space-y-8">
                        <div className="space-y-8 card-premium p-10 shadow-xl border-[#DCE3EE] bg-white relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                            <button onClick={handleGetLocation} className="btn-premium btn-primary w-full py-5 text-base font-bold shadow-xl flex items-center justify-center gap-3">
                                <Locate size={24} /> 
                                Detect Precise Coordinates
                            </button>
                            <div className="flex items-center gap-4 px-4">
                                <div className="h-px flex-1 bg-[#F1F5F9]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#CBD5E1]">Administrative Option</span>
                                <div className="h-px flex-1 bg-[#F1F5F9]" />
                            </div>
                            <button onClick={() => setIsMapModalOpen(true)} className="btn-premium btn-secondary w-full py-5 text-base font-bold">
                                <MapPin size={22} /> Select on Governance Map
                            </button>
                            {lat !== 6.9271 && (
                                <div className="flex items-center justify-between rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm border border-emerald-100">
                                            <Navigation size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-1">Position Verified</p>
                                            <p className="text-base font-bold text-[#0F172A] font-mono tracking-tight">{lat.toFixed(6)}, {lon.toFixed(6)}</p>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                                        <CheckCircle2 size={18} />
                                    </div>
                                </div>
                            )}
                        </div>
                        {isMapModalOpen && (
                            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in-up">
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DCE3EE] bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-5">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF2FF] border border-[#DCE3EE] text-[#4F6FAF] shadow-sm">
                                            <MapPin size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-[#0F172A]">Geospatial Pinning</h3>
                                            <p className="text-sm text-[#64748B]">Locate the infrastructure hazard on the map</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMapModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-xl border border-[#DCE3EE] bg-[#F7F9FC] text-[#64748B] hover:text-[#0F172A] transition-all shadow-sm">
                                        <X size={28} />
                                    </button>
                                </div>
                                <div className="flex-1 relative z-0">
                                    <MapContainer center={[lat, lon]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                        <MapController center={[lat, lon]} />
                                        <MapEvents onLocationSelect={(la, lo) => { setLat(la); setLon(lo); }} />
                                        <Marker position={[lat, lon]} icon={L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [32, 50], iconAnchor: [16, 50] })} />
                                    </MapContainer>
                                    <div className="absolute bottom-0 left-0 right-0 z-[1000] border-t border-[#DCE3EE] bg-white/90 backdrop-blur-md p-8">
                                        <button onClick={() => setIsMapModalOpen(false)} className="btn-premium btn-primary w-full py-5 text-lg font-bold shadow-2xl">
                                            Lock Regional Coordinates
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => setStep('PHOTO')} className="btn-premium btn-secondary px-6 shadow-sm">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={() => { if (lat === 6.9271) { setError('Geospatial data required.'); return; } setError(''); setStep('DETAILS'); }}
                                className="btn-premium btn-primary flex-1 py-5 text-base font-bold shadow-xl"
                            >
                                Continue to Details <ArrowRight size={22} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'DETAILS' && (
                    <div className="space-y-8">
                        <div className="space-y-10 card-premium p-10 shadow-xl border-[#DCE3EE] bg-white relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                            <div className="flex items-center gap-6 border-b border-[#F7F9FC] pb-10">
                                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-[#DCE3EE] shadow-lg shrink-0 relative group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Media Verified</span>
                                    </div>
                                    <p className="text-base font-bold text-[#0F172A] leading-none">Administrative Record</p>
                                    <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">{lat.toFixed(5)} N, {lon.toFixed(5)} E</p>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <label className="mb-3 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Regional Landmark</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Near Colombo Municipal Council..."
                                        className="w-full rounded-2xl border border-[#DCE3EE] bg-[#F7F9FC] px-6 py-4 text-base font-bold text-[#0F172A] outline-none transition-all placeholder:text-[#CBD5E1] focus:border-[#4F6FAF] focus:bg-white focus:ring-[6px] focus:ring-[#EAF2FF] shadow-sm"
                                        value={roadName}
                                        onChange={e => setRoadName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-3 ml-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Condition Description</label>
                                    <textarea
                                        placeholder="Detail the hazard — size, depth, or safety impact..."
                                        className="h-44 w-full resize-none rounded-2xl border border-[#DCE3EE] bg-[#F7F9FC] px-6 py-4 text-base font-bold leading-relaxed text-[#0F172A] outline-none transition-all placeholder:text-[#CBD5E1] focus:border-[#4F6FAF] focus:bg-white focus:ring-[6px] focus:ring-[#EAF2FF] shadow-sm"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('LOCATION')} className="btn-premium btn-secondary px-6 shadow-sm">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={() => { if (!description.trim() && !roadName.trim()) { setError('Landmark or description required for repair crews.'); return; } setError(''); setStep('REVIEW'); }}
                                className="btn-premium btn-primary flex-1 py-5 text-base font-bold shadow-xl"
                            >
                                Final Review <ArrowRight size={22} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="space-y-8">
                        <div className="overflow-hidden card-premium shadow-2xl border-[#DCE3EE] bg-white relative">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4F6FAF]" />
                            <div className="h-72 relative group">
                                <img src={previewUrl} alt="Pothole preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent" />
                                <div className="absolute bottom-8 left-8 flex items-center gap-5">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/10 text-white backdrop-blur-md shadow-2xl">
                                        <Camera size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Audit Documentation</p>
                                        <p className="text-xl font-bold text-white tracking-tight">Verified Evidence</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-10 p-10">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Geospatial Data</p>
                                        <p className="font-mono text-sm font-bold text-[#0F172A] tracking-tight">{lat.toFixed(6)}, {lon.toFixed(6)}</p>
                                    </div>
                                    {roadName && (
                                        <div className="space-y-2.5">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Landmark</p>
                                            <p className="truncate text-sm font-bold text-[#0F172A]">{roadName}</p>
                                        </div>
                                    )}
                                </div>
                                {description && (
                                    <div className="space-y-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Condition Notes</p>
                                        <p className="text-base leading-relaxed text-[#4F6FAF] font-bold bg-[#EAF2FF] px-5 py-4 rounded-xl italic border border-[#DCE3EE]">"{description}"</p>
                                    </div>
                                )}
                                <div className="rounded-2xl border border-[#DCE3EE] bg-[#F7F9FC] p-8 shadow-sm">
                                    <div className="flex items-start gap-5">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-[#4F6FAF] shadow-sm border border-[#DCE3EE]">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-base font-bold text-[#0F172A] uppercase tracking-tight">Infrastructure Commitment</h4>
                                            <p className="text-sm leading-relaxed text-[#64748B]">
                                                By submitting this report, you are logging an official maintenance request. RoadPulse will triage this entry for priority repair dispatch.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setStep('DETAILS')} className="btn-premium btn-secondary px-6 shadow-sm">
                                <ArrowLeft size={24} />
                            </button>
                            <button onClick={handleSubmit} className="btn-premium btn-primary flex-1 py-5 text-base font-bold shadow-2xl">
                                <Navigation size={22} /> 
                                Transmit Official Report
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-10 flex items-center gap-5 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm font-bold text-rose-700 shadow-xl animate-shake">
                    <AlertCircle size={24} className="shrink-0" /> {error}
                </div>
            )}
        </div>
    );
};

export default ReportWizard;
