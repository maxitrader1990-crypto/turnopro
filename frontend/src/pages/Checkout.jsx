
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { Lock, CreditCard, ShieldCheck, ArrowLeft, Building, Mail, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    // Default to 'pro' if no plan passed (dev safety)
    const selectedPlan = state?.plan || {
        id: 'pro',
        name: 'Profesional',
        price: 25000,
        currency: 'ARS'
    };

    const handlePayment = async () => {
        setIsProcessing(true);

        // Mock Payment Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Success Logic (in real app, this goes to MP link)
        toast.success(`¡Suscripción a ${selectedPlan.name} activada!`);
        setIsProcessing(false);
        navigate('/payment-success');
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 lg:p-12">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Column: Payment Form */}
                <div className="lg:col-span-7 space-y-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        Volver a planes
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <ShieldCheck className="text-emerald-500" />
                            Pago Seguro
                        </h1>
                        <p className="text-gray-400">Completa tus datos para activar tu suscripción premium.</p>
                    </div>

                    {/* Business Info */}
                    <GlassCard className="p-8">
                        <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Detalles de Facturación</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email del Titular</label>
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <Mail className="text-gray-400" size={20} />
                                    <span className="text-white">{user?.email}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Negocio</label>
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <Building className="text-gray-400" size={20} />
                                    <span className="text-white">ID: {user?.business_id?.slice(0, 8)}...</span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Payment Method Selector */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Método de Pago</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="bg-urban-accent/10 border-2 border-urban-accent p-4 rounded-xl flex flex-col items-center gap-2 text-urban-accent transition-all shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                <CreditCard size={24} />
                                <span className="font-bold">Mercado Pago</span>
                            </button>
                            <button className="bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-xl flex flex-col items-center gap-2 text-gray-400 transition-all">
                                <Building size={24} />
                                <span className="font-medium">Transferencia</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-5">
                    <GlassCard className="p-8 sticky top-8 border-t-4 border-t-urban-accent">
                        <h3 className="text-xl font-bold mb-6">Resumen del Pedido</h3>

                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-300">Plan Seleccionado</span>
                            <span className="font-bold text-white text-lg">{selectedPlan.name}</span>
                        </div>

                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
                            <span className="text-gray-300">Periodo</span>
                            <span className="text-gray-400">Mensual</span>
                        </div>

                        <div className="space-y-2 mb-8">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span>${selectedPlan.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Impuestos (IVA)</span>
                                <span>$0.00</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8 pt-4 border-t border-white/10">
                            <span className="text-xl font-bold">Total a Pagar</span>
                            <span className="text-3xl font-black text-urban-accent">${selectedPlan.price.toLocaleString()}</span>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-urban-accent to-yellow-600 rounded-xl font-bold text-black shadow-lg hover:shadow-urban-accent/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader className="animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Pagar y Activar
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                            <Lock size={12} />
                            Transacción encriptada de extremo a extremo
                        </p>
                    </GlassCard>
                </div>

            </div>
        </div>
    );
};

export default Checkout;
