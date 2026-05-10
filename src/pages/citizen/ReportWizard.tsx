import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import {
    MapPin, CheckCircle2,
    Locate, Navigation, ArrowRight, ArrowLeft,
    AlertCircle, X, LogIn, Camera,
    ShieldCheck, Activity, Loader2, Info, CheckCircle, AlertTriangle,
    Trash2, RefreshCw, FileText, Image as ImageIcon
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
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('PHOTO');
    const [showGuidance, setShowGuidance] = useState(true);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [lat, setLat] = useState(6.9271);
    const [lon, setLon] = useState(79.8612);
    const [roadName, setRoadName] = useState('');
    const [description, setDescription] = useState('');
    const [, setSubmittedReportId] = useState('');

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
        // Removed auto-advance to allow user to see preview and quality hints
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
            formData.append('citizen_id', user.id);
            formData.append('latitude', lat.toString());
            formData.append('longitude', lon.toString());
            
            const fullDesc = `${roadName ? `[${roadName}] ` : ''}${description}`.trim();
            if (fullDesc) formData.append('description', fullDesc);
            if (imageFile) formData.append('image', imageFile);

            const report = await reportsApi.submit(formData);
            setSubmittedReportId(report.id);
            
            if (report.id) {
                setTimeout(() => {
                    navigate(`/citizen/status/${report.id}`, { replace: true });
                }, 2000);
                setStep('SUCCESS');
            } else {
                setStep('SUCCESS');
            }
        } catch (err: any) {
            setError(`Submission failed: ${err.message || 'Please check your connection and try again.'}`);
            setStep('REVIEW');
        }
    };

    const stepIndex = STEPS_INFO.findIndex(s => s.id === step);

    if (step === 'SUBMITTING') return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in-up">
            <div className="relative mb-10">
                <div className="w-24 h-24 border-8 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={32} className="text-blue-500 animate-pulse" />
                </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">AI Analysis in Progress</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium leading-relaxed">
                Our system is verifying the road damage and routing your report to the correct provincial team.
            </p>
        </div>
    );

    if (step === 'SUCCESS') return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in-up">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20 animate-bounce-slow">
                <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Report Verified!</h2>
            <p className="text-slate-500 mb-10 max-w-md font-medium leading-relaxed">
                Great job! Your report has been successfully analyzed and submitted. We're redirecting you to your report tracking dashboard.
            </p>
            <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Loader2 size={14} className="animate-spin" /> Redirecting...
                </div>
            </div>
        </div>
    );

    if (step === 'AUTH') return (
        <div className="max-w-md mx-auto px-6 py-20 text-center animate-fade-in-up">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-900/5 p-10 space-y-8">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
                    <LogIn size={32} className="text-slate-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Identity Required</h2>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        To maintain report integrity and provide live updates, please sign in before submitting.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/login"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        <LogIn size={18} /> Sign In to Continue
                    </Link>
                    <Link
                        to="/signup"
                        state={{ from: { pathname: '/citizen/report' } }}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Create Free Account
                    </Link>
                    <button
                        onClick={() => setStep('REVIEW')}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest pt-2"
                    >
                        ← Return to Review
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto px-6 py-8 lg:py-12 pb-32 overflow-hidden">
            {/* Zero-Scroll Optimized Guidance Modal */}
            {showGuidance && step === 'PHOTO' && (
                <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
                    <div className="bg-white rounded-[1.5rem] w-full max-w-2xl flex flex-col shadow-2xl relative animate-fade-in-up">
                        <button onClick={() => setShowGuidance(false)} className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-slate-900 transition-colors z-10">
                            <X size={18} />
                        </button>
                        
                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="space-y-1 text-center sm:text-left">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full">
                                    <Info size={10} className="text-blue-600" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">Reporting Tips</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Road-Aligned Photos</h2>
                                <p className="text-[10px] text-slate-500 font-bold leading-tight max-w-sm mx-auto sm:mx-0">
                                    Align between visible road edge markings to help our officers estimate pothole size accurately.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Correct Example */}
                                <div className="space-y-2">
                                    <div className="h-32 sm:h-36 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-sm relative group">
                                        <img src={correctExample} alt="Correct" className="w-full h-full object-cover" />
                                        <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white p-0.5 rounded shadow-lg">
                                            <CheckCircle size={12} />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-[0.2em] py-0.5 text-center">Correct</div>
                                    </div>
                                    <ul className="text-[9px] text-slate-600 space-y-1 font-bold">
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" />Centered within boundaries</li>
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" />Edge markings visible</li>
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" />Full context / Level camera</li>
                                    </ul>
                                </div>

                                {/* Incorrect Example */}
                                <div className="space-y-2">
                                    <div className="h-32 sm:h-36 rounded-lg overflow-hidden border-2 border-rose-500 shadow-sm relative group">
                                        <img src={incorrectExample} alt="Incorrect" className="w-full h-full object-cover" />
                                        <div className="absolute top-1.5 left-1.5 bg-rose-500 text-white p-0.5 rounded shadow-lg">
                                            <X size={12} />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-rose-500 text-white text-[7px] font-black uppercase tracking-[0.2em] py-0.5 text-center">Incorrect</div>
                                    </div>
                                    <ul className="text-[9px] text-slate-600 space-y-1 font-bold">
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-500" />Cropped / Tilted / Blurry</li>
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-500" />Missing road boundaries</li>
                                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-rose-500" />Too close to pothole</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 border border-slate-100">
                                <Camera size={14} className="text-blue-600 shrink-0" />
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-tight">
                                    Capture the pothole between visible road edge markings whenever possible.
                                </p>
                            </div>

                            <button 
                                onClick={() => setShowGuidance(false)}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest"
                            >
                                Start Capturing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div className="text-center space-y-2 mb-10 animate-fade-in-up">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                    {step === 'PHOTO' ? 'Report Road Damage' : 'Report in Progress'}
                </h1>
                <p className="text-sm text-slate-500 font-bold max-w-xs mx-auto leading-relaxed">
                    {step === 'PHOTO' && 'Start by capturing a clear image of the issue.'}
                    {step === 'LOCATION' && 'Precisely pin the location on the map.'}
                    {step === 'DETAILS' && 'Provide context for our maintenance teams.'}
                    {step === 'REVIEW' && 'Verify all details before final submission.'}
                </p>
            </div>

            {/* ── Progress Indicator ── */}
            {step !== 'PHOTO' && (
                <div className="flex items-center justify-between mb-12 bg-white/60 backdrop-blur-md p-3 rounded-3xl border border-slate-100 shadow-sm animate-fade-in-up">
                    {STEPS_INFO.map((s, i) => (
                        <div key={s.id} className="flex-1 flex flex-col items-center gap-2 relative">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                step === s.id ? "bg-blue-600 text-white scale-110 shadow-xl shadow-blue-600/30" :
                                    stepIndex > i ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300"
                            )}>
                                {stepIndex > i ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                step === s.id ? "text-blue-600" : "text-slate-400"
                            )}>
                                {s.label}
                            </span>
                            {i < 3 && (
                                <div className="absolute top-6 -right-1/2 w-full h-[2px] bg-slate-50 -z-10" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Step Content ── */}
            <div className="animate-fade-in-up">
                {step === 'PHOTO' && (
                    <div className="space-y-6 animate-fade-in-up">
                        {!previewUrl ? (
                            /* Empty State - Clean Card Upload Area */
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-xl shadow-slate-900/5 text-center space-y-8">
                                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 border border-blue-100 shadow-inner">
                                    <Camera size={36} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Upload Road Photo</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                                        Choose a clear photo showing the pothole and road edges.
                                    </p>
                                </div>
                                
                                <div className="space-y-4">
                                    <label className="cursor-pointer block">
                                        <div className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                                            Choose Photo
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        JPG, PNG or WEBP supported
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Selected State - Preview and Controls */
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-xl shadow-slate-900/5 space-y-6">
                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    {qualityHints.length > 0 && (
                                        <div className="absolute top-4 left-4 right-4 bg-amber-50/95 backdrop-blur-md border border-amber-200 p-3 rounded-2xl flex items-start gap-3 shadow-lg">
                                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Photo Hint</p>
                                                {qualityHints.map((hint, i) => (
                                                    <p key={i} className="text-[11px] text-amber-700 font-bold leading-tight">{hint}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                            <ImageIcon size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Selected Image</p>
                                            <p className="text-xs font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[200px]">
                                                {imageFile?.name || 'pothole-report.jpg'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => { setImageFile(null); setPreviewUrl(''); setQualityHints([]); }}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <Trash2 size={16} /> Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <label className="cursor-pointer block">
                                        <div className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                            <RefreshCw size={14} /> Change
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <button
                                        onClick={() => setStep('LOCATION')}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group uppercase tracking-widest"
                                    >
                                        Next Step <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Guidance Card - Minimal & Clean */}
                        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-slate-100">
                                    <Info size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Photo tips</h4>
                                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                                        Use road edge markings where possible. This helps our AI estimate the damage scale accurately.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowGuidance(true)}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 underline underline-offset-4"
                            >
                                View Guidelines
                            </button>
                        </div>
                    </div>
                )}

                {step === 'LOCATION' && (
                    <div className="space-y-6">


                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/5 space-y-6">
                            <button
                                onClick={handleGetLocation}
                                className="group w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                <Locate size={20} className="group-hover:rotate-90 transition-transform duration-700" /> 
                                Detect My Current GPS
                            </button>

                            <div className="flex items-center gap-4 text-slate-200 text-[10px] font-black uppercase tracking-[0.2em]">
                                <div className="flex-1 h-px bg-slate-100" /> OR <div className="flex-1 h-px bg-slate-100" />
                            </div>

                            <button
                                onClick={() => setIsMapModalOpen(true)}
                                className="w-full py-4 border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <MapPin size={16} /> Manual Pin Selection
                            </button>

                            {lat !== 6.9271 && (
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between animate-fade-in-up">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                            <Navigation size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Coordinates Locked</p>
                                            <p className="text-xs font-bold text-emerald-800">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                </div>
                            )}
                        </div>

                        {/* Map Modal */}
                        {isMapModalOpen && (
                            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in-up">
                                <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pin Precise Location</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Tap map to confirm pothole spot</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMapModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-600 border border-slate-100 hover:bg-slate-100 transition-colors">
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
                                    <div className="absolute bottom-0 left-0 right-0 z-[1000] p-8 bg-gradient-to-t from-white via-white/90 to-transparent">
                                        <button
                                            onClick={() => setIsMapModalOpen(false)}
                                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-2xl active:scale-[0.98] transition-all"
                                        >
                                            Confirm Pinned Location
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => setStep('PHOTO')} className="p-5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all hover:text-slate-900">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={() => {
                                    if (lat === 6.9271) { setError('Please specify location.'); return; }
                                    setError(''); setStep('DETAILS');
                                }}
                                className="flex-1 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group uppercase tracking-widest"
                            >
                                Continue Details 
                                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'DETAILS' && (
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/5 space-y-8">
                            <div className="flex gap-5 items-center pb-8 border-b border-slate-50">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-inner shrink-0 relative group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => { setStep('PHOTO'); setPreviewUrl(''); }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white scale-0 group-hover:scale-100 transition-transform"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100 mb-2">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Image Ready</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 mb-0.5 uppercase tracking-tight">Location Confirmed</p>
                                    <p className="text-[10px] font-mono font-bold text-slate-400">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Street / Landmark Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Near Colombo 7 junction..."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                                        value={roadName}
                                        onChange={e => setRoadName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Contextual Description</label>
                                    <textarea
                                        placeholder="Help teams understand the urgency — depth, traffic impact, etc."
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all text-sm font-bold text-slate-900 h-32 resize-none leading-relaxed placeholder:text-slate-300 shadow-inner no-scrollbar"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep('LOCATION')} className="p-5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all hover:text-slate-900">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={() => {
                                    if (!description.trim() && !roadName.trim()) { setError('Please provide a landmark or description.'); return; }
                                    setError(''); setStep('REVIEW');
                                }}
                                className="flex-1 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group uppercase tracking-widest"
                            >
                                Final Review
                                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-900/5 overflow-hidden">
                            <div className="h-56 relative group">
                                <img src={previewUrl} alt="Pothole preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20">
                                        <Camera size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Verified Photo</p>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">Public Report Artifact</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global GPS</p>
                                        <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">{lat.toFixed(5)}, {lon.toFixed(5)}</p>
                                    </div>
                                    {roadName && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identified Landmark</p>
                                            <p className="text-sm font-bold text-slate-700 truncate">{roadName}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {description && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Report Summary</p>
                                        <p className="text-sm text-slate-600 leading-relaxed font-bold italic">"{description}"</p>
                                    </div>
                                )}

                                <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                                            <ShieldCheck size={24} className="text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black uppercase tracking-tight leading-none">Trust & Verification</h4>
                                            <p className="text-[10px] text-white/80 leading-relaxed font-bold uppercase tracking-tight">
                                                Your report will be reviewed by official provincial maintenance teams for rapid action. 
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep('DETAILS')} className="p-5 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all hover:text-slate-900">
                                <ArrowLeft size={24} />
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 bg-blue-600 text-white rounded-[2rem] font-black text-base shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group uppercase tracking-widest"
                            >
                                <Navigation size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                Confirm & Submit
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-8 flex items-center gap-3 text-rose-600 text-xs font-black uppercase tracking-widest bg-rose-50 border border-rose-100 rounded-2xl p-5 animate-fade-in-up">
                    <AlertCircle size={18} /> {error}
                </div>
            )}
        </div>
    );
};

export default ReportWizard;
