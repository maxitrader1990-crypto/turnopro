import React from 'react';
import Sidebar from './Sidebar';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user } = useAuth();
    const sub = user?.subscription;
    const daysRemaining = sub ? sub.daysRemaining : 999;
    const showBanner = daysRemaining <= 5; // Show if 5 days or less

    return (
        <div className="flex min-h-screen bg-premium-bg relative">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col h-screen">
                {/* SUBSCRIPTION BANNER */}
                {showBanner && (
                    <div className={`${daysRemaining <= 0 ? 'bg-red-600' : 'bg-urban-accent'} px-4 py-2 text-sm font-bold text-center flex justify-center items-center gap-4 z-50 shadow-lg text-black`}>
                        <span className={daysRemaining <= 0 ? 'text-white' : 'text-black'}>
                            {daysRemaining <= 0
                                ? '⚠️ Tu suscripción ha vencido. El acceso está restringido.'
                                : `⚠️ Tu prueba gratuita vence en ${daysRemaining} días.`}
                        </span>
                        <Link to="/settings/billing" className={`underline hover:no-underline ${daysRemaining <= 0 ? 'text-white' : 'text-black'}`}>
                            {daysRemaining <= 0 ? 'Pagar Ahora' : 'Renovar'}
                        </Link>
                    </div>
                )}

                <div className="p-8 overflow-y-auto flex-1">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
                {/* Developer Credit */}
                <div className="py-2 text-center text-xs text-gray-500 border-t border-white/5 bg-premium-bg">
                    Desarrollado por <span className="font-semibold text-urban-accent">Patagonia Automatiza</span>
                </div>
            </div>
        </div>
    );
};

export default Layout;
