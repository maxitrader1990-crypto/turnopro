
import React from 'react';
import { Scissors } from 'lucide-react';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
            <div className="relative flex items-center justify-center mb-8">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-urban-accent/20 blur-3xl rounded-full w-32 h-32 animate-pulse"></div>

                {/* Logo Icon */}
                <Scissors size={64} className="text-urban-accent relative z-10 animate-bounce-slow" />
            </div>

            <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent animate-fade-in-up">
                Maestros del Estilo
            </h1>

            <div className="mt-8 flex flex-col items-center gap-2">
                <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-urban-accent animate-loading-bar w-full origin-left"></div>
                </div>
                <p className="text-xs text-gray-500 font-mono tracking-widest mt-2 animate-pulse">CARGANDO...</p>
            </div>
        </div>
    );
};

export default SplashScreen;
