import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col h-screen">
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
                {/* Developer Credit */}
                <div className="py-2 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
                    Desarrollado por <span className="font-semibold text-gray-500">Patagonia Automatiza</span>
                </div>
            </div>
        </div>
    );
};

export default Layout;
