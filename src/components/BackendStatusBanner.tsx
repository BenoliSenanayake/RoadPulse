import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { isBackendDown, checkBackendHealth } from '../lib/api';

export const BackendStatusBanner = () => {
    const [down, setDown] = useState(isBackendDown);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        // Poll health every 10 seconds
        const interval = setInterval(async () => {
            const healthy = await checkBackendHealth();
            setDown(!healthy);
        }, 10000);
        
        // Initial check
        checkBackendHealth().then(healthy => setDown(!healthy));

        return () => clearInterval(interval);
    }, []);

    const handleRetry = async () => {
        setRetrying(true);
        const healthy = await checkBackendHealth();
        setDown(!healthy);
        setRetrying(false);
        if (healthy) window.location.reload();
    };

    if (!down) return null;

    return (
        <div className="bg-rose-600 text-white px-6 py-2 flex items-center justify-between gap-4 animate-slide-down sticky top-0 z-[10000]">
            <div className="flex items-center gap-3">
                <AlertCircle size={16} className="animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Backend Unavailable - Showing offline demo data
                </p>
            </div>
            <button 
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all"
            >
                <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
                <span className="text-[9px] font-black uppercase tracking-widest">Reconnect</span>
            </button>
        </div>
    );
};
