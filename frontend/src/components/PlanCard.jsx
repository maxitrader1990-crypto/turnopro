
import React from 'react';
import GlassCard from './GlassCard';
import { Check, Star, Zap } from 'lucide-react';

const PlanCard = ({ plan, onSelect, isCurrent }) => {
    const isRecommended = plan.recommended;

    return (
        <GlassCard className={`p-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-urban-accent/20 flex flex-col h-full ${isRecommended ? 'border-urban-accent/50 scale-105 z-10' : 'hover:border-white/20'}`}>
            {isRecommended && (
                <div className="absolute top-0 right-0 bg-urban-accent text-black text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                    <Star size={12} fill="black" />
                    Más Elegido
                </div>
            )}

            <h3 className={`text-xl font-bold mb-2 ${isRecommended ? 'text-urban-accent' : 'text-white'}`}>{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">$ {plan.price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">/ mes</span>
            </div>

            <p className="text-gray-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>

            <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isRecommended ? 'bg-urban-accent/20 text-urban-accent' : 'bg-gray-800 text-gray-400'}`}>
                            <Check size={12} />
                        </div>
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSelect(plan)}
                disabled={isCurrent}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg ${isCurrent
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                    : isRecommended
                        ? 'bg-gradient-to-r from-urban-accent to-yellow-600 text-black hover:shadow-urban-accent/40'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
            >
                {isCurrent ? 'Plan Actual' : 'Elegir Plan'}
            </button>
        </GlassCard>
    );
};

export default PlanCard;
