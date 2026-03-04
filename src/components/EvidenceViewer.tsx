import React, { useState, useRef, useEffect } from 'react';
import {
    Maximize2,
    Minimize2,
    RefreshCw,
    BarChart,
    Clock,
    Crosshair,
    Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { PotholeStatus } from '../types';

interface EvidenceViewerProps {
    imageUrl?: string;
    badges: {
        confidence: number;
        status: PotholeStatus;
    };
    metadata: {
        timestamp: string;
        lat: number;
        lon: number;
        district?: string;
        roadName?: string;
        inferenceTimeMs?: number;
        modelName?: string;
        modelVersion?: string;
        bbox?: [number, number, number, number]; // [x, y, w, h]
    };
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
    imageUrl,
    badges,
    metadata
}) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Clamp scale between 1 and 4
    const updateScale = (delta: number) => {
        setScale(prev => Math.min(Math.max(prev + delta, 1), 4));
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || isFullscreen) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            updateScale(delta);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetTransform = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    if (!imageUrl) {
        return (
            <div className="card h-[500px] flex flex-col items-center justify-center bg-gray-50 border-dashed border-2">
                <div className="p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <Camera size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-700">No evidence uploaded yet</h3>
                <p className="text-sm text-gray-500">Waiting for next vehicle sync...</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn(
            "flex flex-col lg:flex-row gap-0 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5",
            isFullscreen && "rounded-none w-screen h-screen"
        )}>
            {/* Viewer Primary View */}
            <div
                className="relative flex-1 min-h-[500px] bg-black overflow-hidden group cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Transform Layer */}
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                    }}
                >
                    {/* Content Wrapper - This div matches the visible image dimensions */}
                    <div className="relative inline-block max-w-[95%] max-h-[95%] shadow-2xl">
                        <img
                            src={imageUrl}
                            alt="Pothole Evidence"
                            className="block w-full h-auto max-h-[80vh] pointer-events-none select-none rounded-sm"
                        />
                        {/* Bounding Box Overlay */}
                        {metadata.bbox && (
                            <div
                                className="absolute border-2 border-primary bg-primary/20 shadow-[0_0_15px_rgba(37,99,235,0.5)] z-10"
                                style={{
                                    left: `${metadata.bbox[0] * 100}%`,
                                    top: `${metadata.bbox[1] * 100}%`,
                                    width: `${metadata.bbox[2] * 100}%`,
                                    height: `${metadata.bbox[3] * 100}%`
                                }}
                            >
                                <div className="absolute -top-6 left-[-2px] bg-primary text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest whitespace-nowrap">
                                    {metadata.modelName || 'POTHOLE'} {(badges.confidence * 100).toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Badges Overlay */}
                <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
                            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
                                <BarChart size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Confidence</p>
                                <p className="text-lg font-black text-white leading-none">{(badges.confidence * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center gap-2">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
                            <div className={cn(
                                "p-1.5 rounded-lg text-white",
                                badges.status === 'New' ? 'bg-blue-600' :
                                    badges.status === 'Confirmed' ? 'bg-amber-500' :
                                        badges.status === 'Scheduled' ? 'bg-purple-500' :
                                            badges.status === 'Fixed' ? 'bg-emerald-600' : 'bg-red-500'
                            )}>
                                <Clock size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                <p className="text-lg font-black text-white leading-none uppercase">{badges.status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => updateScale(0.2)}
                        className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        aria-label="Zoom In"
                    >
                        <RefreshCw size={20} className="rotate-45" />
                    </button>
                    <button
                        onClick={() => updateScale(-0.2)}
                        className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        aria-label="Zoom Out"
                    >
                        <RefreshCw size={20} className="-rotate-135" />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button
                        onClick={resetTransform}
                        className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 px-4"
                        aria-label="Reset Zoom"
                    >
                        <RefreshCw size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Reset</span>
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button
                        onClick={toggleFullscreen}
                        className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        aria-label="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Sidebar Metadata */}
            <div className="w-full lg:w-80 bg-[#0B0F17] border-l border-white/5 flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-white/5 bg-white/5">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1 opacity-40">System Metadata</h4>
                    <p className="text-white font-bold text-lg">Evidence Analysis</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Location Section */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/5 rounded-lg text-white/40"><Crosshair size={18} /></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Coordinates</p>
                                <p className="text-sm font-bold text-white/90 tabular-nums">{metadata.lat.toFixed(6)}, {metadata.lon.toFixed(6)}</p>
                                <p className="text-xs text-gray-500">{metadata.roadName}, {metadata.district}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/5 rounded-lg text-white/40"><Camera size={18} /></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Source</p>
                                <p className="text-sm font-bold text-white/90">Citizen Report / AI Detected</p>
                            </div>
                        </div>

                        {metadata.modelName && (
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white/5 rounded-lg text-white/40"><BarChart size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ML Pipeline</p>
                                    <p className="text-sm font-bold text-white/90 tabular-nums">Model: {metadata.modelName} ({metadata.modelVersion})</p>
                                    {metadata.inferenceTimeMs && <p className="text-xs text-gray-500">Inference: {metadata.inferenceTimeMs}ms</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white/2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Captured At</span>
                    </div>
                    <p className="text-xs font-bold text-white/80">{new Date(metadata.timestamp).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};
