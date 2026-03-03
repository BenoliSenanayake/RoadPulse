import React, { useState, useEffect } from 'react';
import { submitCitizenReport, listCitizenReports } from '../lib/api';
import { Upload, MapPin, CheckCircle2, XCircle, Loader2, Locate, LogOut, Navigation, ArrowRight, AlertTriangle } from 'lucide-react';
import type { CitizenReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';
import { ActivityTimeline } from '../components/ActivityTimeline';

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
    const { logout, user } = useAuth();
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

    // Clean Standalone Header
    const Header = () => (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>
                    <span className="text-xl font-black text-gray-900 tracking-tight">RoadPulse</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-500 hidden sm:block">Welcome, {user?.name.split(' ')[0]}</span>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-bold transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </div>
        </header>
    );

    if (isSubmitting) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
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
            <div className="min-h-screen bg-gray-50">
                <Header />
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
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Report a Pothole</h1>
                    <p className="text-gray-500 text-lg font-medium">Help us keep Sri Lanka's roads safe by reporting hazardous surface damage.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
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
                                className="w-full flex items-center justify-center gap-3 bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-primary/30 hover:bg-opacity-90 hover:-translate-y-1 active:translate-y-0 transition-all"
                            >
                                Submit Pothole Report
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Submissions History */}
                {mySubmissions.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 px-2">My Recent Submissions</h2>
                        <div className="space-y-4">
                            {mySubmissions.map(report => (
                                <div key={report.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-5">
                                    <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 overflow-hidden border border-gray-200">
                                        <img src={report.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-gray-400 mb-1">
                                            <span>{report.id}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-gray-900 font-semibold mb-2 line-clamp-1">
                                            {report.description || `Pothole reported at ${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}`}
                                        </p>
                                        <div className="flex gap-2">
                                            {report.aiStatus === 'ACCEPTED' && <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded">Accepted</span>}
                                            {report.aiStatus === 'REJECTED' && <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider rounded">Rejected</span>}
                                            {report.aiStatus === 'PENDING' && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded">Reviewing</span>}
                                        </div>
                                    </div>
                                    {report.aiStatus === 'ACCEPTED' && report.linkedPotholeId && (
                                        <Link
                                            to={`/potholes/${report.linkedPotholeId}`}
                                            className="w-full md:w-auto text-center px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-bold text-gray-700 rounded-lg transition-colors"
                                        >
                                            View Map
                                        </Link>
                                    )}
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
