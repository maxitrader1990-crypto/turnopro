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

    // Debug info
    const debugInfo = (
        <div className="text-[10px] text-gray-500 mt-2 text-center font-mono bg-black/50 p-2 rounded">
            DEBUG: iOS:{isIOS ? 'Y' : 'N'} | Installed:{isInstalled ? 'Y' : 'N'} | Prompt:{deferredPrompt ? 'Y' : 'N'}
        </div>
    );

    if (isInstalled) {
        return (
            <div className="mb-6">
                <button
                    type="button"
                    disabled
                    className="w-full bg-green-900/50 text-green-200 font-bold py-3 px-4 rounded-lg border border-green-700/50 flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <Download className="w-6 h-6" />
                    App Ya Instalada
                </button>
                {debugInfo}
            </div>
        );
    }

    return (
        <div className="mb-6">
            <button
                type="button"
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-yellow-700 hover:to-yellow-900 transition-all duration-300 flex items-center justify-center gap-2"
            >
                <Download className="w-6 h-6" />
                Instalar Aplicación
            </button>
            {debugInfo}
        </div>
    );
};

export default InstallPWA;
