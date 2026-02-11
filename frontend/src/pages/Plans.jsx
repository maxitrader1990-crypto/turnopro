
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUBSCRIPTION_PLANS } from '../constants/plans';
import PlanCard from '../components/PlanCard';
import GlassCard from '../components/GlassCard';
import { ArrowLeft } from 'lucide-react';

const Plans = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSelectPlan = (plan) => {
        // Navigate to checkout with plan selected
        navigate('/checkout', { state: { plan } });
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-12">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">
                            Elige tu <span className="text-urban-accent">Evolución</span>
                        </h1>
                        <p className="text-gray-400">Selecciona el plan que se adapte al crecimiento de tu barbería.</p>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                        <div key={plan.id} className={plan.recommended ? "md:-mt-4 md:mb-4" : ""}>
                            <PlanCard
                                plan={plan}
                                onSelect={handleSelectPlan}
                                isCurrent={user?.subscription?.plan_id === plan.id && user?.subscription?.status === 'active'}
                            />
                        </div>
                    ))}
                </div>

                {/* FAQ Section (Optional/Skeleton) */}
                <div className="mt-20 max-w-3xl mx-auto text-center">
                    <h3 className="text-xl font-bold mb-6">Preguntas Frecuentes</h3>
                    <div className="grid gap-4 text-left">
                        <GlassCard className="p-6">
                            <h4 className="font-bold mb-2">¿Puedo cambiar de plan en cualquier momento?</h4>
                            <p className="text-gray-400 text-sm">Sí, puedes subir o bajar de categoría cuando quieras. El cambio será efectivo en el próximo ciclo de facturación.</p>
                        </GlassCard>
                        <GlassCard className="p-6">
                            <h4 className="font-bold mb-2">¿Qué métodos de pago aceptan?</h4>
                            <p className="text-gray-400 text-sm">Aceptamos todas las tarjetas de crédito y débito a través de Mercado Pago, además de transferencias bancarias.</p>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Plans;
