import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Search, User, Award, Calendar, Gift, X, FileText, History, Save, Scissors, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import moment from 'moment';
import 'moment/locale/es';

const Customers = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
    const [isAddPointsOpen, setIsAddPointsOpen] = useState(false);
    const [pointsToAdd, setPointsToAdd] = useState(0);
    const [crmTab, setCrmTab] = useState('notes'); // 'overview' | 'notes' | 'history'
    const [notesBuffer, setNotesBuffer] = useState('');

    // Fetch Customers
    const { data: customers, isLoading } = useQuery({
        queryKey: ['customers', user?.business_id],
        queryFn: async () => {
            // Optimistically try to fetch 'notes' too. If it fails, supabase might ignore or error, handling gracefully?
            // Actually supabase js just return null for missing columns if not strictly typed, usually. 
            // We'll select * which includes notes if it exists.
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

    // Fetch Customer History (Appointments)
    const { data: history, isLoading: loadingHistory } = useQuery({
        queryKey: ['customerHistory', selectedCustomer?.id],
        queryFn: async () => {
            if (!selectedCustomer) return [];
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    services (name, price),
                    employees (first_name)
                `)
                .eq('customer_id', selectedCustomer.id)
                .order('appointment_date', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!selectedCustomer?.id && isCRMModalOpen
    });

    // Fetch Rewards for Redeem
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
            const { data: cust } = await supabase.from('customers').select('points').eq('id', customerId).single();
            if (cust.points < reward.points_cost) throw new Error("Puntos insuficientes");

            const { error: rErr } = await supabase.from('redemptions').insert({
                business_id: user.business_id,
                customer_id: customerId,
                reward_id: reward.id,
                points_cost: reward.points_cost,
                redeemed_at: new Date().toISOString()
            });
            if (rErr) throw rErr;

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

    // Update Notes Mutation
    const updateNotesMutation = useMutation({
        mutationFn: async ({ customerId, notes }) => {
            const { error } = await supabase
                .from('customers')
                .update({ notes: notes }) // This requires 'notes' column to exist
                .eq('id', customerId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('Ficha técnica actualizada');
        },
        onError: (err) => toast.error('Error guardando notas: ' + err.message)
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

    const handleOpenCRM = (customer) => {
        setSelectedCustomer(customer);
        setNotesBuffer(customer.notes || '');
        setCrmTab('notes');
        setIsCRMModalOpen(true);
    };

    const handleOpenAddPoints = (customer) => {
        setSelectedCustomer(customer);
        setPointsToAdd(0);
        setIsAddPointsOpen(true);
    };

    const addPointsMutation = useMutation({
        mutationFn: async ({ customerId, points }) => {
            const { data: cust } = await supabase.from('customers').select('points').eq('id', customerId).single();
            const newPoints = (cust.points || 0) + parseInt(points);
            const { error } = await supabase.from('customers').update({ points: newPoints }).eq('id', customerId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['customers']);
            toast.success('Puntos actualizados');
            setIsAddPointsOpen(false);
            setPointsToAdd(0);
        },
        onError: (err) => toast.error(err.message)
    });

    const saveNotes = () => {
        if (selectedCustomer) {
            updateNotesMutation.mutate({ customerId: selectedCustomer.id, notes: notesBuffer });
        }
    };

    return (
        <div className="pb-10 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Cartera de Clientes</h1>
                    <p className="text-gray-400 text-sm">Gestiona perfiles, historial y fidelización.</p>
                </div>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl focus:border-urban-accent focus:ring-1 focus:ring-urban-accent w-full text-white placeholder-gray-500 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Puntos</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Visitas</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urban-accent mx-auto"></div></td></tr>
                            ) : filteredList.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">No se encontraron clientes.</td></tr>
                            ) : (
                                (Array.isArray(filteredList) ? filteredList : []).map((customer) => (
                                    <tr key={customer.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold mr-3 border border-white/10 shadow-lg">
                                                    {customer.first_name?.[0] || '?'}{customer.last_name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white group-hover:text-urban-accent transition-colors">{customer.first_name} {customer.last_name}</div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        {getLevelBadge(customer.points || 0)}
                                                        <span className="text-xs text-gray-500">{customer.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 font-bold text-urban-accent bg-urban-accent/10 px-2 py-1 rounded w-fit">
                                                <Award size={14} />
                                                {customer.points || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            <span className="font-mono text-white">{customer.total_visits || 0}</span> visitas
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenCRM(customer)}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                                    title="Ver Ficha Técnica"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenRedeem(customer)}
                                                    className="p-2 text-urban-accent hover:bg-urban-accent/10 rounded-lg transition-colors border border-transparent hover:border-urban-accent/30"
                                                    title="Canjear Puntos"
                                                >
                                                    <Gift size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAddPoints(customer)}
                                                    className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors border border-transparent hover:border-green-400/30"
                                                    title="Sumar Puntos Manualmente"
                                                >
                                                    <Award size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CRM / Technical Card Modal */}
            <Modal isOpen={isCRMModalOpen} onClose={() => setIsCRMModalOpen(false)} title="Ficha del Cliente">
                {selectedCustomer && (
                    <div className="h-[500px] flex flex-col">
                        {/* Header Profile */}
                        <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4">
                            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-2xl text-white font-bold shadow-xl">
                                {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{selectedCustomer.first_name} {selectedCustomer.last_name}</h2>
                                <p className="text-sm text-gray-500">{selectedCustomer.phone} • {selectedCustomer.email}</p>
                                <div className="mt-1 text-xs text-gray-400">
                                    Cliente desde {moment(selectedCustomer.created_at).locale('es').format('MMMM YYYY')}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setCrmTab('notes')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${crmTab === 'notes' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Scissors size={16} /> Ficha Técnica
                            </button>
                            <button
                                onClick={() => setCrmTab('history')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${crmTab === 'history' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <History size={16} /> Historial
                            </button>
                        </div>

                        {/* Content Area */}

                        {/* TECH NOTES TAB */}
                        {crmTab === 'notes' && (
                            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-3">
                                    <p className="text-xs text-yellow-800 flex items-center gap-2">
                                        <Award size={14} />
                                        <strong>Puntos: {selectedCustomer.points}</strong>
                                        (Nivel {selectedCustomer.points > 250 ? 'Oro' : 'Plata'})
                                    </p>
                                </div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preferencias y Notas Técnicas</label>
                                <textarea
                                    className="flex-1 w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium"
                                    placeholder="Ej. Corte Fade 0.5, Remolino en coronilla, usa cera mate..."
                                    value={notesBuffer}
                                    onChange={(e) => setNotesBuffer(e.target.value)}
                                ></textarea>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={saveNotes}
                                        disabled={updateNotesMutation.isPending}
                                        className="btn-primary flex items-center gap-2 px-6"
                                    >
                                        {updateNotesMutation.isPending ? 'Guardando...' : <><Save size={18} /> Guardar Ficha</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* HISTORY TAB */}
                        {crmTab === 'history' && (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                {loadingHistory ? (
                                    <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div></div>
                                ) : history?.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">Sin visitas previas.</div>
                                ) : (
                                    (Array.isArray(history) ? history : []).map((appt) => (
                                        <div key={appt.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">{appt.services?.name || 'Servicio'}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Clock size={12} />
                                                    {moment(appt.appointment_date).locale('es').format('D MMM YYYY')}
                                                    <span className="mx-1">•</span>
                                                    Barbero: {appt.employees?.first_name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${appt.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {appt.status === 'completed' ? 'Completado' : appt.status}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">${appt.services?.price}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Redeem Modal (Can kept simpler or reused) */}
            <Modal isOpen={isRedeemModalOpen} onClose={() => setIsRedeemModalOpen(false)} title="Canjear Recompensa">
                {selectedCustomer && (
                    <div className="space-y-4">
                        <div className="bg-urban-accent/10 p-4 rounded-lg flex justify-between items-center border border-urban-accent/20">
                            <div>
                                <p className="text-sm text-urban-accent font-medium">Puntos Disponibles</p>
                                <p className="text-2xl font-bold text-white">{selectedCustomer.points}</p>
                            </div>
                            <Award className="text-urban-accent w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-white">Recompensas Disponibles</h3>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {rewards?.length === 0 && <p className="text-sm text-gray-500">No hay recompensas configuradas.</p>}
                                {(Array.isArray(rewards) ? rewards : []).map(reward => {
                                    const canAfford = selectedCustomer.points >= reward.points_cost;
                                    return (
                                        <div key={reward.id} className={`p-3 border rounded-lg flex justify-between items-center ${canAfford ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                                            <div>
                                                <p className="font-bold text-white">{reward.name}</p>
                                                <p className="text-xs text-gray-400">{reward.points_cost} puntos</p>
                                            </div>
                                            <button
                                                onClick={() => redeemMutation.mutate({ customerId: selectedCustomer.id, reward })}
                                                disabled={!canAfford || redeemMutation.isPending}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${canAfford
                                                    ? 'bg-urban-accent text-black hover:scale-105'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
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

            {/* Add Points Modal */}
            <Modal isOpen={isAddPointsOpen} onClose={() => setIsAddPointsOpen(false)} title="Sumar Puntos Manualmente">
                {selectedCustomer && (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20 flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mb-2">
                                <Award className="text-green-400" size={32} />
                            </div>
                            <h3 className="text-white font-bold text-lg">{selectedCustomer.first_name} {selectedCustomer.last_name}</h3>
                            <p className="text-gray-400 text-sm">Saldo actual: <span className="text-white font-mono">{selectedCustomer.points || 0}</span> pts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Puntos a sumar</label>
                            <input
                                type="number"
                                value={pointsToAdd}
                                onChange={(e) => setPointsToAdd(e.target.value)}
                                className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-2xl font-mono text-center text-green-400 focus:outline-none focus:border-green-500"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Ingresa un valor negativo para restar puntos.
                            </p>
                        </div>

                        <button
                            onClick={() => addPointsMutation.mutate({ customerId: selectedCustomer.id, points: pointsToAdd })}
                            disabled={!pointsToAdd || pointsToAdd == 0 || addPointsMutation.isPending}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {addPointsMutation.isPending ? 'Procesando...' : 'Confirmar Recarga'}
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Customers;
