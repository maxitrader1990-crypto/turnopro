import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Scissors, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientHome = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-urban-accent selection:text-black">
            {/* --- HEADER --- */}
            <div className="bg-urban-black border-b border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-black text-white uppercase tracking-widest">
                        Patagonia Automatiza
                    </h1>
                    <button
                        onClick={logout}
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="card-premium p-8 text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-urban-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-urban-accent/20">
                        <User size={40} className="text-urban-accent" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        ¡Hola, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Bienvenido a tu perfil de cliente.
                    </p>

                    <div className="bg-gray-900/50 rounded-xl p-6 border border-white/5 mb-8 text-left">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                            <Calendar size={18} className="text-urban-accent" />
                            Tus Turnos
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Para ver tus turnos pasados o futuros, comunícate con tu barbería o usa el enlace que te enviaron.
                            <br /><span className="text-xs opacity-70">(Próximamente verás tu historial aquí)</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            ¿Buscas reservar un turno?
                        </p>
                        <a
                            href="https://maestrosdelestilo.com/p/demo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-urban w-full py-3 flex items-center justify-center gap-2"
                        >
                            <Scissors size={20} />
                            Ir a Reservar
                        </a>
                        <p className="text-xs text-gray-600 mt-4">
                            Si eres dueño de negocio y ves esto por error, contacta soporte.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientHome;
