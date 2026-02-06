import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Search, User, Award, Calendar, Gift, X } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const Customers = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);

    // Fetch Customers
    const { data: customers, isLoading } = useQuery({
        queryKey: ['customers', user?.business_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', user.business_id)
                .order('first_name', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.business_id
    });

    // Fetch Rewards
    const { data: rewards } = useQuery({
        queryKey: ['rewards', user?.business_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('rewards')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_active', true)
                .order('points_cost', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!user?.business_id && isRedeemModalOpen
    });

    // Redeem Mutation
    const redeemMutation = useMutation({
        mutationFn: async ({ customerId, reward }) => {
            // 1. Check points again just in case
            const { data: cust } = await supabase.from('customers').select('points').eq('id', customerId).single();
            if (cust.points < reward.points_cost) throw new Error("Puntos insuficientes");

            // 2. Insert Redemption
            const { error: rErr } = await supabase.from('redemptions').insert({
                business_id: user.business_id,
                customer_id: customerId,
                reward_id: reward.id,
                points_cost: reward.points_cost,
                redeemed_at: new Date().toISOString()
            });
            if (rErr) throw rErr;

            // 3. Deduct Points
            const { error: uErr } = await supabase
                .from('customers')
                .update({ points: cust.points - reward.points_cost })
                .eq('id', customerId);
            if (uErr) throw uErr;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('¡Recompensa canjeada!');
            setIsRedeemModalOpen(false);
            setSelectedCustomer(null);
        },
        onError: (err) => toast.error(err.message)
    });

    const list = customers || [];
    const filteredList = list.filter(c =>
        c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getLevelBadge = (points) => {
        if (points >= 500) return <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full font-bold border border-cyan-200">💎 Diamante</span>;
        if (points >= 250) return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold border border-yellow-200">🥇 Oro</span>;
        if (points >= 100) return <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full font-bold border border-gray-300">🥈 Plata</span>;
        return <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold border border-orange-200">🥉 Bronce</span>;
    };

    const handleOpenRedeem = (customer) => {
        setSelectedCustomer(customer);
        setIsRedeemModalOpen(true);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500 text-sm">Base de datos, puntos y canjes.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div></td></tr>
                        ) : filteredList.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No se encontraron clientes.</td></tr>
                        ) : (
                            filteredList.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                {customer.first_name?.[0] || '?'}{customer.last_name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{customer.first_name} {customer.last_name}</div>
                                                <div className="mt-1">{getLevelBadge(customer.points || 0)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.email}</div>
                                        <div className="text-xs text-gray-500">{customer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1 font-bold text-purple-700">
                                            <Award size={16} />
                                            {customer.points || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.total_visits || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenRedeem(customer)}
                                            className="btn-primary px-3 py-1 text-xs shadow-md flex items-center gap-1 ml-auto"
                                        >
                                            <Gift size={14} /> Canjear
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Redeem Modal */}
            <Modal isOpen={isRedeemModalOpen} onClose={() => setIsRedeemModalOpen(false)} title="Canjear Recompensa">
                {selectedCustomer && (
                    <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-lg flex justify-between items-center border border-purple-100">
                            <div>
                                <p className="text-sm text-purple-900 font-medium">Puntos Disponibles</p>
                                <p className="text-2xl font-bold text-purple-700">{selectedCustomer.points}</p>
                            </div>
                            <Award className="text-purple-300 w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900">Recompensas Disponibles</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                {rewards?.length === 0 && <p className="text-sm text-gray-500">No hay recompensas configuradas.</p>}
                                {rewards?.map(reward => {
                                    const canAfford = selectedCustomer.points >= reward.points_cost;
                                    return (
                                        <div key={reward.id} className={`p-3 border rounded-lg flex justify-between items-center ${canAfford ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                            <div>
                                                <p className="font-bold text-gray-800">{reward.name}</p>
                                                <p className="text-xs text-gray-500">{reward.points_cost} puntos</p>
                                            </div>
                                            <button
                                                onClick={() => redeemMutation.mutate({ customerId: selectedCustomer.id, reward })}
                                                disabled={!canAfford || redeemMutation.isPending}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${canAfford
                                                    ? 'btn-primary'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {redeemMutation.isPending ? '...' : 'Canjear'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Customers;
