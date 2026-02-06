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
            <div className="min-h-screen bg-premium-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-urban-secondary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-urban-accent/10 rounded-full blur-[120px]" />

                <div className="bg-premium-card backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative z-10 animate-fade-in-up">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-urban-accent border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <Trophy size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">{business?.name || 'Club de Puntos'}</h1>
                    <p className="text-gray-400 mb-8">Ingresa tu email para ver tus puntos y premios disponibles.</p>

                    <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
                        <div>
                            <input
                                {...register('email', { required: true })}
                                type="email"
                                placeholder="tu@email.com"
                                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-urban-accent focus:border-urban-accent outline-none transition-all"
                            />
                        </div>
                        <button type="submit" className="w-full btn-urban text-lg shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                            Ver mis Puntos
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white">Powered by <span className="font-bold text-urban-accent">Patagonia Automatiza</span></p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium-bg p-4 pb-20 relative overflow-hidden">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-urban-accent/5 to-transparent" />
            </div>

            <div className="max-w-md mx-auto space-y-6 relative z-10">

                {/* Header Card */}
                <div className="bg-gradient-to-br from-urban-card-bg to-black border border-white/10 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-urban-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-urban-accent">
                        <Trophy size={120} />
                    </div>

                    <div className="relative z-10">
                        <p className="text-urban-accent text-xs font-bold uppercase tracking-widest mb-2">Total Puntos</p>
                        <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-sm">{customer?.points || 0}</h1>
                        <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/5">
                            <span>Hola, <span className="text-white font-bold">{customer?.first_name}</span></span>
                        </div>
                    </div>
                </div>

                {/* Progress / Status */}
                <div className="bg-premium-card backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2 text-lg"><Gift size={20} className="text-urban-accent" /> Premios Disponibles</h3>
                        <span className="text-[10px] font-bold text-black bg-urban-accent px-2 py-1 rounded-md uppercase tracking-wider">Catálogo</span>
                    </div>

                    <div className="space-y-4">
                        {rewards?.length === 0 && <p className="text-center text-gray-500 py-4 italic">No hay premios configurados aún.</p>}

                        {rewards?.map(reward => {
                            const canAfford = (customer?.points || 0) >= reward.points_cost;
                            const progress = Math.min(100, ((customer?.points || 0) / reward.points_cost) * 100);

                            return (
                                <div key={reward.id} className="border border-white/5 bg-white/5 rounded-xl p-5 hover:border-urban-accent/30 hover:bg-white/10 transition-all relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-100 text-lg">{reward.name}</h4>
                                            <p className="text-xs text-gray-400 mt-1">{reward.description}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${canAfford ? 'bg-urban-accent text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-white/10 text-gray-500'}`}>
                                            {reward.points_cost} pts
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${canAfford ? 'bg-urban-accent shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-gray-600'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {canAfford ? (
                                        <button
                                            onClick={() => handleRedeem(reward)}
                                            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-sm hover:from-green-400 hover:to-green-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transform hover:-translate-y-1"
                                        >
                                            <MessageCircle size={18} /> Canjear por WhatsApp
                                        </button>
                                    ) : (
                                        <p className="text-xs text-center text-gray-500 font-medium">
                                            Te faltan <span className="text-gray-300">{reward.points_cost - (customer?.points || 0)}</span> pts para canjear
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="text-center pt-4">
                    <button onClick={() => setStep(1)} className="text-gray-500 text-sm hover:text-urban-accent transition-colors underline decoration-dotted">
                        Consultar otro email
                    </button>
                </div>

                {/* Footer */}
                <div className="pt-8 pb-4 text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white">Powered by <span className="font-bold text-urban-accent">Patagonia Automatiza</span></p>
                </div>
            </div>
            <InstallPrompt />
        </div>
    );
};

export default CustomerPointsPage;
