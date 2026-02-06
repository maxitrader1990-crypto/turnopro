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
                    value="1,240"
                    icon={Calendar}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Clientes Activos"
                    value="850"
                    icon={Users}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Puntos Otorgados"
                    value="45,200"
                    icon={Trophy}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Ingresos Mensuales"
                    value="$12,450"
                    icon={TrendingUp}
                    color="bg-orange-500"
                />
            </div>

            <div className="card-premium p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Citas Recientes</h3>
                <div className="text-center py-10 text-gray-400">
                    Próximamente...
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
