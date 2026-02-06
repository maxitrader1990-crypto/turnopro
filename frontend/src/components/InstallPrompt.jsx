import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIosDevice);

        // Capture event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!deferredPrompt && !isIOS) return null;

    return (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 w-max animate-in slide-in-from-bottom-5 fade-in duration-500 cursor-pointer hover:scale-105 transition-transform"
            onClick={handleInstallClick}
        >
            <Download size={20} />
            <span className="font-bold text-sm">
                {isIOS ? 'Para instalar: Compartir -> Agregar a Inicio' : 'Instalar App'}
            </span>
        </div>
    );
};

export default InstallPrompt;
