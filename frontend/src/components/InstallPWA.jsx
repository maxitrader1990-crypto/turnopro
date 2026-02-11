import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log("PWA Install event captured");
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        if (outcome === 'accepted') {
            toast.success('Instalando aplicación...');
            setDeferredPrompt(null);
            setIsInstallable(false);
        } else {
            console.log('User dismissed the install prompt');
        }
    };

    if (!isInstallable) return null;

    return (
        <button
            type="button"
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-yellow-700 hover:to-yellow-900 transition-all duration-300 flex items-center justify-center gap-2 my-4"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar Aplicación
        </button>
    );
};

export default InstallPWA;
