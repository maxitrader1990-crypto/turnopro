import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Share, MoreVertical } from 'lucide-react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Listen for install prompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("PWA Install event captured");
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Android / Desktop standard way
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else if (isIOS) {
            // iOS Instructions
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-bold">Para instalar en iOS:</p>
                    <div className="flex items-center gap-2 text-sm">
                        <span>1. Toca el botón compartir</span> <Share size={16} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span>2. Selecciona "Agregar al Inicio"</span>
                    </div>
                </div>
            ), { duration: 5000, icon: '📱' });
        } else {
            // Android fallback (if event didn't fire but not installed)
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <p className="font-bold">Instalación Manual:</p>
                    <div className="flex items-center gap-2 text-sm">
                        <span>1. Toca los 3 puntos del navegador</span> <MoreVertical size={16} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span>2. "Instalar aplicación" o "Agregar a inicio"</span>
                    </div>
                </div>
            ), { duration: 5000, icon: '📲' });
        }
    };

    if (isInstalled) return null;

    return (
        <button
            type="button"
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-yellow-700 hover:to-yellow-900 transition-all duration-300 flex items-center justify-center gap-2 mb-6 animate-pulse"
        >
            <Download className="w-5 h-5" />
            Instalar App
        </button>
    );
};

export default InstallPWA;
