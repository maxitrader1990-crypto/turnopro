import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Trophy, Gift, Save, Share2, Copy, ExternalLink } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Gamification = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const { register: registerReward, handleSubmit: submitReward, reset: resetReward } = useForm();
    const { register: registerConfig, handleSubmit: submitConfig, setValue } = useForm();

    const { data: rewards } = useQuery({
        queryKey: ['rewards', user?.business_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rewards')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_active', true)
                .order('points_cost', { ascending: true });
            if (error) throw error;
            return { data };
        },
        enabled: !!user?.business_id
    });

    const createRewardMutation = useMutation({
        mutationFn: async (data) => {
            const { error } = await supabase
                .from('rewards')
                .insert({
                    ...data,
                    business_id: user.business_id,
                    is_active: true
                });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['rewards']);
            toast.success('Reward created');
            setIsRewardModalOpen(false);
            resetReward();
        },
        onError: (err) => toast.error('Error: ' + err.message)
    });

    const updateConfigMutation = useMutation({
        mutationFn: async (data) => {
            const { error } = await supabase
                .from('gamification_config')
                .upsert({
                    business_id: user.business_id,
                    points_per_visit: data.points_per_visit,
                }, { onConflict: 'business_id' });
            if (error) throw error;
        },
        onSuccess: () => toast.success('Settings saved'),
        onError: (err) => toast.error('Error: ' + err.message)
    });

    const loadStrategyMutation = useMutation({
        mutationFn: async () => {
            const recommendedRewards = [
                {
                    business_id: user.business_id,
                    name: '🥤 Gaseosa/Cerveza de Cortesía',
                    description: '¡Refresca tu corte! Canjeable en tu próxima visita.',
                    points_cost: 100,
                    type: 'product',
                    is_active: true
                },
                {
                    business_id: user.business_id,
                    name: '💈 20% OFF en Barba',
                    description: 'Dale estilo a tu barba con un descuento exclusivo.',
                    points_cost: 300,
                    type: 'service',
                    is_active: true
                },
                {
                    business_id: user.business_id,
                    name: '✂️ Corte Clásico GRATIS',
                    description: 'Tu fidelidad tiene premio. Un corte completo sin cargo.',
                    points_cost: 1000,
                    type: 'service',
                    is_active: true
                },
                {
                    business_id: user.business_id,
                    name: '👑 Experiencia King (Completa)',
                    description: 'Corte + Barba + Masaje + Bebida Premium.',
                    points_cost: 1500,
                    type: 'experience',
                    is_active: true
                }
            ];

            const { error } = await supabase.from('rewards').insert(recommendedRewards);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['rewards']);
            toast.success('¡Estrategia Cargada con Éxito!');
        },
        onError: (err) => toast.error('Error: ' + err.message)
    });

    return (
        <div className="animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-6 uppercase tracking-widest drop-shadow-md flex items-center gap-3">
                <Trophy className="text-urban-accent animate-pulse-slow" /> Gamification Engine
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Share Link Card - VIP Pass Style */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-urban-secondary to-purple-900 p-6 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-white/20 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-urban-accent/20 rounded-full blur-xl -ml-5 -mb-5 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Share2 className="text-white/80" size={20} />
                                <h2 className="text-xl font-bold tracking-wide">PORTAL DE CLIENTES</h2>
                            </div>
                            <p className="text-purple-100 text-sm mb-6 font-light">
                                Tu enlace exclusivo para que los clientes consulten su nivel y puntos.
                            </p>

                            <div className="bg-black/30 backdrop-blur-md p-4 rounded-xl flex items-center justify-between gap-3 mb-4 border border-white/10 group-hover:border-urban-accent/50 transition-colors">
                                <code className="text-xs truncate font-mono text-urban-accent">
                                    {`${window.location.origin}/points/${user?.subdomain || user?.business_id}`}
                                </code>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/points/${user?.subdomain || user?.business_id}`);
                                        toast.success('Enlace copiado!');
                                    }}
                                    className="flex-1 bg-white text-urban-secondary py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Copy size={16} /> Copiar
                                </button>
                                <a
                                    href={`/points/${user?.subdomain || user?.business_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center justify-center backdrop-blur-sm"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-6 bg-urban-accent rounded-sm"></span>
                                Reglas del Juego
                            </h2>
                        </div>
                        <form onSubmit={submitConfig((data) => updateConfigMutation.mutate(data))} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Puntos por Visita</label>
                                <input
                                    type="number"
                                    {...registerConfig('points_per_visit', { valueAsNumber: true })}
                                    className="w-full input-urban"
                                    placeholder="e.j. 100"
                                />
                                <p className="text-xs text-gray-500 mt-2">Puntos base otorgados automáticamente al finalizar un servicio.</p>
                            </div>
                            <button type="submit" className="w-full btn-urban flex justify-center items-center gap-2">
                                <Save size={18} /> Guardar Configuración
                            </button>
                        </form>
                    </div>
                </div>

                {/* Rewards Panel */}
                <div className="lg:col-span-2">
                    <div className="card-premium h-full border border-white/10">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Gift className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Catálogo de Recompensas</h2>
                                    <p className="text-xs text-gray-400">Gestiona los premios canjeables</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRewardModalOpen(true)}
                                className="btn-ghost-dark text-sm py-2 px-4 shadow-none text-urban-accent border border-urban-accent/30 hover:bg-urban-accent/10"
                            >
                                + Nuevo Premio
                            </button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {rewards?.data?.length === 0 && (
                                <div className="p-12 text-center flex flex-col items-center justify-center animate-fade-in">
                                    <div className="w-20 h-20 bg-urban-accent/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                                        <Gift className="w-10 h-10 text-urban-accent" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">¡Tu Catálogo está vacío!</h3>
                                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                                        Invoca nuestra Estrategia Ganadora: 4 premios diseñados para fidelizar desde la primera visita (incluye la Gaseosa Gratis).
                                    </p>
                                    <button
                                        onClick={() => loadStrategyMutation.mutate()}
                                        disabled={loadStrategyMutation.isPending}
                                        className="btn-urban relative overflow-hidden group px-8 py-3 w-fit mx-auto"
                                    >
                                        {loadStrategyMutation.isPending ? 'Conjurando Estrategia...' : '✨ Cargar Estrategia Recomendada'}
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                                    </button>
                                </div>
                            )}
                            {rewards?.data?.map(reward => (
                                <div key={reward.id} className="p-6 flex justify-between items-center hover:bg-white/5 transition-all group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-800 to-black border border-white/10 flex items-center justify-center text-xl shadow-inner">
                                            {reward.type === 'product' ? '🎁' : reward.type === 'experience' ? '✨' : '✂️'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-200 text-lg group-hover:text-urban-accent transition-colors">{reward.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-1 bg-urban-accent/10 border border-urban-accent/20 px-3 py-1 rounded-full">
                                            <span className="text-urban-accent font-bold">{reward.points_cost}</span>
                                            <span className="text-urban-accent/70 text-xs font-bold uppercase">XP</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2 font-mono">Stock: {reward.stock ?? '∞'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Reward Modal */}
            <Modal isOpen={isRewardModalOpen} onClose={() => setIsRewardModalOpen(false)} title="Crear Recompensa Legendaria">
                <form onSubmit={submitReward((data) => createRewardMutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Premio</label>
                        <input {...registerReward('name', { required: true })} className="mt-1 block w-full p-2 border rounded-md" placeholder="ej. Corte Gratis VIP" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción Épica</label>
                        <input {...registerReward('description')} className="mt-1 block w-full p-2 border rounded-md" placeholder="Describe lo increíble que es este premio..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Costo en XP (Puntos)</label>
                            <input type="number" {...registerReward('points_cost', { required: true, valueAsNumber: true })} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stock (Opcional)</label>
                            <input type="number" {...registerReward('stock', { valueAsNumber: true })} className="mt-1 block w-full p-2 border rounded-md" placeholder="Vacío para infinito" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Recompensa</label>
                        <select {...registerReward('type')} className="mt-1 block w-full p-2 border rounded-md">
                            <option value="service">Servicio Gratis</option>
                            <option value="product">Producto</option>
                            <option value="experience">Experiencia VIP</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="btn-urban w-full">
                            Invocar Recompensa
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Gamification;
