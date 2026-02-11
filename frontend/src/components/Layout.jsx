import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu } from 'lucide-react';

const Layout = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const sub = user?.subscription;
    const daysRemaining = sub ? sub.daysRemaining : 999;
    const showBanner = daysRemaining <= 5; // Show if 5 days or less

    return (
        <div className="flex min-h-screen bg-premium-bg relative">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between h-16">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-white text-lg">Maestros del Estilo</span>
                </div>
                <div className="w-10"></div> {/* Spacer to center title logic roughly */}
            </div>

            {/* Sidebar with props */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">

                {/* Mobile Spacer (push content down below fixed header) */}
                <div className="h-16 lg:hidden"></div>

                {/* SUBSCRIPTION BANNER */}
                {showBanner && (
                    <div className={`${daysRemaining <= 0 ? 'bg-red-600' : 'bg-urban-accent'} px-4 py-3 text-sm font-bold text-center flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 z-30 shadow-lg text-black relative`}>
                        <span className={daysRemaining <= 0 ? 'text-white' : 'text-black'}>
                            {daysRemaining <= 0
                                ? '⚠️ Tu suscripción ha vencido. El acceso está restringido.'
                                : `⚠️ Tu prueba gratuita vence en ${daysRemaining} días.`}
                        </span>
                        <Link to="/settings/billing" className={`underline hover:no-underline whitespace-nowrap ${daysRemaining <= 0 ? 'text-white' : 'text-black'}`}>
                            {daysRemaining <= 0 ? 'Pagar Ahora' : 'Renovar'}
                        </Link>
                    </div>
                )}

                <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 w-full max-w-[100vw] overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
                {/* Developer Credit */}
                <div className="py-4 text-center text-xs text-gray-500 border-t border-white/5 bg-premium-bg">
                    Desarrollado por <span className="font-semibold text-urban-accent">Patagonia Automatiza</span>
                </div>
            </div>
        </div>
    );
};

export default Layout;
