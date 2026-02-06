import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, Trash2, Phone, Save, X } from 'lucide-react';
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
                .order('created_at', { ascending: true });

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
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Equipo de Trabajo</h1>
                    <p className="text-gray-500 mt-1">Gestiona a tus profesionales y sus horarios</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nuevo Empleado
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? <p>Cargando...</p> : employees?.map(emp => (
                    <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center hover:shadow-md transition-shadow relative group">
                        <button
                            onClick={() => deleteMutation.mutate(emp.id)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>

                        {emp.photo ? (
                            <img src={emp.photo} alt={emp.first_name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-gray-50 shadow-sm" />
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full mb-4 flex items-center justify-center text-3xl font-bold text-blue-600 border-4 border-white shadow-sm">
                                {emp.first_name?.[0]}
                            </div>
                        )}

                        <h3 className="text-xl font-bold text-gray-900">{emp.first_name} {emp.last_name}</h3>
                        <p className="text-sm font-medium text-blue-600 mb-2 uppercase tracking-wide">{emp.title || 'Staff'}</p>
                        <p className="text-sm text-gray-500 text-center mb-4 line-clamp-3 px-2 italic">"{emp.bio || 'Sin biografía'}"</p>

                        {emp.phone && (
                            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full mb-4">
                                <Phone size={12} /> {emp.phone}
                            </div>
                        )}

                        <div className="mt-auto flex gap-2 w-full">
                            <button
                                onClick={() => setScheduleEmployee(emp)}
                                className="flex-1 flex items-center justify-center gap-2 btn-secondary text-sm font-medium"
                            >
                                <Clock size={16} /> Horarios
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Profesional">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input {...register('first_name', { required: true })} placeholder="Juan" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input {...register('last_name', { required: true })} placeholder="Pérez" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
                        <input {...register('phone')} placeholder="549..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cargo / Título</label>
                        <input {...register('title')} placeholder="ej. Master Barber" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL Foto</label>
                        <input {...register('photo')} placeholder="https://..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Biografía</label>
                        <textarea {...register('bio')} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Experiencia..." />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button type="submit" className="btn-primary px-6 py-2">Guardar</button>
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
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4">
                Define los días y franjas horarias en las que este profesional atiende.
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {DAYS.map(({ key, label }) => {
                    const dayConfig = schedule[key] || { active: false, start: '09:00', end: '18:00' };
                    return (
                        <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${dayConfig.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-transparent opacity-60'}`}>
                            <div className="min-w-[100px] flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={dayConfig.active}
                                    onChange={(e) => handleChange(key, 'active', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="font-medium text-gray-700">{label}</span>
                            </div>

                            {dayConfig.active && (
                                <div className="flex items-center gap-2 text-sm">
                                    <input
                                        type="time"
                                        value={dayConfig.start}
                                        onChange={(e) => handleChange(key, 'start', e.target.value)}
                                        className="border rounded px-2 py-1 outline-none focus:border-blue-500"
                                    />
                                    <span className="text-gray-400">a</span>
                                    <input
                                        type="time"
                                        value={dayConfig.end}
                                        onChange={(e) => handleChange(key, 'end', e.target.value)}
                                        className="border rounded px-2 py-1 outline-none focus:border-blue-500"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 gap-2 border-t mt-4">
                <button onClick={onCancel} className="btn-secondary px-4 py-2">Cancelar</button>
                <button onClick={() => onSave(schedule)} className="btn-primary px-6 py-2">Guardar Horarios</button>
            </div>
        </div>
    );
};

export default Employees;
