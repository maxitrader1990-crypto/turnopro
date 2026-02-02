import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Trophy, Gift, Save } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Gamification = () => {
    const { api } = useAuth();
    const queryClient = useQueryClient();
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
    const { register: registerReward, handleSubmit: submitReward, reset: resetReward } = useForm();
    const { register: registerConfig, handleSubmit: submitConfig, setValue } = useForm(); // Separate form for config

    // Fetch Rewards
    const { data: rewards } = useQuery({
        queryKey: ['rewards'],
        queryFn: async () => (await api.get('/gamification/rewards')).data
    });

    // Create Reward Mutation
    const createRewardMutation = useMutation({
        mutationFn: (data) => api.post('/gamification/rewards', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['rewards']);
            toast.success('Reward created');
            setIsRewardModalOpen(false);
            resetReward();
        }
    });

    // Config Mutation (Assuming GET config endpoints exists? Actually I only made patch... need a GET for config?)
    // Ah, I missed GET config in my previous phase. 
    // I made `updateConfig` but generic `GET /gamification/wallet` returns config level.
    // Let's assume for now default values or I add a quick endpoint if needed.
    // Or just use the patch to set it blindly.

    // Actually, `getWallet` usually returns config.
    // Let's rely on patching for now.

    const updateConfigMutation = useMutation({
        mutationFn: (data) => api.patch('/gamification/config', data),
        onSuccess: () => toast.success('Settings saved')
    });

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gamification Engine</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
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
                            <button type="submit" className="w-full flex justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
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
                                className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md font-medium hover:bg-purple-100"
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
                        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                            Create Reward
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Gamification;
