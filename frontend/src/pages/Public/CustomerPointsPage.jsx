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

    // --- ROBUST FETCH HELPER ---
    const robustFetch = async (tableName, queryBuilderFn, fallbackUrlFn) => {
        try {
            // STRATEGY 1: Supabase Client (Protected by 3s Timeout)
            const query = queryBuilderFn(supabase.from(tableName));
            const clientPromise = query;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT_CLIENT')), 3000)
            );

            try {
                const { data, error } = await Promise.race([clientPromise, timeoutPromise]);
                if (error) throw error;
                if (data) return data;
            } catch (err) {
                console.log(`[${tableName}] Client failed/timed out. Switching to Fallback.`);
            }

            // STRATEGY 2: Fallback Fetch
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const url = fallbackUrlFn(supabaseUrl);

            const response = await fetch(url, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });

            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            return await response.json();

        } catch (err) {
            console.error(`CRITICAL [${tableName}]: ${err.message}`);
            return []; // Return empty array/null on total failure
        }
    };

    // 1. Fetch Business
    useEffect(() => {
        const fetchBusiness = async () => {
            if (!slug) return;
            try {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

                // Robust Fetch for Business
                const data = await robustFetch(
                    'businesses',
                    (q) => {
                        if (isUuid) return q.select('*').eq('id', slug).maybeSingle();
                        return q.select('*').eq('subdomain', slug).maybeSingle();
                    },
                    (baseUrl) => {
                        const filter = isUuid ? `id=eq.${slug}` : `subdomain=eq.${slug}`;
                        return `${baseUrl}/rest/v1/businesses?${filter}&select=*&limit=1`;
                    }
                );

                // Handle Array vs Object return from Fallback
                const businessData = Array.isArray(data) ? data[0] : data;

                if (businessData) {
                    setBusiness(businessData);
                    setStep(1);
                } else {
                    toast.error("Negocio no encontrado");
                }
            } catch (e) {
                console.error(e);
                toast.error("Error cargando negocio");
            }
        };
        fetchBusiness();
    }, [slug]);

    // 2. Fetch Rewards
    const { data: rewards } = useQuery({
        queryKey: ['publicRewards', business?.id],
        queryFn: async () => {
            return robustFetch(
                'rewards',
                (q) => q.select('*').eq('business_id', business.id).eq('is_active', true).order('points_cost', { ascending: true }),
                (baseUrl) => `${baseUrl}/rest/v1/rewards?business_id=eq.${business.id}&is_active=eq.true&order=points_cost.asc&select=*`
            );
        },
        enabled: !!business?.id && step === 2
    });

    // 3. Login / Find Customer
    const onSearch = async (formData) => {
        try {
            const data = await robustFetch(
                'customers',
                (q) => q.select('*').eq('email', formData.email).eq('business_id', business.id).maybeSingle(),
                (baseUrl) => `${baseUrl}/rest/v1/customers?email=eq.${formData.email}&business_id=eq.${business.id}&select=*&limit=1`
            );

            // Handle Array vs Object return from Fallback
            const customerData = Array.isArray(data) ? data[0] : data;

            if (customerData) {
                setCustomer(customerData);
                setStep(2);
                toast.success(`Hola, ${customerData.first_name}!`);
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
                                <div
                                    key={reward.id}
                                    className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 border group
                                        ${canAfford
                                            ? 'bg-gradient-to-br from-urban-accent/10 to-black border-urban-accent/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }
                                    `}
                                >
                                    {/* Shimmer Effect for Unlockable Rewards */}
                                    {canAfford && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shimmer pointer-events-none" />
                                    )}

                                    <div className="flex items-start gap-5 relative z-10">
                                        {/* Icon Container */}
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10
                                            ${canAfford ? 'bg-gradient-to-br from-urban-accent to-yellow-600 text-black shadow-urban-accent/30' : 'bg-black/40 text-gray-600 grayscale'}
                                        `}>
                                            {reward.type === 'product' ? '🥤' : reward.type === 'experience' ? '👑' : '✂️'}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-black text-xl uppercase italic tracking-wide ${canAfford ? 'text-white' : 'text-gray-400'}`}>
                                                    {reward.name}
                                                </h4>
                                                <div className={`px-3 py-1 rounded-lg text-sm font-black border
                                                    ${canAfford
                                                        ? 'bg-urban-accent text-black border-urban-accent shadow-glow-gold'
                                                        : 'bg-black/30 text-gray-500 border-white/10'}
                                                `}>
                                                    {reward.points_cost} PTS
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-400 mt-2 font-medium leading-relaxed">{reward.description}</p>

                                            {/* Progress Section */}
                                            <div className="mt-5">
                                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-2">
                                                    <span className={canAfford ? 'text-urban-accent' : 'text-gray-500'}>
                                                        {canAfford ? '¡Objetivo Alcanzado!' : 'Progreso'}
                                                    </span>
                                                    <span className="text-white">{Math.floor(progress)}%</span>
                                                </div>

                                                <div className="w-full bg-black/60 h-3 rounded-full overflow-hidden border border-white/5 relative">
                                                    {/* Animated Striped Bar */}
                                                    <div
                                                        className={`h-full rounded-full relative overflow-hidden transition-all duration-1000 ${canAfford ? 'bg-urban-accent' : 'bg-gray-700'}`}
                                                        style={{ width: `${progress}%` }}
                                                    >
                                                        {canAfford && (
                                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InN0cmlwZXMiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMODAgMEgwIEwwIDQwWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3N0cmlwZXMpIi8+PC9zdmc+')] animate-slide-bg opacity-30"></div>
                                                        )}
                                                    </div>
                                                </div>

                                                {!canAfford && (
                                                    <p className="text-xs text-center mt-2 text-gray-500 font-mono">
                                                        Faltan <span className="text-gray-300 font-bold">{reward.points_cost - (customer?.points || 0)} pts</span> para desbloquear
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Button */}
                                            {canAfford && (
                                                <button
                                                    onClick={() => handleRedeem(reward)}
                                                    className="mt-6 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                                    <MessageCircle size={20} className="animate-bounce-slow" />
                                                    <span className="relative z-10 uppercase tracking-wide">Canjear Ahora</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
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
