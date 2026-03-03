import React, { useState, useEffect } from 'react';
import { submitCitizenReport, listCitizenReports } from '../lib/api';
import { Upload, MapPin, CheckCircle2, XCircle, Loader2, Locate, Navigation, ArrowRight, AlertTriangle, PlusCircle } from 'lucide-react';
import type { CitizenReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { StatusPill } from '../components/StatusPill';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map inner component for catching clicks and updating pin
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// Map inner component for flying to new centers
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
    }, [center, map]);
    return null;
}

const CitizenPortal = () => {
    const { user } = useAuth();
    const [lat, setLat] = useState('6.9271');
    const [lon, setLon] = useState('79.8612');
    const [description, setDescription] = useState('');
    const [roadName, setRoadName] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<CitizenReport | null>(null);
    const [locationError, setLocationError] = useState('');
    const [formError, setFormError] = useState('');

    // History
    const [mySubmissions, setMySubmissions] = useState<CitizenReport[]>([]);

    useEffect(() => {
        loadMySubmissions();
    }, [result]); // reload when a new report is finished

    const loadMySubmissions = () => {
        if (!user) return;
        const all = listCitizenReports();
        const mine = all.filter(r => r.citizenId === user.id);
        const latest = mine.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
        setMySubmissions(latest);
    };

    const handleGetLocation = () => {
        setLocationError('');
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLat(position.coords.latitude.toFixed(6));
                    setLon(position.coords.longitude.toFixed(6));
                },
                () => {
                    setLocationError('Unable to retrieve your location automatically. Please tap on the map.');
                }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormError('');
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!previewUrl) {
            setFormError('Please upload a photo of the pothole to proceed.');
            return;
        }

        setIsSubmitting(true);
        setResult(null);

        try {
            const report = await submitCitizenReport({
                citizenId: user?.id || 'u3',
                submittedBy: user?.name || 'Citizen Reporter',
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                description: `${roadName ? `[${roadName}] ` : ''}${description}`.trim(),
                imageUrl: previewUrl || 'https://picsum.photos/seed/new/800/600',
            });

            setResult(report);
        } catch (error) {
            console.error(error);
            setFormError("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setResult(null);
        setDescription('');
        setRoadName('');
        setPreviewUrl('');
        setFormError('');
    };

    // Clean Standalone Header (Removed since Layout handles it now)
    // We can still use a sub-header for portal specific CTAs if needed


    if (isSubmitting) {
        return (
            <div className="bg-slate-50 min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-12 transition-all animate-in fade-in duration-500">
                <div className="max-w-3xl mx-auto py-12 px-4">
                    <div className="bg-white rounded-3xl p-12 text-center space-y-6 shadow-xl relative overflow-hidden border border-gray-100">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-100">
                            <div className="h-full bg-blue-500 animate-pulse w-full"></div>
                        </div>
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
                            <Loader2 size={48} className="text-blue-500 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-gray-800 tracking-tight">AI Validation in Progress</h2>
                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Status: Analyzing Image</p>
                        </div>
                        <p className="text-gray-500 max-w-md mx-auto font-medium">
                            Your report has been securely transmitted. Our automated visual recognition system is currently scanning the image for road surface defects. Please do not close this page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        const isAccepted = result.aiStatus === 'ACCEPTED';
        return (
            <div className="bg-slate-50 min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-12 transition-all animate-in fade-in duration-500">
                <div className="max-w-3xl mx-auto py-12 px-4">
                    <div className="bg-white rounded-3xl p-10 text-center space-y-6 shadow-xl relative overflow-hidden border border-gray-100">
                        <div className={`absolute top-0 left-0 w-full h-2 ${isAccepted ? 'bg-green-500' : 'bg-red-500'}`} />

                        <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-inner ${isAccepted ? 'bg-green-50 border-4 border-green-100' : 'bg-red-50 border-4 border-red-100'}`}>
                            {isAccepted ? <CheckCircle2 size={56} className="text-green-600" /> : <XCircle size={56} className="text-red-600" />}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                                {isAccepted ? "Report Accepted" : "Report Rejected"}
                            </h2>
                            <p className={`text-sm font-bold uppercase tracking-widest ${isAccepted ? 'text-green-600' : 'text-red-600'}`}>
                                {isAccepted ? 'Added to Maintenance Queue' : 'Discarded by System'}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-8 max-w-lg mx-auto text-left relative overflow-hidden">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">AI Pre-Validation Analysis</p>

                            <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-200">
                                <span className="font-semibold text-gray-700">Calculated Confidence:</span>
                                <span className={`font-mono font-black text-3xl ${isAccepted ? 'text-green-600' : 'text-red-600'}`}>
                                    {(result.aiConfidence! * 100).toFixed(1)}%
                                </span>
                            </div>

                            {isAccepted ? (
                                <div className="space-y-6">
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1"><CheckCircle2 size={24} className="text-green-500" /></div>
                                        <p className="text-gray-600 font-medium text-sm leading-relaxed">
                                            Our AI successfully identified pothole features in your submission. An official defect record has been generated and dispatched to the maintenance team.
                                        </p>
                                    </div>
                                    <Link
                                        to={`/potholes/${result.linkedPotholeId}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-green-100 rounded-xl text-green-700 font-bold hover:bg-green-50 transition-colors"
                                    >
                                        <Navigation size={18} />
                                        View on Public Map
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1"><XCircle size={24} className="text-red-500" /></div>
                                    <p className="text-gray-600 font-medium text-sm leading-relaxed">
                                        {result.aiReason || "Our AI could not detect any clear pothole features in this image. We need clear visibility of the road surface damage."}
                                    </p>
                                </div>
                            )}

                            {/* Timeline Integration */}
                            <div className="mt-8 border-t border-gray-200 pt-6">
                                <ActivityTimeline entityId={result.id} />
                            </div>
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={resetForm}
                                className="px-8 py-4 w-full sm:w-auto bg-gray-900 text-white rounded-xl font-bold hover:bg-black active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20"
                            >
                                Submit Another Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 px-8 py-20 sm:px-16 sm:py-28 text-white shadow-2xl shadow-slate-900/30">
                {/* Visual Eye Candy */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-accent/40 to-blue-600/20 blur-[120px] -mr-64 -mt-64 animate-pulse opacity-50" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] -ml-48 -mb-48" />

                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(255,165,0,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-light">Citizen Empowerment Portal</span>
                    </div>

                    <h1 className="text-4xl sm:text-7xl font-black mb-8 leading-[1.1] tracking-tight animate-fade-in-up delay-75">
                        Let's Fix Our <br />
                        <span className="bg-gradient-to-r from-white via-accent-light to-white bg-clip-text text-transparent italic">Roads Together.</span>
                    </h1>

                    <p className="text-slate-400 text-lg sm:text-xl font-bold leading-relaxed mb-12 max-w-xl animate-fade-in-up delay-150">
                        Join thousands of citizens using RoadPulse to report hazards. Our AI validates reports in real-time, accelerating repairs by up to 60%.
                    </p>

                    <div className="flex flex-wrap gap-6 animate-fade-in-up delay-300">
                        <a href="#report-form" className="btn-premium group bg-white text-slate-900 border-none px-8 py-5 text-lg hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]">
                            Start Reporting
                            <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-500" />
                        </a>
                        <a href="#history" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors group">
                            Check My Submissions
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Glass Stats Overlay (Optional/Subtle) */}
                <div className="absolute bottom-12 right-12 hidden lg:flex gap-8 animate-fade-in-up delay-500">
                    <div className="glass-premium p-6 rounded-3xl border-white/5 bg-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Fixed</p>
                        <p className="text-3xl font-black">1.2k+</p>
                    </div>
                    <div className="glass-premium p-6 rounded-3xl border-white/5 bg-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Avg Resolution</p>
                        <p className="text-3xl font-black">48h</p>
                    </div>
                </div>
            </section>

            <div id="report-form" className="max-w-4xl mx-auto space-y-8 scroll-mt-24">
                <div className="text-center sm:text-left">
                    <h2 className="section-heading mb-2">Submit Evidence</h2>
                    <p className="text-slate-500 font-medium">Please provide a clear photo and location of the pothole.</p>
                </div>

                <div className="card-premium overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                                <p className="text-sm font-semibold">{formError}</p>
                            </div>
                        )}

                        {/* Image Upload */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest">1. Photo Evidence</label>
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Required</span>
                            </div>

                            <div className={`border-2 border-dashed ${!previewUrl && formError ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'} rounded-2xl p-2 transition-colors relative overflow-hidden group`}>
                                {previewUrl ? (
                                    <div className="relative">
                                        <img src={previewUrl} alt="Preview" className="w-full max-h-96 object-cover rounded-xl shadow-sm" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); setPreviewUrl(''); }}
                                                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-xl hover:bg-red-600 transition-colors"
                                            >
                                                Remove Photo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center justify-center gap-4 py-16">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Upload size={32} />
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <p className="font-bold text-lg text-gray-900">Click to upload or drag image here</p>
                                            <p className="text-gray-500 text-sm font-medium">Supports JPG, PNG up to 10MB</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Location Picker */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest">2. Exact Location</label>
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Required</span>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                                    >
                                        <Locate size={18} className="text-primary" />
                                        Use My Current Location
                                    </button>
                                    <div className="flex-1 flex gap-2">
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">LAT</span>
                                            <input type="text" readOnly value={lat} className="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none" />
                                        </div>
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">LON</span>
                                            <input type="text" readOnly value={lon} className="w-full pl-10 pr-3 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {locationError && <p className="text-xs text-red-500 mb-3 font-semibold">{locationError}</p>}
                                <p className="text-xs text-gray-500 font-medium mb-3">You can also drag the map and click to place the pin precisely.</p>

                                <div className="h-[300px] rounded-xl overflow-hidden border border-gray-300 shadow-inner z-0 relative">
                                    <MapContainer
                                        center={[parseFloat(lat), parseFloat(lon)]}
                                        zoom={14}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <MapController center={[parseFloat(lat), parseFloat(lon)]} />
                                        <MapEvents onLocationSelect={(newLat, newLon) => {
                                            setLat(newLat.toFixed(6));
                                            setLon(newLon.toFixed(6));
                                        }} />
                                        <Marker position={[parseFloat(lat), parseFloat(lon)]} />
                                    </MapContainer>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Additional Details */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest">3. Additional Details</label>
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Street name or nearby landmark..."
                                        className="w-full pl-12 pr-4 py-4 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-800 font-medium"
                                        value={roadName}
                                        onChange={(e) => setRoadName(e.target.value)}
                                    />
                                </div>
                                <textarea
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-32 transition-colors text-gray-800 font-medium placeholder:text-gray-400"
                                    placeholder="Add any specific details about the size or depth of the pothole to help maintenance teams..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="w-full btn-premium bg-slate-900 text-white py-5 rounded-2xl text-lg shadow-xl shadow-slate-900/20 hover:scale-[1.01] active:scale-[0.98]"
                            >
                                Submit Report
                                <ArrowRight size={22} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Submissions History */}
                {mySubmissions.length > 0 && (
                    <div id="history" className="mt-16 scroll-mt-24">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h2 className="section-heading">Submission History</h2>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{mySubmissions.length} Reports</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {mySubmissions.map(report => (
                                <div key={report.id} className="card-premium p-4 flex gap-4 items-start hover:border-slate-300">
                                    <div className="w-20 h-20 bg-slate-100 rounded-xl shrink-0 overflow-hidden border border-slate-100 shadow-inner">
                                        <img src={report.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 font-mono text-[10px] font-black text-slate-400 mb-1">
                                            <span className="truncate">#{report.id.split('-')[0]}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-slate-900 font-bold mb-3 line-clamp-1 text-sm">
                                            {report.description || `Reported at ${report.lat.toFixed(2)}, ${report.lon.toFixed(2)}`}
                                        </p>
                                        <div className="flex items-center justify-between gap-2">
                                            <StatusPill status={report.aiStatus as any} />
                                            {report.aiStatus === 'ACCEPTED' && report.linkedPotholeId && (
                                                <Link
                                                    to={`/potholes/${report.linkedPotholeId}`}
                                                    className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                                >
                                                    <Navigation size={18} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenPortal;
