import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Check, AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Billing = () => {
    const { user } = useAuth();
    const sub = user?.subscription;
    const isExpired = sub?.status === 'expired' || sub?.status === 'inactive';

    // Mock MP Payment Link (Replace with real one provided by user later)
    // For now, it's a placeholder button that would open MP.
    const handlePayment = () => {
        // Here we would redirect to the MP preference URL
        // window.location.href = "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...";
        alert("Integración de Mercado Pago pendiente. Aquí iría el link de pago.");
    };

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <CreditCard className="text-urban-accent" /> Suscripción y Facturación
            </h1>
            <p className="text-gray-400 mb-8">Administra el plan de tu negocio.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* STATUS CARD */}
                <div className={`card-premium p-8 border-l-4 ${isExpired ? 'border-red-500' : 'border-green-500'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Estado Actual</p>
                            <h2 className={`text-3xl font-bold ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
                                {isExpired ? 'Vencida / Inactiva' : 'Activa'}
                            </h2>
                        </div>
                        <div className={`p-3 rounded-full ${isExpired ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                            {isExpired ? <AlertTriangle size={32} /> : <Shield size={32} />}
                        </div>
                    </div>

                    {sub ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-300">
                                <Clock size={20} className="text-urban-accent" />
                                <span>
                                    Vence el: <strong className="text-white">{format(new Date(sub.current_period_end), 'd MMMM, yyyy', { locale: es })}</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono">
                                    {sub.daysRemaining > 0 ? `${sub.daysRemaining} días restantes` : '0 días restantes'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400">No se encontró información de suscripción.</p>
                    )}

                    {isExpired && (
                        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-red-200 text-sm mb-4">
                                Tu suscripción ha finalizado. Renueva ahora para recuperar el acceso total al sistema.
                            </p>
                            <button
                                onClick={handlePayment}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <img src="https://img.icons8.com/color/48/mercado-pago.png" className="w-6 h-6" alt="MP" />
                                Pagar $30.000 ARS
                            </button>
                        </div>
                    )}
                </div>

                {/* PLAN DETAILS */}
                <div className="card-premium p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Plan Profesional</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold text-urban-accent">$30.000</span>
                        <span className="text-gray-400">/mes</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {[
                            'Panel de Administración Completo',
                            'Gestión de Barberos y Horarios',
                            'Agenda y Turnos Ilimitados',
                            'Panel para Barberos (Dashboard)',
                            'Recordatorios por WhatsApp (Link)',
                            'Gamificación y Fidelización',
                            'Reportes Avanzados',
                            'Soporte Prioritario'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-300">
                                <div className="p-1 bg-urban-accent/20 rounded-full">
                                    <Check size={12} className="text-urban-accent" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>

                    {!isExpired && (
                        <button
                            onClick={handlePayment}
                            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold rounded-lg transition-all"
                        >
                            Extender Suscripción
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Billing;
