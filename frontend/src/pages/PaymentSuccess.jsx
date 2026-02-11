
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <GlassCard className="max-w-md w-full p-10 text-center border-t-4 border-t-green-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h1>
                <p className="text-gray-400 mb-8">Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades premium.</p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                    Ir al Panel Principal
                    <ArrowRight size={20} />
                </button>
            </GlassCard>
        </div>
    );
};

export default PaymentSuccess;
