
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, HelpCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const PaymentFailed = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <GlassCard className="max-w-md w-full p-10 text-center border-t-4 border-t-red-500">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle size={40} className="text-red-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Pago Fallido</h1>
                <p className="text-gray-400 mb-8">Hubo un problema al procesar tu pago. Por favor intenta nuevamente o verifica tu método de pago.</p>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/checkout')}
                        className="w-full py-4 bg-urban-accent text-black rounded-xl font-bold hover:bg-yellow-600 transition-colors"
                    >
                        Intentar Nuevamente
                    </button>
                    <button
                        onClick={() => navigate('/billing')}
                        className="w-full py-4 bg-transparent text-gray-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <HelpCircle size={18} />
                        Volver a Facturación
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default PaymentFailed;
