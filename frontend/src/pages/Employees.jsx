import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, Trash2, Phone, Save, X, Users, Calendar } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
];

const DEFAULT_SCHEDULE = {
    monday: { active: true, start: '09:00', end: '20:00' },
    tuesday: { active: true, start: '09:00', end: '20:00' },
    wednesday: { active: true, start: '09:00', end: '20:00' },
    thursday: { active: true, start: '09:00', end: '20:00' },
    friday: { active: true, start: '09:00', end: '20:00' },
    saturday: { active: true, start: '09:00', end: '14:00' },
    sunday: { active: false, start: '00:00', end: '00:00' },
};

const Employees = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scheduleEmployee, setScheduleEmployee] = useState(null);
    const { register, handleSubmit, reset } = useForm();

    // Fetch Employees
    const { data: employees, isLoading } = useQuery({
        queryKey: ['employees', user?.business_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('business_id', user?.business_id)
                .is('deleted_at', null)
                .order('first_name', { ascending: true }); // Changed order to name for better reading

            if (error) throw error;
            return data;
        },
        enabled: !!user?.business_id
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (data) => {
            const { error } = await supabase.from('employees').insert({
                business_id: user.business_id,
                first_name: data.first_name,
                last_name: data.last_name,
                // email: data.email, 
                phone: data.phone,
                photo: data.photo,
                bio: data.bio,
                title: data.title,
                is_active: true,
                schedule: DEFAULT_SCHEDULE
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['employees']);
            toast.success('¡Profesional creado!');
            setIsModalOpen(false);
            reset();
        },
        onError: (err) => toast.error('Error: ' + err.message)
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('employees')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['employees']);
            toast.success('Profesional eliminado');
        },
        onError: (err) => toast.error('Error: ' + err.message)
    });

    // Schedule Mutation
    const scheduleMutation = useMutation({
        mutationFn: async ({ id, schedule }) => {
            const { error } = await supabase
                .from('employees')
                .update({ schedule })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['employees']);
            toast.success('Horarios actualizados');
            setScheduleEmployee(null);
        },
        onError: (err) => toast.error('Error guardando horarios')
    });

    const onSubmit = (data) => createMutation.mutate(data);

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-widest drop-shadow-md flex items-center gap-3">
                        <Users className="text-urban-accent animate-pulse-slow" /> Equipo de Trabajo
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-light">Gestiona a tus profesionales de élite y sus horarios.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-urban flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nuevo Talento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urban-accent mx-auto"></div>
                    </div>
                ) : employees?.length === 0 ? (
                    <div className="col-span-full card-premium p-12 text-center border-dashed border-2 border-white/10">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400 text-lg">No hay profesionales registrados.</p>
                        <p className="text-gray-500 text-sm">Añade a tu primer barbero estrella.</p>
                    </div>
                ) : (
                    employees?.map(emp => (
                        <div key={emp.id} className="card-premium p-6 flex flex-col items-center hover:scale-[1.02] transition-all duration-300 relative group overflow-hidden">
                            {/* Background flare */}
                            <div className="absolute top-[-30%] right-[-30%] w-40 h-40 bg-urban-secondary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-urban-secondary/30 transition-colors"></div>

                            <button
                                onClick={() => {
                                    if (window.confirm('¿Eliminar a este profesional?')) deleteMutation.mutate(emp.id)
                                }}
                                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="relative mb-4">
                                {emp.photo ? (
                                    <img src={emp.photo} alt={emp.first_name} className="w-24 h-24 rounded-full object-cover border-4 border-white/5 shadow-2xl" />
                                ) : (
                                    <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500 border-4 border-white/5 shadow-2xl">
                                        {emp.first_name?.[0]}
                                    </div>
                                )}
                                <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-premium-card ${emp.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            </div>

                            <h3 className="text-xl font-bold text-white tracking-wide">{emp.first_name} {emp.last_name}</h3>
                            <p className="text-xs font-bold text-urban-accent uppercase tracking-widest mb-3">{emp.title || 'Staff'}</p>

                            <p className="text-sm text-gray-400 text-center mb-6 line-clamp-2 px-2 italic font-light">
                                "{emp.bio || 'Listo para trasformar tu estilo.'}"
                            </p>

                            <div className="mt-auto w-full space-y-3">
                                {emp.phone && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-300 bg-white/5 py-1.5 rounded-lg border border-white/5">
                                        <Phone size={12} className="text-green-400" /> {emp.phone}
                                    </div>
                                )}

                                <button
                                    onClick={() => setScheduleEmployee(emp)}
                                    className="w-full flex items-center justify-center gap-2 btn-ghost-dark text-sm border-urban-accent/30 text-urban-accent hover:bg-urban-accent/10"
                                >
                                    <Calendar size={16} /> Gestionar Horarios
                                </button>
                            </div>
                        </div>
                    )))}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Profesional">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input {...register('first_name', { required: true })} placeholder="Juan" className="mt-1 block w-full input-urban text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input {...register('last_name', { required: true })} placeholder="Pérez" className="mt-1 block w-full input-urban text-black" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
                        <input {...register('phone')} placeholder="549..." className="mt-1 block w-full input-urban text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cargo / Título</label>
                        <input {...register('title')} placeholder="ej. Master Barber" className="mt-1 block w-full input-urban text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Url Foto (Opcional)</label>
                        <input {...register('photo')} placeholder="https://..." className="mt-1 block w-full input-urban text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Biografía Corta</label>
                        <textarea {...register('bio')} rows="3" className="mt-1 block w-full input-urban text-black" placeholder="Experiencia, especialidad..." />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-ghost-dark text-gray-500 hover:text-gray-700 border-transparent mr-2"
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn-urban w-full sm:w-auto">Guardar Talento</button>
                    </div>
                </form>
            </Modal>

            {/* Schedule Modal */}
            <Modal isOpen={!!scheduleEmployee} onClose={() => setScheduleEmployee(null)} title={`Horarios: ${scheduleEmployee?.first_name || ''}`}>
                {scheduleEmployee && (
                    <ScheduleEditor
                        initialSchedule={scheduleEmployee.schedule || DEFAULT_SCHEDULE}
                        onSave={(newSchedule) => scheduleMutation.mutate({ id: scheduleEmployee.id, schedule: newSchedule })}
                        onCancel={() => setScheduleEmployee(null)}
                    />
                )}
            </Modal>
        </div>
    );
};

