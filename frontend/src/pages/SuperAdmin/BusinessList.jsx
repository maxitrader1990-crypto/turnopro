import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { Search, Eye, Power, PowerOff, Calendar, MoreVertical, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';
import 'moment/locale/es';

const BusinessList = () => {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    // Fetch all businesses with subscription data
    const { data: businesses, isLoading } = useQuery({
        queryKey: ['admin_businesses'],
        queryFn: async () => {
            // Join businesses with subscriptions and owners
            // Note: Since Supabase returns object structure, we might need a raw query or careful selection

            // 1. Get Businesses
            const { data: bizData, error: bizError } = await supabase
                .from('businesses')
                .select('*, subscriptions(*), business_users(email, first_name, last_name)')
                .order('created_at', { ascending: false });

            if (bizError) throw bizError;
            return bizData;
        }
    });

    // Toggle Status Mutation (Suspend/Activate)
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ businessId, currentStatus }) => {
            // Need to update subscription status actually, or business status if you have one
            // Assuming subscription status controls access
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

            const { error } = await supabase
                .from('subscriptions')
                .update({ status: newStatus })
                .eq('business_id', businessId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin_businesses']);
            toast.success('Estado actualizado');
        },
        onError: (err) => toast.error('Error: ' + err.message)
    });

    const filtered = businesses?.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.subdomain?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const getStatusBadge = (sub) => {
        const status = sub?.status || 'inactive';
        const styles = {
            active: 'bg-green-500/10 text-green-400 border-green-500/20',
            trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            expired: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
            inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
        const labels = {
            active: 'ACTIVO',
            trial: 'PRUEBA',
            expired: 'VENCIDO',
            suspended: 'SUSPENDIDO',
            inactive: 'INACTIVO'
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-bold border ${styles[status] || styles.inactive}`}>
                {labels[status] || status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Barberías</h1>
                    <p className="text-gray-400">Gestión total de clientes SaaS.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar barbería..."
                        className="input-urban pl-10 w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card-premium overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-500 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">Nombre / Dominio</th>
                            <th className="p-4 font-medium">Dueño</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Plan</th>
                            <th className="p-4 font-medium">Vencimiento</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">Cargando...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">No se encontraron barberías.</td></tr>
                        ) : (
                            filtered.map((biz) => {
                                const sub = biz.subscriptions?.[0] || {}; // Assuming one sub per biz mostly
                                return (
                                    <tr key={biz.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-bold text-white">{biz.name}</p>
                                            <p className="text-xs text-gray-500">{biz.subdomain || 'Sin subdominio'}</p>
                                        </td>
                                        <td className="p-4">
                                            {biz.business_users?.[0] ? (
                                                <>
                                                    <p className="text-gray-300 text-sm">{biz.business_users[0].first_name}</p>
                                                    <p className="text-xs text-gray-500">{biz.business_users[0].email}</p>
                                                </>
                                            ) : <span className="text-gray-600 italic">Sin asignar</span>}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(sub)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-300 capitalize">
                                            {sub?.plan_type || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {sub?.current_period_end
                                                ? moment(sub.current_period_end).locale('es').format('D MMM YYYY')
                                                : '-'
                                            }
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button title="Ver Detalle" className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                                                    <Eye size={18} />
                                                </button>
                                                {sub.status === 'active' || sub.status === 'trial' ? (
                                                    <button
                                                        onClick={() => toggleStatusMutation.mutate({ businessId: biz.id, currentStatus: sub.status })}
                                                        title="Suspender"
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300"
                                                    >
                                                        <PowerOff size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => toggleStatusMutation.mutate({ businessId: biz.id, currentStatus: sub.status })}
                                                        title="Activar"
                                                        className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 hover:text-green-300"
                                                    >
                                                        <Power size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BusinessList;
