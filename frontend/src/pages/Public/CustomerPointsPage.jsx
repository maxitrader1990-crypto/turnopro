import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { Trophy, Gift, Search, Loader, AlertCircle, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import InstallPrompt from '../../components/InstallPrompt';

const CustomerPointsPage = () => {
    const { slug } = useParams();
    const [business, setBusiness] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [step, setStep] = useState(0); // 0=LoadingBus, 1=Login, 2=Dashboard
    const { register, handleSubmit, formState: { errors } } = useForm();

    // 1. Fetch Business
    useEffect(() => {
        const fetchBusiness = async () => {
            if (!slug) return;
            try {
                // Try searching by subdomain first
                let { data, error } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('subdomain', slug)
                    .maybeSingle();

                // If not found, try ID if UUID
                if (!data && !error) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
                    if (isUuid) {
                        const { data: byId } = await supabase
                            .from('businesses')
                            .select('*')
                            .eq('id', slug)
                            .maybeSingle();
                        data = byId;
                    }
                }

                if (data) {
                    setBusiness(data);
                    setStep(1);
                } else {
                    toast.error("Negocio no encontrado");
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchBusiness();
    }, [slug]);

    // 2. Fetch Rewards
    const { data: rewards } = useQuery({
        queryKey: ['publicRewards', business?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('rewards')
                .select('*')
                .eq('business_id', business.id)
                .is('is_active', true)
                .order('points_cost', { ascending: true });
            return data;
        },
        enabled: !!business?.id && step === 2
    });

    // 3. Login / Find Customer
    const onSearch = async (formData) => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('email', formData.email)
                .eq('business_id', business.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setCustomer(data);
                setStep(2);
                toast.success(`Hola, ${data.first_name}!`);
            } else {
                toast.error("No encontramos un cliente con ese email en este negocio.");
            }
        } catch (e) {
            toast.error("Error buscando cliente.");
        }
    };

    // 4. Redeem Handler (WhatsApp MVP)
    const handleRedeem = (reward) => {
        const phone = business.phone || '5492804976552'; // Default fallback if no business phone column yet (using one from booking)
        const msg = `Hola! Soy ${customer.first_name} ${customer.last_name}. Quiero canjear mis puntos por: ${reward.name} (${reward.points_cost} pts). Mi email es ${customer.email}.`;
        const link = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(link, '_blank');
    };

    if (step === 0) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

    if (step === 1) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                        <Trophy size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{business?.name || 'Club de Puntos'}</h1>
                    <p className="text-gray-500 mb-8">Ingresa tu email para ver tus puntos y premios disponibles.</p>

                    <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
                        <div>
                            <input
                                {...register('email', { required: true })}
                                type="email"
                                placeholder="tu@email.com"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                            />
                        </div>
                        <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">
                            Ver mis Puntos
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-md mx-auto space-y-6">

                {/* Header Card */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={120} />
                    </div>

                    <div className="relative z-10">
                        <p className="opacity-80 text-sm font-medium mb-1">Total Puntos</p>
                        <h1 className="text-5xl font-bold mb-4">{customer?.points || 0}</h1>
                        <div className="flex items-center gap-2 text-purple-100 text-sm bg-white/10 w-fit px-3 py-1 rounded-full">
                            <span>Hola, {customer?.first_name}</span>
                        </div>
                    </div>
                </div>

                {/* Progress / Status */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Gift size={18} className="text-purple-500" /> Premios Disponibles</h3>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Catálogo</span>
                    </div>

                    <div className="space-y-4">
                        {rewards?.length === 0 && <p className="text-center text-gray-400 py-4">No hay premios configurados aún.</p>}

                        {rewards?.map(reward => {
                            const canAfford = (customer?.points || 0) >= reward.points_cost;
                            const progress = Math.min(100, ((customer?.points || 0) / reward.points_cost) * 100);

                            return (
                                <div key={reward.id} className="border border-gray-100 rounded-xl p-4 hover:border-purple-100 transition-colors bg-white relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{reward.name}</h4>
                                            <p className="text-xs text-gray-500">{reward.description}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${canAfford ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {reward.points_cost} pts
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${canAfford ? 'bg-green-500' : 'bg-purple-300'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {canAfford ? (
                                        <button
                                            onClick={() => handleRedeem(reward)}
                                            className="w-full py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-200"
                                        >
                                            <MessageCircle size={16} /> Canjear por WhatsApp
                                        </button>
                                    ) : (
                                        <p className="text-xs text-center text-gray-400">
                                            Te faltan {reward.points_cost - (customer?.points || 0)} pts
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center">
                    <button onClick={() => setStep(1)} className="text-gray-400 text-sm hover:text-gray-600 underline">
                        Consultar otro email
                    </button>
                </div>

// ... imports
                import InstallPrompt from '../../components/InstallPrompt';

            // ... component code ...

            </div>
            <InstallPrompt />
        </div>
    );
};

export default CustomerPointsPage;
