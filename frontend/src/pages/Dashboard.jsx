import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card-premium p-6 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
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
    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboardStats', user?.business_id],
        queryFn: async () => {
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
    const { data: recentAppointments, isLoading } = useQuery({
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

    // Example query (we might need a dashboard endpoint later, but for now lets just show static/user data)
    // TODO: Create /api/admin/dashboard-stats endpoint

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
                <p className="text-gray-500 mt-1">Bienvenido de nuevo, {user?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Citas Totales"
                    value={isLoadingStats ? "..." : stats?.appointments}
                    icon={Calendar}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Clientes Activos"
                    value={isLoadingStats ? "..." : stats?.customers}
                    icon={Users}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Puntos Otorgados"
                    value={isLoadingStats ? "..." : stats?.points?.toLocaleString()}
                    icon={Trophy}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Ingresos Mensuales"
                    value={isLoadingStats ? "..." : `$${stats?.revenue?.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-orange-500"
                />
            </div>

            <div className="card-premium p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Citas Recientes</h3>

                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Cargando...</div>
                ) : recentAppointments?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Cliente</th>
                                    <th className="px-4 py-3">Servicio</th>
                                    <th className="px-4 py-3">Profesional</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3 rounded-r-lg">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentAppointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4 font-medium text-gray-900">
                                            {apt.customers?.first_name} {apt.customers?.last_name}
                                            <div className="text-gray-400 text-xs font-normal">{apt.customers?.email}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold border border-blue-100">
                                                {apt.services?.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {apt.employees ? apt.employees.first_name : 'Cualquiera'}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {apt.appointment_date} <span className="text-gray-400 mx-1">•</span> {apt.start_time?.slice(11, 16)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${apt.status === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                apt.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
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
                    <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        No hay citas recientes.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
