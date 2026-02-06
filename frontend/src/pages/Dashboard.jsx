import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div
        onClick={onClick}
        className={`card-premium p-6 flex items-center justify-between hover:scale-[1.02] transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:shadow-urban-accent/10' : ''}`}
    >
        <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={24} className="currentColor" />
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If logged in but no business_id (and not loading), redirect to onboarding
        if (user && !user.business_id && !user.role?.includes('admin')) { // Assuming super admin might have bypass
            navigate('/onboarding');
        }
    }, [user, navigate]);

    // Fetch Dashboard Stats
    const { data: stats, isLoading: isLoadingStats, isError: isStatsError } = useQuery({
        queryKey: ['dashboardStats', user?.business_id],
        queryFn: async () => {
            console.log("Fetching stats for business:", user?.business_id);
            if (!user?.business_id) return { appointments: 0, customers: 0, points: 0, revenue: 0 };

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            // 1. Total Appointments
            const { count: appointmentsCount, error: appError } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', user.business_id);

            if (appError) console.error('Error fetching appointments count:', appError);

            // 2. Active Customers
            const { count: customersCount, error: custError } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', user.business_id);

            if (custError) console.error('Error fetching customers count:', custError);

            // 3. Points (Sum)
            const { data: customersData, error: pointsError } = await supabase
                .from('customers')
                .select('points')
                .eq('business_id', user.business_id);

            if (pointsError) console.error('Error fetching points:', pointsError);
            const totalPoints = customersData?.reduce((sum, c) => sum + (c.points || 0), 0) || 0;

            // 4. Monthly Revenue (Confirmed appointments in current month)
            const { data: revenueData, error: revError } = await supabase
                .from('appointments')
                .select(`
                     appointment_date,
                     services (price)
                 `)
                .eq('business_id', user.business_id)
                .eq('status', 'confirmed')
                .gte('appointment_date', startOfMonth)
                .lte('appointment_date', endOfMonth);

            if (revError) console.error('Error fetching revenue:', revError);

            const monthlyRevenue = revenueData?.reduce((sum, app) => {
                return sum + (app.services?.price || 0);
            }, 0) || 0;

            return {
                appointments: appointmentsCount || 0,
                customers: customersCount || 0,
                points: totalPoints,
                revenue: monthlyRevenue
            };
        },
        enabled: !!user?.business_id
    });

    // Fetch Recent Appointments
    const { data: recentAppointments, isLoading, isError } = useQuery({
        queryKey: ['recentAppointments', user?.business_id],
        queryFn: async () => {
            if (!user?.business_id) return [];

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    customers (first_name, last_name, email),
                    employees (first_name, last_name),
                    services (name, price)
                `)
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Error fetching appointments:', error);
                throw error;
            }
            return data;
        },
        enabled: !!user?.business_id
    });

    // Helper to safe format
    const formatCurrency = (val) => {
        if (val === undefined || val === null) return "$0";
        return `$${val.toLocaleString()}`;
    };

    const formatNumber = (val) => {
        if (val === undefined || val === null) return "0";
        return val.toLocaleString();
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Panel Principal</h1>
                    <p className="text-gray-400 mt-2">Bienvenido de nuevo, <span className="text-urban-accent">{user?.email}</span></p>
                </div>
                <div className="w-32 h-1 bg-gradient-to-r from-urban-accent to-transparent rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Citas Totales"
                    value={isLoadingStats ? "..." : formatNumber(stats?.appointments)}
                    icon={Calendar}
                    color="bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    onClick={() => navigate('/calendar')}
                />
                <StatCard
                    title="Clientes Activos"
                    value={isLoadingStats ? "..." : formatNumber(stats?.customers)}
                    icon={Users}
                    color="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    onClick={() => navigate('/customers')}
                />
                <StatCard
                    title="Puntos Otorgados"
                    value={isLoadingStats ? "..." : formatNumber(stats?.points)}
                    icon={Trophy}
                    color="bg-urban-secondary/20 text-urban-secondary border border-urban-secondary/30"
                    onClick={() => navigate('/gamification')}
                />
                <StatCard
                    title="Ingresos Mensuales"
                    value={isLoadingStats ? "..." : formatCurrency(stats?.revenue)}
                    icon={TrendingUp}
                    color="bg-urban-accent/20 text-urban-accent border border-urban-accent/30"
                    onClick={() => navigate('/reports')}
                />
            </div>

            <div className="card-premium p-8 border-t-4 border-t-urban-accent">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white">Citas Recientes en Tiempo Real</h3>
                    <button onClick={() => navigate('/calendar')} className="text-sm text-urban-accent hover:underline">Ver todas</button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-gray-500 animate-pulse">Cargando datos en vivo...</div>
                ) : recentAppointments?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase text-gray-400 border-b border-white/10">
                                <tr>
                                    <th className="px-4 py-4">Cliente</th>
                                    <th className="px-4 py-4">Servicio</th>
                                    <th className="px-4 py-4">Profesional</th>
                                    <th className="px-4 py-4">Fecha</th>
                                    <th className="px-4 py-4">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentAppointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-4 font-medium text-white group-hover:text-urban-accent transition-colors">
                                            {apt.customers?.first_name} {apt.customers?.last_name}
                                            <div className="text-gray-500 text-xs font-normal">{apt.customers?.email}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20">
                                                {apt.services?.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-400">
                                            {apt.employees ? apt.employees.first_name : 'Cualquiera'}
                                        </td>
                                        <td className="px-4 py-4 text-gray-400 font-mono text-xs">
                                            {apt.appointment_date} <span className="text-gray-600 mx-1">|</span> {apt.start_time?.slice(11, 16)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${apt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                apt.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {apt.status === 'confirmed' ? 'Confirmado' :
                                                    apt.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 rounded-xl border border-dashed border-white/10">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        No hay citas recientes registradas.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
