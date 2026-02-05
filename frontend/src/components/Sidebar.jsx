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
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-wider text-blue-400">TurnoPro</h1>
                <p className="text-xs text-slate-400 mt-1">{user?.business_id ? 'Business Admin' : 'Super Admin'}</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <link.icon size={20} />
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors text-sm font-medium"
                >
                    Certificado SSL (Seguro)
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
