import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState('month'); // 'month' | 'year'

    // Fetch Revenue Data
    const { data: revenueData, isLoading: loadingRevenue } = useQuery({
        queryKey: ['revenueStats', user?.business_id, dateRange],
        queryFn: async () => {
            if (!user?.business_id) return [];

            // Logic to fetch confirmed appointments and aggregate by date
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    appointment_date,
                    services (price)
                `)
                .eq('business_id', user.business_id)
                .eq('status', 'confirmed')
                .order('appointment_date', { ascending: true });

            if (error) throw error;

            // Simple aggregation (mocking better aggregation for now)
            const aggregated = {};
            data.forEach(app => {
                const date = app.appointment_date;
                const price = app.services?.price || 0;
                if (!aggregated[date]) aggregated[date] = 0;
                aggregated[date] += price;
            });

            return Object.keys(aggregated).map(date => ({
                date,
                revenue: aggregated[date]
            }));
        }
    });

    // Fetch Employee Stats
    const { data: employeeStats, isLoading: loadingEmployees } = useQuery({
        queryKey: ['employeeStats', user?.business_id],
        queryFn: async () => {
            if (!user?.business_id) return [];

            // 1. Get all employees
            const { data: employees } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('business_id', user.business_id);

            if (!employees) return [];

            // 2. Get appointments for these employees
            const stats = await Promise.all(employees.map(async (emp) => {
                const { data: apps } = await supabase
                    .from('appointments')
                    .select('services(price)')
                    .eq('employee_id', emp.id)
                    .eq('status', 'confirmed');

                const count = apps?.length || 0;
                const total = apps?.reduce((sum, a) => sum + (a.services?.price || 0), 0) || 0;
                return { ...emp, count, total };
            }));

            return stats.sort((a, b) => b.total - a.total);
        }
    });

    // CSV Export Handler
    const handleDownload = () => {
        if (!employeeStats) return;

        const headers = ['Nombre', 'Apellido', 'Cortes Realizados', 'Ingresos Generados'];
        const rows = employeeStats.map(e => [e.first_name, e.last_name, e.count, e.total]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "reporte_empleados.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Informe descargado");
    };

    return (
        <div className="animate-fade-in-up space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <TrendingUp className="text-urban-accent" />
                        Reportes Financieros
                    </h1>
                    <p className="text-gray-400 mt-2">Métricas detalladas y rendimiento del equipo.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="btn-ghost-dark flex items-center gap-2 border border-white/10 hover:bg-white/5"
                    >
                        <Download size={18} /> Descargar CSV
                    </button>
                    <select
                        className="bg-black/30 border border-white/20 text-white rounded-xl px-4 py-2 outline-none focus:border-urban-accent"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="month">Este Mes</option>
                        <option value="year">Este Año</option>
                    </select>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 card-premium p-6 min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <DollarSign className="text-green-400" /> Ingresos en el Tiempo
                    </h3>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#fbbf24" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="space-y-6">
                    <div className="card-premium p-6 bg-gradient-to-br from-urban-card-bg to-green-900/10 border-l-4 border-l-green-500">
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Ingresos Totales (Periodo)</p>
                        <h2 className="text-4xl font-black text-white mt-2">
                            ${revenueData?.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString() || 0}
                        </h2>
                    </div>
                    <div className="card-premium p-6 bg-gradient-to-br from-urban-card-bg to-blue-900/10 border-l-4 border-l-blue-500">
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Cortes Realizados</p>
                        <h2 className="text-4xl font-black text-white mt-2">
                            {employeeStats?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Employee Performance Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-blue-400" /> Rendimiento por Profesional
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold border-b border-white/10">Profesional</th>
                                <th className="p-4 font-bold border-b border-white/10 text-center">Cortes / Citas</th>
                                <th className="p-4 font-bold border-b border-white/10 text-right">Ingresos Generados</th>
                                <th className="p-4 font-bold border-b border-white/10 text-right">Eficiencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                            {employeeStats?.map((emp, index) => (
                                <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-500 text-black shadow-glow-gold' : 'bg-gray-700'}`}>
                                            {index + 1}
                                        </div>
                                        {emp.first_name} {emp.last_name}
                                    </td>
                                    <td className="p-4 text-center font-bold">{emp.count}</td>
                                    <td className="p-4 text-right font-mono text-urban-accent font-bold">${emp.total.toLocaleString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="w-24 ml-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min(100, (emp.count / 50) * 100)}%` }} // Arbitrary goal of 50 cuts
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {employeeStats?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">No hay datos registrados aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
