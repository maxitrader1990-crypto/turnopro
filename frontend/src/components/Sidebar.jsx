import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Scissors,
    UserCog,
    LogOut,
    Trophy,
    Gift,
    Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const Sidebar = () => {
    const { logout, user } = useAuth();

    const links = [
        { to: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { to: '/calendar', label: 'Calendario', icon: Calendar },
        { to: '/customers', label: 'Clientes', icon: Users },
        { to: '/employees', label: 'Empleados', icon: UserCog },
        { to: '/services', label: 'Servicios', icon: Scissors },
        // Only show Gamification if business has it enabled (UI logic later) 
        // For now show all
        { to: '/gamification', label: 'Gamificación', icon: Trophy },
        { to: '/settings', label: 'Configuración', icon: Settings },
    ];

    return (

        <div className="h-screen w-64 bg-gradient-to-b from-gray-900 to-black text-white flex flex-col fixed left-0 top-0 border-r border-white/10 shadow-2xl z-50">
            <div className="p-6 border-b border-white/5">
                <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">TurnoPro</h1>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{user?.business_id ? 'Admin Panel' : 'Super Admin'}</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-6">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden",
                            isActive
                                ? "text-white bg-white/10 shadow-inner border border-white/5"
                                : "text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                )}
                                <link.icon size={20} className={isActive ? "text-blue-400" : "group-hover:text-blue-400 transition-colors"} />
                                {link.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5 bg-black/20">
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

export default Sidebar;
