
import React from 'react';
import GlassCard from './GlassCard';
import { CreditCard, Download, AlertCircle } from 'lucide-react';

const BillingHistory = ({ payments = [] }) => {
    return (
        <GlassCard className="p-0">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard size={20} className="text-urban-accent" />
                    Historial de Pagos
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 bg-white/5 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Fecha</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Monto</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Método</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Estado</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-right">Factura</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No hay pagos registrados aún.
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-gray-300">
                                        {new Date(payment.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-white">
                                        ${payment.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 capitalize">
                                        {payment.provider}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${payment.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                payment.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            {payment.status === 'paid' ? 'Pagado' :
                                                payment.status === 'failed' ? 'Fallido' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {payment.status === 'paid' && (
                                            <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

export default BillingHistory;
