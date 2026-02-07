import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Image,
    User,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const BarberSidebar = () => {
    const { logout, user } = useAuth();

    const links = [
        { to: '/barber/dashboard', label: 'Mi Panel', icon: LayoutDashboard },
        { to: '/barber/portfolio', label: 'Mi Portafolio', icon: Image },
        // { to: '/barber/profile', label: 'Mi Perfil', icon: User },
    ];

    return (
        <div className="h-screen w-64 bg-gradient-to-b from-gray-900 to-black text-white flex flex-col fixed left-0 top-0 border-r border-white/10 shadow-2xl z-50">
            <div className="p-6 border-b border-white/5">
                <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-urban-accent to-yellow-200">BarberPro</h1>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Panel Profesional</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-6">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden",
                            isActive
                                ? "text-urban-accent bg-white/10 shadow-inner border border-white/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-0 h-full w-1 bg-urban-accent shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                )}
                                <link.icon size={20} className={isActive ? "text-urban-accent" : "group-hover:text-urban-accent transition-colors"} />
                                {link.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white border-2 border-urban-accent">
                        {user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white max-w-[120px] truncate">{user?.email}</p>
                        <p className="text-xs text-urban-accent">Conectado</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors text-sm font-medium group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default BarberSidebar;
