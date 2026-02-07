import React from 'react';
import BarberSidebar from '../../components/BarberSidebar';
import { Outlet } from 'react-router-dom';

const BarberLayout = () => {
    return (
        <div className="flex min-h-screen bg-premium-bg">
            <BarberSidebar />
            <div className="flex-1 ml-64 flex flex-col h-screen">
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
                <div className="py-2 text-center text-xs text-gray-500 border-t border-white/5 bg-premium-bg">
                    Powered by <span className="font-semibold text-urban-accent">TurnoPro</span>
                </div>
            </div>
        </div>
    );
};

export default BarberLayout;
