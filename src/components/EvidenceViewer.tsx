import React, { useState, useRef, useEffect } from 'react';
import {
    Maximize2,
    Minimize2,
    RefreshCw,
    BarChart,
    AlertCircle,
    Clock,
    Crosshair,
    Cpu,
    Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Severity, PotholeStatus } from '../types';

interface EvidenceViewerProps {
    imageUrl?: string;
    bbox?: {
        x: number;
        y: number;
        w: number;
        h: number;
        format?: 'REL' | 'ABS';
    };
    badges: {
        confidence: number;
        severity: Severity;
        status: PotholeStatus;
    };
    metadata: {
        timestamp: string;
        lat: number;
        lon: number;
        district?: string;
        roadName?: string;
        runId: string;
        frameId?: string;
        modelName?: string;
        modelVersion?: string;
        inferenceTimeMs?: number;
    };
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
    imageUrl,
    bbox,
    badges,
    metadata
}) => {
    console.log('EvidenceViewer BBox:', bbox);
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

    // Convert relative bbox to percentages
    const bboxStyle = bbox && bbox.format === 'REL' ? {
        left: `${bbox.x * 100}%`,
        top: `${bbox.y * 100}%`,
        width: `${bbox.w * 100}%`,
        height: `${bbox.h * 100}%`
    } : bbox ? {
        // If ABS, we'd need image dimensions, but prioritizing REL as requested
        left: `${bbox.x}px`,
        top: `${bbox.y}px`,
        width: `${bbox.w}px`,
        height: `${bbox.h}px`
    } : null;

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
                            onLoad={() => {
                                // Optional: handle image load to ensure bbox renders after size is known
                                // but with REL % coords it should be automatic
                            }}
                        />

                        {/* Bounding Box Overlay */}
                        {bboxStyle && (
                            <div
                                className="absolute border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] pointer-events-none z-10"
                                style={bboxStyle}
                            >
                                <div className="absolute -top-5 left-[-2px] bg-emerald-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm uppercase leading-none shadow-sm whitespace-nowrap">
                                    Pothole DET
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
                                badges.severity === 'High' ? 'bg-red-500' :
                                    badges.severity === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            )}>
                                <AlertCircle size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Severity</p>
                                <p className="text-lg font-black text-white leading-none uppercase">{badges.severity}</p>
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
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Context</p>
                                <p className="text-sm font-bold text-white/90">RUN: {metadata.runId}</p>
                                <p className="text-xs text-gray-500">FRAME: {metadata.frameId || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* AI Model Section */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/5 rounded-lg text-white/40"><Cpu size={18} /></div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Inference Engine</p>
                                <p className="text-sm font-bold text-white/90">{metadata.modelName || 'Neural Engine'}</p>
                                <p className="text-xs text-gray-500">Version {metadata.modelVersion || 'v1.0'}</p>
                            </div>
                        </div>

                        {metadata.inferenceTimeMs && (
                            <div className="p-4 bg-white/3 rounded-xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Inference Latency</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-emerald-400 tabular-nums">{metadata.inferenceTimeMs}</span>
                                    <span className="text-xs font-bold text-gray-500 pb-1 uppercase">ms</span>
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
