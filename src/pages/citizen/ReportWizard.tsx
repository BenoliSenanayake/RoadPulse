import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import {
    MapPin, CheckCircle2, XCircle, Loader2,
    Locate, Navigation, ArrowRight, ArrowLeft,
    AlertCircle, Shield, PlusCircle, X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { submitCitizenReport } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { EvidenceViewer } from '../../components/EvidenceViewer';
import { simulateYoloDetection, type DetectionResult } from '../../lib/aiValidationService';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

type Step = 'PHOTO' | 'LOCATION' | 'DETAILS' | 'REVIEW' | 'SUBMITTING';

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

const ReportWizard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('PHOTO');

    // Form State
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [lat, setLat] = useState(6.9271);
    const [lon, setLon] = useState(79.8612);
    const [roadName, setRoadName] = useState('');
    const [description, setDescription] = useState('');

    // UI State
    const [error, setError] = useState('');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file.');
                return;
            }
            
            // Validate file size (e.g., 10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image is too large. Maximum size is 10MB.');
                return;
            }

            const compressed = await compressImage(file);
            setPreviewUrl(compressed);
            setStep('LOCATION');

            // Start AI validation
            setIsAnalyzing(true);
            simulateYoloDetection(compressed).then((result) => {
                setDetectionResult(result);
                setIsAnalyzing(false);
            });
        }
    };

    const handleGetLocation = () => {
        setError('');
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLat(pos.coords.latitude);
                    setLon(pos.coords.longitude);
                    setIsMapModalOpen(true);
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setError('Please enable location access or select manually on the map.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    };

    const handleSubmit = async () => {
        setStep('SUBMITTING');
        try {
            const report = await submitCitizenReport({
                citizenId: user?.id || 'anonymous',
                submittedBy: user?.name || 'Citizen',
                lat,
                lon,
                description: `${roadName ? `[${roadName}] ` : ''}${description}`.trim(),
                imageUrl: previewUrl,
                aiStatus: detectionResult?.aiStatus || 'PENDING',
                aiConfidence: detectionResult?.confidence,
                aiReason: detectionResult?.message,
                modelName: detectionResult?.modelName,
                modelVersion: detectionResult?.modelVersion,
                inferenceTimeMs: detectionResult?.inferenceTimeMs,
                bbox: detectionResult?.bbox
            } as any);
            navigate(`/citizen/status/${report.id}`);
        } catch (err) {
            setError('System transmission failed. Please verify connection and retry.');
            setStep('REVIEW');
        }
    };

    const steps = [
        { id: 'PHOTO', label: 'Photo' },
        { id: 'LOCATION', label: 'Map' },
        { id: 'DETAILS', label: 'Details' },
        { id: 'REVIEW', label: 'Review' }
    ];

    if (step === 'SUBMITTING') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
                    <Loader2 size={40} className="text-white animate-spin" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Neural Analysis</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Validating road surface telemetry</p>
            </div>
        );
    }


    return (
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 pb-40">
            {step === 'PHOTO' && (
                <div className="mb-20 animate-fade-in-up">
                    <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-8 py-16 sm:px-12 sm:py-20 text-white shadow-2xl shadow-slate-900/40 mb-12">
                        {/* Visual Eye Candy */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[100px] -mr-32 -mt-32 animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px] -ml-32 -mb-32" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full mb-6">
                                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-light">National Road Surface Integrity</span>
                            </div>

                            <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-[1.1] tracking-tighter">
                                Fix your <span className="bg-gradient-to-r from-white via-accent-light to-white bg-clip-text text-transparent italic">streets.</span>
                            </h1>

                            <p className="text-slate-400 text-base sm:text-lg font-bold leading-relaxed max-w-md">
                                Use our AI-powered portal to report road damage instantly. Real-time validation, faster repairs.
                            </p>
                        </div>
                    </section>

                    <div className="flex items-center justify-center gap-6 px-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Joined by <span className="text-slate-900">4.2k citizens</span> today
                        </p>
                    </div>
                </div>
            )}

            {/* Progress Indicator */}
            {step !== 'PHOTO' && (
                <div className="flex items-center justify-between mb-16 bg-white p-3 rounded-full border border-slate-100 shadow-xl shadow-slate-200/20">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex-1 flex items-center justify-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500",
                                step === s.id ? "bg-slate-900 text-white scale-110 shadow-xl shadow-slate-900/30" :
                                    steps.findIndex(x => x.id === step) > i ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-200"
                            )}>
                                {steps.findIndex(x => x.id === step) > i ? <CheckCircle2 size={20} /> : i + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Step 1: Photo */}
            {step === 'PHOTO' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <label className="cursor-pointer group block">
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[4rem] p-16 text-center space-y-8 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-2xl shadow-slate-200/50">
                            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-500">
                                <PlusCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase group-hover:text-accent transition-colors">Capture Defect</h3>
                                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px]">Environment Scan Engine v1.0</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>
                    </label>
                </div>
            )}

            {/* Step 2: Location */}
            {step === 'LOCATION' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="text-center space-y-2 mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Defect Location</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Geospatial synchronization required</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 space-y-8">
                        <button
                            onClick={handleGetLocation}
                            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-900/40 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            <Locate size={20} className="animate-pulse" />
                            Use Current GPS Location
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-slate-50" />
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-200">
                                <span className="bg-white px-4 italic">or manual override</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsMapModalOpen(true)}
                            className="w-full py-5 border border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-3"
                        >
                            <MapPin size={16} /> Open Interactive Map
                        </button>

                        {lat !== 6.9271 && (
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                    <p className="text-[10px] font-black text-emerald-700 uppercase">Coordinates Locked</p>
                                </div>
                                <CheckCircle2 className="text-emerald-500" size={16} />
                            </div>
                        )}
                    </div>

                    {/* Map Modal */}
                    {isMapModalOpen && (
                        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md z-1">
                                <div className="space-y-0.5">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Tactical Map</h3>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Sector Alignment Active</p>
                                </div>
                                <button
                                    onClick={() => setIsMapModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-900 rounded-full active:scale-90 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 relative z-0">
                                <MapContainer
                                    center={[lat, lon]}
                                    zoom={16}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                    <MapController center={[lat, lon]} />
                                    <MapEvents onLocationSelect={(newLat, newLon) => {
                                        setLat(newLat);
                                        setLon(newLon);
                                    }} />
                                    <Marker
                                        position={[lat, lon]}
                                        icon={L.icon({
                                            iconUrl: icon,
                                            shadowUrl: iconShadow,
                                            iconSize: [40, 66],
                                            iconAnchor: [20, 66],
                                        })}
                                    />
                                </MapContainer>

                                {/* GPS HUD Overlay */}
                                <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-xl">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Vector Location</span>
                                        <span className="text-[10px] font-bold text-white font-mono">{lat.toFixed(5)}, {lon.toFixed(5)}</span>
                                    </div>
                                </div>

                                {/* Floating Action Bar */}
                                <div className="absolute bottom-0 left-0 right-0 z-[1000] p-6 bg-gradient-to-t from-white via-white/80 to-transparent">
                                    <button
                                        onClick={() => setIsMapModalOpen(false)}
                                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-slate-800 transition-all active:scale-[0.98]"
                                    >
                                        Establish Fix
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => { setStep('PHOTO'); setPreviewUrl(''); }}
                            className="p-6 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100 active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={() => {
                                if (lat === 6.9271) {
                                    setError('Please synchronize coordinates before proceeding.');
                                } else {
                                    setStep('DETAILS');
                                }
                            }}
                            className="flex-1 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            Continue Signal
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center justify-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Details */}
            {step === 'DETAILS' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="text-center space-y-2 mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Final Intel</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Provide mission context</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 space-y-10 shadow-2xl shadow-slate-200/50">
                        <div className="flex gap-8 items-center border-b border-slate-50 pb-10">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-900/10 shrink-0">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <button
                                    onClick={() => { setStep('PHOTO'); setPreviewUrl(''); }}
                                    className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                >
                                    <XCircle size={16} />
                                </button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Target Telemetry</p>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-900 uppercase">Sector {lat.toFixed(2)}E</p>
                                    <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter truncate">{lat.toFixed(6)}, {lon.toFixed(6)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tactical Landmark</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Near Colombo 7 junction..."
                                    className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-sm text-slate-900 tracking-tight"
                                    value={roadName}
                                    onChange={(e) => setRoadName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Intel Brief</label>
                                <textarea
                                    placeholder="Describe defect severity or depth..."
                                    className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-sm text-slate-900 h-40 resize-none tracking-tight leading-relaxed"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center justify-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('LOCATION')}
                            className="p-6 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={() => {
                                if (!description.trim() && !roadName.trim()) {
                                    setError('Please provide at least a landmark or description.');
                                    return;
                                }
                                setError('');
                                setStep('REVIEW');
                            }}
                            className="flex-1 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            Review Report
                            <ArrowRight size={20} className="text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Review */}
            {step === 'REVIEW' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="text-center space-y-2 mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Confirm Intel</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Review mission parameters before transmission</p>
                    </div>

                    {isAnalyzing ? (
                         <div className="bg-slate-900 rounded-[3.5rem] p-16 text-center text-white shadow-2xl flex flex-col items-center justify-center space-y-6">
                             <div className="w-16 h-16 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
                             <div>
                                 <p className="text-xl font-black tracking-tighter">AI Analysis in Progress</p>
                                 <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Running YOLO inference</p>
                             </div>
                         </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 space-y-10 shadow-2xl shadow-slate-200/50">
                            <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
                                 <EvidenceViewer 
                                    imageUrl={previewUrl}
                                    badges={{
                                        confidence: detectionResult?.confidence || 0,
                                        status: detectionResult?.aiStatus === 'ACCEPTED' ? 'New' : 'Rejected'
                                    }}
                                    metadata={{
                                        timestamp: new Date().toISOString(),
                                        lat,
                                        lon,
                                        roadName,
                                        modelName: detectionResult?.modelName,
                                        modelVersion: detectionResult?.modelVersion,
                                        inferenceTimeMs: detectionResult?.inferenceTimeMs,
                                        bbox: detectionResult?.bbox
                                    }}
                                 />
                            </div>
                            
                            <div className="flex flex-col gap-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Recommendation</p>
                                    <p className={cn("text-sm font-bold", 
                                        detectionResult?.aiStatus === 'ACCEPTED' ? "text-emerald-600" :
                                        detectionResult?.aiStatus === 'PENDING' ? "text-amber-600" : "text-rose-600"
                                    )}>
                                        {detectionResult?.message || 'Awaiting analysis...'}
                                    </p>
                                </div>
                                <div className="space-y-4 px-2">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Landmark</p>
                                        <p className="text-sm font-bold text-slate-900">{roadName || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Briefing</p>
                                        <p className="text-sm font-bold text-slate-900">{description || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center justify-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('DETAILS')}
                            className="p-6 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                            Authorize Transmission
                            <Navigation size={20} className="fill-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportWizard;
