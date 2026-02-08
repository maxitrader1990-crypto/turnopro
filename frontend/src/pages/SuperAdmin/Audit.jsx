import React, { useEffect, useState } from 'react';
import { FileText, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

const SuperAdminAudit = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error('Error al cargar logs de auditoría');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 text-white h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <FileText className="text-purple-500" size={32} />
                    Audit Logs
                </h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar acción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
                        />
                    </div>
                    <button className="bg-[#111] border border-white/10 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-[#111] rounded-2xl border border-white/10 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0a0a0a] z-10 shadow-sm">
                            <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium">Timestamp</th>
                                <th className="p-4 font-medium">Acción</th>
                                <th className="p-4 font-medium">Usuario (ID)</th>
                                <th className="p-4 font-medium">Detalles</th>
                                <th className="p-4 font-medium">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-purple-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" />
                                        Cargando logs...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} />
                                            <p>No se encontraron registros de auditoría.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors font-mono text-sm">
                                        <td className="p-4 text-gray-400 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-bold text-purple-400">
                                            {log.action}
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs" title={log.user_id}>
                                            {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                                        </td>
                                        <td className="p-4 text-gray-300 max-w-xs truncate">
                                            {JSON.stringify(log.details)}
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs">
                                            {log.ip_address || '-'}
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

export default SuperAdminAudit;
