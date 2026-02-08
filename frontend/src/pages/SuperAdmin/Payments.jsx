import React, { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

const SuperAdminPayments = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeSubscriptions: 0,
        pendingPayments: 0
    });
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinancialData();
    }, []);

    const fetchFinancialData = async () => {
        try {
            setLoading(true);

            // 1. Fetch KPI Stats
            // Revenue (Sum of all completed payments)
            const { data: revenueData, error: revError } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'completed');

            if (revError) throw revError;
            const totalRevenue = revenueData.reduce((acc, curr) => acc + (curr.amount || 0), 0);

            // Active Subs
            const { count: activeSubs, error: subError } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            if (subError) throw subError;

            // 2. Fetch Recent Transactions
            const { data: recentPayments, error: payError } = await supabase
                .from('payments')
                .select('*, businesses(name)')
                .order('created_at', { ascending: false })
                .limit(20);

            if (payError) throw payError;

            setStats({
                totalRevenue,
                activeSubscriptions: activeSubs || 0,
                pendingPayments: 0 // Placeholder
            });
            setPayments(recentPayments || []);

        } catch (error) {
            console.error('Error fetching financial data:', error);
            toast.error('Error al cargar datos financieros');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-purple-500">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8 text-white">
            <h2 className="text-3xl font-bold flex items-center gap-3">
                <CreditCard className="text-purple-500" size={32} />
                Pagos & Finanzas
            </h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <DollarSign className="text-green-400" size={24} />
                        </div>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                            <TrendingUp size={12} /> +12.5%
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">Ingresos Totales</p>
                    <h3 className="text-3xl font-black mt-1">
                        ${stats.totalRevenue.toLocaleString()}
                    </h3>
                </div>

                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <CreditCard className="text-blue-400" size={24} />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">Suscripciones Activas</p>
                    <h3 className="text-3xl font-black mt-1">{stats.activeSubscriptions}</h3>
                </div>

                <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl">
                            <Calendar className="text-yellow-400" size={24} />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm">Pagos Pendientes</p>
                    <h3 className="text-3xl font-black mt-1">{stats.pendingPayments}</h3>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Transacciones Recientes</h3>
                    <button className="text-sm text-purple-400 hover:text-purple-300">Ver Todo</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium">Negocio</th>
                                <th className="p-4 font-medium">Fecha</th>
                                <th className="p-4 font-medium">Monto</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium">Método</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No hay transacciones registradas.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm font-medium">
                                            {payment.businesses?.name || 'Desconocido'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {new Date(payment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm font-bold">
                                            ${payment.amount?.toLocaleString()} {payment.currency}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold
                                                ${payment.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                                    payment.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-red-500/10 text-red-400'}`}>
                                                {payment.status === 'completed' ? 'Completado' :
                                                    payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 capitalize">
                                            {payment.payment_method || 'Tarjeta'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminPayments;
