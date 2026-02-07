import React from 'react';
import { Users, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

const SuperAdminDashboard = () => {
    return (
        <div className="animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
            <p className="text-gray-400 mb-8">Visión global de TurnoPro SaaS.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Barberías', value: '0', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Ingresos MRR', value: '$0', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
                    { label: 'Suscripciones Activas', value: '0', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                    { label: 'En Riesgo (Vencidas)', value: '0', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">Gráfico de Crecimiento (Próximamente)</p>
                </div>
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 min-h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">Actividad Reciente (Próximamente)</p>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
