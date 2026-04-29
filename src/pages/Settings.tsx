import { useState, useEffect } from 'react';
import { settingsApi } from '../lib/api';
import { Save, AlertCircle, Bot } from 'lucide-react';

const Settings = () => {
    const [threshold, setThreshold] = useState<number>(0.6);
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        settingsApi.get().then(settings => {
            setThreshold(settings.acceptanceThreshold);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        await settingsApi.update({ acceptanceThreshold: threshold });
        setLoading(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="section-heading mb-1">Platform Protocols</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global configuration parameters and neural thresholds</p>
                </div>
            </div>

            <div className="card-premium overflow-hidden border-none shadow-2xl shadow-slate-900/5">
                <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Neural Core Validation</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuning the intelligence layer for citizen telemetry</p>
                    </div>
                </div>

                <div className="p-6 space-y-8 flex flex-col items-start max-w-xl">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-gray-700">Acceptance Threshold</label>
                            <span className="font-mono font-black text-primary text-xl px-3 py-1 bg-primary/10 rounded-lg">
                                {threshold.toFixed(2)}
                            </span>
                        </div>

                        <input
                            type="range"
                            min="0.1"
                            max="0.99"
                            step="0.01"
                            value={threshold}
                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />

                        <div className="flex justify-between text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                            <span>Loose (0.1)</span>
                            <span>Strict (0.99)</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 w-full">
                        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-blue-800 font-medium">
                            Reports scoring below this confidence threshold will be automatically marked as <span className="font-bold">REJECTED</span>. Higher values require the AI to be more certain before auto-generating official Pothole records.
                        </p>
                    </div>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-premium px-10 py-4 bg-slate-900 text-white shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaved ? "Protocols Updated" : loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
