
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import BillingHistory from '../components/BillingHistory';
import { CreditCard, Clock, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../constants/plans';

const Billing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentPlan, setCurrentPlan] = useState(null);

    useEffect(() => {
        // Mock logic to find plan details based on ID (replace with real user.subscription.plan_id)
        // Defaulting to Basic if not found/trial
        const planId = user?.subscription?.plan_id || 'basic';
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
        setCurrentPlan(plan);
    }, [user]);

    const isTrial = user?.subscription?.status === 'trial';
    const isExpired = user?.subscription?.status === 'expired';
    const isActive = user?.subscription?.status === 'active';

    const daysRemaining = user?.subscription?.daysRemaining || 0;

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Suscripción y Facturación</h1>
                        <p className="text-gray-400 mt-1">Administra tu plan y método de pago.</p>
                    </div>
                </div>

                {/* Status Banner (if expired or close to expiring) */}
                {(isExpired || (daysRemaining < 5 && daysRemaining > 0)) && (
                    <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4 ${isExpired
                        ? 'bg-red-500/10 border-red-500/20 text-red-200'
                        : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <AlertTriangle className={isExpired ? "text-red-500" : "text-yellow-500"} />
                            <div>
                                <p className="font-bold">{isExpired ? 'Tu suscripción ha vencido' : 'Tu periodo de prueba finaliza pronto'}</p>
                                <p className="text-sm opacity-80">{isExpired ? 'Renueva ahora para recuperar el acceso total.' : `Te quedan solo ${daysRemaining} días.`}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/plans')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm ${isExpired ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}
                        >
                            {isExpired ? 'Renovar Suscripción' : 'Elegir Plan'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Card: Current Plan */}
                    <div className="lg:col-span-2">
                        <GlassCard className="h-full p-8 border-t-4 border-t-urban-accent">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">Plan Actual</p>
                                    <h2 className="text-3xl font-black text-white">{currentPlan?.name || 'Cargando...'}</h2>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        isTrial ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {isActive ? 'Activo' : isTrial ? 'Prueba Gratuita' : 'Vencido'}
                                </div>
                            </div>

                            {/* Progress Bar for Trial */}
                            {isTrial && (
                                <div className="mb-8">
                                    <div className="flex justify-between text-sm mb-2 text-gray-400">
                                        <span>Días restantes</span>
                                        <span className="text-white font-bold">{daysRemaining} de 15</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                            style={{ width: `${(daysRemaining / 15) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase mb-1">Precio de Renovación</p>
                                    <p className="text-xl font-bold text-white">${currentPlan?.price?.toLocaleString()}<span className="text-sm text-gray-500 font-normal">/mes</span></p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase mb-1">Próxima Factura</p>
                                    <p className="text-xl font-bold text-white flex items-center gap-2">
                                        <Clock size={18} className="text-gray-400" />
                                        {user?.subscription?.current_period_end
                                            ? new Date(user.subscription.current_period_end).toLocaleDateString()
                                            : '--/--/----'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/plans')}
                                    className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowUpRight size={18} />
                                    Cambiar Plan
                                </button>
                                {isExpired && (
                                    <button
                                        onClick={() => navigate('/plans')}
                                        className="flex-1 bg-urban-accent text-black font-bold py-3 rounded-xl hover:bg-yellow-500 transition-colors animate-pulse"
                                    >
                                        Renovar Ahora
                                    </button>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Secondary Card: Payment Method */}
                    <div className="lg:col-span-1">
                        <GlassCard className="h-full p-8 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-6 text-gray-400">
                                    <CreditCard size={24} />
                                    <h3 className="text-lg font-bold text-white">Método de Pago</h3>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-sm text-white truncate">Mercado Pago</p>
                                        <p className="text-xs text-gray-500">Predeterminado</p>
                                    </div>
                                </div>
                            </div>

                            <button className="text-urban-accent text-sm font-bold hover:underline self-start">
                                Actualizar método
                            </button>
                        </GlassCard>
                    </div>
                </div>

                {/* History Table */}
                <BillingHistory payments={[]} /> {/* Empty array for now, waiting for real data */}
            </div>
        </div>
    );
};

export default Billing;