const ScheduleEditor = ({ initialSchedule, onSave, onCancel }) => {
    const [schedule, setSchedule] = useState(initialSchedule);

    const handleChange = (day, field, value) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    return (
        <div className="space-y-4">
            <div className="bg-blue-50/50 p-3 rounded-lg text-sm text-blue-800 border border-blue-100 mb-4 flex items-start gap-2">
                <Clock size={16} className="mt-0.5 shrink-0" />
                <p>Define los días y franjas horarias de disponibilidad. Desmarca los días libres.</p>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {DAYS.map(({ key, label }) => {
                    const dayConfig = schedule[key] || { active: false, start: '09:00', end: '18:00' };
                    return (
                        <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${dayConfig.active ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
                            <div className="min-w-[110px] flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={dayConfig.active}
                                    onChange={(e) => handleChange(key, 'active', e.target.checked)}
                                    className="w-5 h-5 accent-urban-accent rounded cursor-pointer"
                                />
                                <span className={`font-medium ${dayConfig.active ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
                            </div>

                            {dayConfig.active && (
                                <div className="flex items-center gap-2 text-sm ml-auto">
                                    <input
                                        type="time"
                                        value={dayConfig.start}
                                        onChange={(e) => handleChange(key, 'start', e.target.value)}
                                        className="border-gray-300 rounded-md px-2 py-1 outline-none focus:border-urban-accent focus:ring-1 focus:ring-urban-accent"
                                    />
                                    <span className="text-gray-400 font-medium">-</span>
                                    <input
                                        type="time"
                                        value={dayConfig.end}
                                        onChange={(e) => handleChange(key, 'end', e.target.value)}
                                        className="border-gray-300 rounded-md px-2 py-1 outline-none focus:border-urban-accent focus:ring-1 focus:ring-urban-accent"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t mt-4">
                <button onClick={onCancel} className="btn-ghost-dark text-gray-500 hover:text-gray-700 border-transparent">Cancelar</button>
                <button onClick={() => onSave(schedule)} className="btn-urban">Guardar Horarios</button>
            </div>
        </div>
    );
};

export default Employees;
