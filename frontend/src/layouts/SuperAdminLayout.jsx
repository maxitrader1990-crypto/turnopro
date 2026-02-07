import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    FileText,
    LogOut,
    ShieldAlert,
    Users,
    Activity
} from 'lucide-react';

const SuperAdminLayout = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const links = [
        { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/superadmin/businesses', label: 'Barberías', icon: Building2 },
        { to: '/superadmin/payments', label: 'Pagos & Finanzas', icon: CreditCard },
        { to: '/superadmin/audit', label: 'Audit Logs', icon: FileText },
        { to: '/superadmin/recovery', label: 'Recuperación', icon: Activity },
    ];

    if (!user?.isSuperAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <ShieldAlert size={64} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Acceso Denegado</h1>
                    <p className="text-gray-400">No tienes permisos de Super Administrador.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-black font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col fixed h-full z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center gap-2">
                        <ShieldAlert className="text-purple-500" />
                        SUPER ADMIN
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">TurnoPro SaaS</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {links.map((link) => {
                        const isActive = location.pathname.startsWith(link.to);
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-white transition-colors'} />
                                <span>{link.label}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-l-full shadow-[0_0_10px_purple]"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                <span className="font-bold text-white text-sm">SA</span>
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user.email}</p>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LayoutDashboard size={18} />
                        Ir a Barbería
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default SuperAdminLayout;
