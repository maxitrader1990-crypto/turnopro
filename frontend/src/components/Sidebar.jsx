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
    Settings,
    TrendingUp,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();

    const links = [
        { to: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { to: '/reports', label: 'Reportes', icon: TrendingUp },
        { to: '/calendar', label: 'Calendario', icon: Calendar },
        { to: '/employees', label: 'Empleados', icon: UserCog },
        { to: '/services', label: 'Servicios', icon: Scissors },
        { to: '/gamification', label: 'Gamificación', icon: Trophy },
        { to: '/settings/billing', label: 'Suscripción', icon: CreditCard },
        { to: '/settings', label: 'Configuración', icon: Settings },
    ];

    const handleLinkClick = () => {
        if (onClose && window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <div className={clsx(
            "h-screen w-64 bg-gradient-to-b from-gray-900 to-black text-white flex flex-col fixed left-0 top-0 border-r border-white/10 shadow-2xl z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full mb-0"
        )}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div>
                    <span className="text-xl font-black bg-gradient-to-r from-urban-accent to-urban-gold bg-clip-text text-transparent">
                        Maestros del Estilo
                    </span>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">{user?.business_id ? 'Admin Panel' : 'Super Admin'}</p>
                </div>
                {/* Close button for mobile */}
                <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
                    <LogOut size={20} className="rotate-180" /> {/* Reusing Icon as "Back" or "Close" metaphor implies exiting menu */}
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-6">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={handleLinkClick}
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
