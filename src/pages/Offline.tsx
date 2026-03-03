import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const Offline = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-premium flex items-center justify-center text-slate-300 mb-8 animate-pulse">
                <WifiOff size={48} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Connection Lost</h1>
            <p className="text-slate-500 max-w-xs mb-10 font-bold leading-relaxed">
                It looks like you're offline. RoadPulse requires an active telemetry link to sync detection data.
            </p>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <RefreshCw size={16} />
                    Retry Connection
                </button>

                <Link
                    to="/"
                    className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Home size={16} />
                    Back to Base
                </Link>
            </div>

            <div className="mt-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200/50 rounded-full">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-1" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Offline Mode Active</span>
                </div>
            </div>
        </div>
    );
};

export default Offline;
