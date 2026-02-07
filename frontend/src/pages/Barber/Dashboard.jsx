import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { TrendingUp, Calendar, Scissors, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BarberDashboard = () => {
    const { user } = useAuth();

    // Fetch the Employee ID linked to this user
    const { data: employee } = useQuery({
        queryKey: ['myEmployeeProfile', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (error) return null;
            return data;
        },
        enabled: !!user?.id
    });

    // Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['barberStats', employee?.id],
        queryFn: async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Appointments this month
            const { count: countMonth } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('employee_id', employee.id)
                .gte('appointment_date', startOfMonth.toISOString());

            // Total completed appointments (all time)
            const { count: countTotal } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('employee_id', employee.id)
                .eq('status', 'completed');

            // Next appointment
            const { data: nextAppt } = await supabase
                .from('appointments')
                .select('*, services(name), customers(first_name, last_name)')
                .eq('employee_id', employee.id)
                .gte('appointment_date', new Date().toISOString())
                .order('appointment_date', { ascending: true })
                .limit(1)
                .single();

            return { countMonth, countTotal, nextAppt };
        },
        enabled: !!employee?.id
    });

    if (!employee) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl text-white">No se encontró perfil de barbero asociado.</h2>
                <p className="text-gray-400">Contacta al administrador para vincular tu cuenta.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Hola, {employee.first_name} 👋</h1>
            <p className="text-gray-400 mb-8">Aquí tienes el resumen de tu actividad.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1 */}
                <div className="card-premium p-6 flex items-center gap-4 border-l-4 border-urban-accent">
                    <div className="p-3 bg-urban-accent/10 rounded-full text-urban-accent">
                        <Scissors size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Cortes este Mes</p>
                        <h3 className="text-2xl font-bold text-white">{stats?.countMonth || 0}</h3>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="card-premium p-6 flex items-center gap-4 border-l-4 border-green-500">
                    <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Realizados</p>
                        <h3 className="text-2xl font-bold text-white">{stats?.countTotal || 0}</h3>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="card-premium p-6 flex items-center gap-4 border-l-4 border-blue-500">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Próxima Visita</p>
                        {stats?.nextAppt ? (
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {format(new Date(stats.nextAppt.appointment_date), 'HH:mm')}
                                </h3>
                                <p className="text-xs text-gray-400">{format(new Date(stats.nextAppt.appointment_date), 'EEE d MMM', { locale: es })}</p>
                            </div>
                        ) : (
                            <h3 className="text-lg font-bold text-white py-1">Sin pendientes</h3>
                        )}
                    </div>
                </div>
            </div>

            {/* Next Appointment Detail */}
            {stats?.nextAppt && (
                <div className="bg-gradient-to-r from-gray-900 to-black p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-urban-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <h2 className="text-xl font-bold text-white mb-4 relative z-10">Próximo Turno</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                        <div className="text-center sm:text-left">
                            <p className="text-4xl font-bold text-urban-accent">
                                {format(new Date(stats.nextAppt.appointment_date), 'HH:mm')}
                            </p>
                            <p className="text-gray-400 uppercase tracking-wider text-sm">
                                {format(new Date(stats.nextAppt.appointment_date), 'EEEE d, MMMM', { locale: es })}
                            </p>
                        </div>
                        <div className="h-12 w-px bg-white/10 hidden sm:block"></div>
                        <div className="text-center sm:text-left">
                            <p className="text-white font-bold text-lg">
                                {stats.nextAppt.customers?.first_name} {stats.nextAppt.customers?.last_name}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {stats.nextAppt.services?.name}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarberDashboard;
