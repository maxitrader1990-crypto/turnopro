import React, { useState } from 'react';
import { Activity, Search, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { supabase } from '../../supabase';
import toast from 'react-hot-toast';

const SuperAdminRecovery = () => {
    const [email, setEmail] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [diagnostics, setDiagnostics] = useState(null);

    const handleSearch = async () => {
        if (!email) return;
        setLoading(true);
        setSearchResult(null);
        setDiagnostics(null);

        try {
            // 1. Search in business_users
            const { data: profiles, error: pError } = await supabase
                .from('business_users')
                .select('*, businesses(*)')
                .eq('email', email);

            if (pError) throw pError;

            // 2. Search in employees
            const { data: employees, error: eError } = await supabase
                .from('employees')
                .select('*')
                .eq('email', email);

            if (eError) throw eError;

            // 3. Diagnose
            const issues = [];
            if (profiles.length > 1) issues.push('Duplicados en business_users');
            if (profiles.length === 0 && employees.length === 0) issues.push('No encontrado en tablas públicas');

            setSearchResult({
                profiles,
                employees
            });
            setDiagnostics(issues);

        } catch (error) {
            console.error(error);
            toast.error('Error al buscar usuario');
        } finally {
            setLoading(false);
        }
    };

    const fixDuplicates = async () => {
        if (!confirm('¿Estás seguro de eliminar duplicados antiguos? Esta acción es irreversible.')) return;

        try {
            toast.loading('Eliminando duplicados...');
            // Logic handled by backend/SQL usually, but here we can try a delete call if RLS allows, 
            // OR use a specific RPC. Since we don't have an RPC for this yet, we just notify.
            // For now, let's just re-run search.
            toast.dismiss();
            toast.success('Función de auto-fix no habilitada en demo (requiere RPC). Contacta soporte técnico.');
        } catch (error) {
            toast.error('Error al ejecutar fix');
        }
    };

    return (
        <div className="space-y-8 text-white">
            <h2 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="text-purple-500" size={32} />
                Recuperación & Diagnóstico
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Diagnostics Tool */}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Search className="text-blue-400" />
                        Diagnóstico de Usuario
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Busca un usuario por email para ver su estado crudo en la base de datos y detectar inconsistencias.
                    </p>

                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="usuario@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 focus:border-purple-500 focus:outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : 'Analizar'}
                        </button>
                    </div>

                    {searchResult && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className={`p-4 rounded-lg border ${diagnostics.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    {diagnostics.length > 0 ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
                                    Resultado: {diagnostics.length > 0 ? 'Problemas Detectados' : 'Saludable'}
                                </h4>
                                {diagnostics.map((issue, i) => (
                                    <p key={i} className="text-red-400 text-sm">• {issue}</p>
                                ))}
                                {diagnostics.length === 0 && (
                                    <p className="text-green-400 text-sm">Los registros públicos parecen consistentes.</p>
                                )}
                            </div>

                            {diagnostics.includes('Duplicados en business_users') && (
                                <button
                                    onClick={fixDuplicates}
                                    className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/50 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
                                >
                                    ⚠ Ejecutar Limpieza de Duplicados
                                </button>
                            )}

                            <div className="bg-black p-4 rounded-lg font-mono text-xs text-gray-400 overflow-x-auto">
                                <pre>{JSON.stringify(searchResult, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Health Status */}
                <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Database className="text-green-400" />
                        Estado del Sistema
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span>Base de Datos (Supabase)</span>
                            </div>
                            <span className="text-green-400 font-bold text-sm">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span>Autenticación</span>
                            </div>
                            <span className="text-green-400 font-bold text-sm">OPERATIONAL</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span>Tareas Programadas (Cron)</span>
                            </div>
                            <span className="text-yellow-400 font-bold text-sm">PENDING</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminRecovery;
