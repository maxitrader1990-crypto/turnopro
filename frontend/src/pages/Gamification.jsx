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

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gamification Engine</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Share Link Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                            <Share2 className="text-purple-200" />
                            <h2 className="text-lg font-bold">Portal de Clientes</h2>
                        </div>
                        <p className="text-purple-100 text-sm mb-4">
                            Comparte este enlace con tus clientes para que consulten sus puntos.
                        </p>

                        <div className="bg-white/10 p-3 rounded-lg flex items-center justify-between gap-2 mb-3 border border-white/20">
                            <code className="text-xs truncate font-mono text-purple-50">
                                {`${window.location.origin}/points/${user?.subdomain || user?.business_id}`}
                            </code>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/points/${user?.subdomain || user?.business_id}`);
                                    toast.success('Enlace copiado!');
                                }}
                                className="flex-1 bg-white text-purple-700 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Copy size={16} /> Copiar
                            </button>
                            <a
                                href={`/points/${user?.subdomain || user?.business_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center"
                            >
                                <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="text-yellow-500" />
                            <h2 className="text-lg font-bold text-gray-900">Rules & Points</h2>
                        </div>
                        <form onSubmit={submitConfig((data) => updateConfigMutation.mutate(data))} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Points per Visit</label>
                                <input
                                    type="number"
                                    {...registerConfig('points_per_visit', { valueAsNumber: true })}
                                    className="mt-1 block w-full p-2 border rounded-md"
                                    placeholder="e.g. 100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Base points awarded when a service has no specific points.</p>
                            </div>
                            <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2">
                                <Save size={18} /> Save Settings
                            </button>
                        </form>
                    </div>
                </div>

                {/* Rewards Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Gift className="text-purple-500" />
                                <h2 className="text-lg font-bold text-gray-900">Rewards Catalog</h2>
                            </div>
                            <button
                                onClick={() => setIsRewardModalOpen(true)}
                                className="btn-secondary text-sm py-2 px-4 shadow-none border-purple-100 text-purple-700 hover:bg-purple-50"
                            >
                                + New Reward
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {rewards?.data?.length === 0 && <p className="p-6 text-gray-500 text-center">No rewards configured.</p>}
                            {rewards?.data?.map(reward => (
                                <div key={reward.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <p className="font-semibold text-gray-900">{reward.name}</p>
                                        <p className="text-sm text-gray-500">{reward.description} • Stock: {reward.stock ?? '∞'}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                                            {reward.points_cost} pts
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Reward Modal */}
            <Modal isOpen={isRewardModalOpen} onClose={() => setIsRewardModalOpen(false)} title="Create Reward">
                <form onSubmit={submitReward((data) => createRewardMutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input {...registerReward('name', { required: true })} className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input {...registerReward('description')} className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Points Cost</label>
                            <input type="number" {...registerReward('points_cost', { required: true, valueAsNumber: true })} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stock (Optional)</label>
                            <input type="number" {...registerReward('stock', { valueAsNumber: true })} className="mt-1 block w-full p-2 border rounded-md" placeholder="Leave empty for infinite" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select {...registerReward('type')} className="mt-1 block w-full p-2 border rounded-md">
                            <option value="service">Free Service</option>
                            <option value="product">Product</option>
                            <option value="experience">Experience</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="btn-primary">
                            Create Reward
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Gamification;
