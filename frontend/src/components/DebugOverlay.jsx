import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Bug } from 'lucide-react';

const DebugOverlay = () => {
    const { user, loading, debugLogs } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug')) {
        // return null; // Hide in production unless ?debug=true
        // Actually, let's show a tiny trigger for expected users
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-[9999] bg-red-900/50 text-red-200 p-2 rounded-full hover:bg-red-800 transition-all opacity-50 hover:opacity-100"
                title="Debug Auth"
            >
                <Bug size={16} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-[9999] w-96 bg-black/90 text-green-400 p-4 rounded-xl border border-green-900 font-mono text-xs shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2 border-b border-green-900 pb-2">
                <span className="font-bold">SYSTEM STATUS: {loading ? "LOADING" : "READY"}</span>
                <button onClick={() => setIsOpen(false)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
            </div>

            <div className="mb-4 space-y-1">
                <p><span className="text-gray-500">User:</span> {user ? user.email : "NULL"}</p>
                <p><span className="text-gray-500">ID:</span> {user?.id || "-"}</p>
                <p><span className="text-gray-500">Role:</span> {user?.role || "-"}</p>
                <p><span className="text-gray-500">Biz ID:</span> {user?.business_id || "NONE"}</p>
            </div>

            <div className="border-t border-green-900 pt-2">
                <p className="text-gray-500 mb-1">Logs:</p>
                <div className="space-y-0.5 max-h-40 overflow-y-auto flex flex-col-reverse">
                    {debugLogs.map((log, i) => (
                        <div key={i} className="truncate hover:whitespace-normal bg-black/50 px-1 rounded">{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DebugOverlay;
