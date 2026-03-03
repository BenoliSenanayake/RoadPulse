import { useState, useEffect } from 'react';
import { getSystemSettings } from '../mockData';
import { Save, AlertCircle, Bot } from 'lucide-react';

const Settings = () => {
    const [threshold, setThreshold] = useState<number>(0.6);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const settings = getSystemSettings();
        setThreshold(settings.acceptanceThreshold);
    }, []);

    const handleSave = () => {
        const settings = getSystemSettings();
        settings.acceptanceThreshold = threshold;
        localStorage.setItem('rp_settings', JSON.stringify(settings));

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-gray-500 font-medium">Configure global platform parameters and ML thresholds.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">AI Validation Engine</h2>
                        <p className="text-sm text-gray-500">Tune the automated citizen report validation.</p>
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

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-lg shadow-primary/20"
                    >
                        <Save size={18} />
                        {isSaved ? "Settings Saved" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
