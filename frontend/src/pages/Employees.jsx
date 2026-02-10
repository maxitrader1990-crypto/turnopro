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
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [scheduleEmployee, setScheduleEmployee] = useState(null);
    const { register, handleSubmit, reset, setValue } = useForm();

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
        reset();
    };

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
                email: data.email,
                phone: data.phone,
                profile_image_url: data.profile_image_url,
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

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }) => {
            const { error } = await supabase.from('employees').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['employees']);
            toast.success('Actualizado correctamente');
            closeModal();
        },
        onError: (err) => toast.error('Error: ' + err.message)
    });

    const onSubmit = (data) => {
        if (selectedEmployee) {
            updateMutation.mutate({ id: selectedEmployee.id, ...data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setValue('first_name', employee.first_name);
        setValue('last_name', employee.last_name);
        setValue('email', employee.email);
        setValue('phone', employee.phone);
        setValue('title', employee.title);
        setValue('profile_image_url', employee.profile_image_url);
        setValue('bio', employee.bio);
        setIsModalOpen(true);
    };

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urban-accent mx-auto"></div>
                        <p className="text-gray-400 mt-4 animate-pulse">Cargando talento...</p>
                    </div>
                ) : employees?.length === 0 ? (
                    <div className="col-span-full card-premium p-12 text-center border-dashed border-2 border-white/10 group hover:border-urban-accent/30 transition-colors">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Users className="w-10 h-10 text-gray-500 group-hover:text-urban-accent transition-colors" />
                        </div>
                        <p className="text-white text-xl font-bold mb-2">Tu equipo está vacío</p>
                        <p className="text-gray-400 text-sm mb-6">Comienza a construir tu imperio añadiendo a tu primer profesional.</p>
                        <button onClick={() => setIsModalOpen(true)} className="btn-urban text-sm py-2 px-6">
                            + Añadir Primer Talento
                        </button>
                    </div>
                ) : (
                    employees?.map(emp => (
                        <div key={emp.id} className="relative group perspective-1000">
                            <div className="card-premium p-0 overflow-hidden h-full flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(245,158,11,0.2)] border border-white/10 hover:border-urban-accent/50 bg-[#0f1115]">

                                {/* Header Image / Gradient Background */}
                                <div className="h-24 bg-gradient-to-tr from-gray-900 via-gray-800 to-black relative">
                                    <div className="absolute inset-0 bg-urban-accent/5 pattern-grid-lg opacity-30"></div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('¿Eliminar a este profesional?')) deleteMutation.mutate(emp.id)
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100"
                                        title="Eliminar Profesional"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Avatar & Status */}
                                <div className="relative px-6 -mt-12 mb-3 flex justify-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-urban-accent to-transparent shadow-lg">
                                            {emp.profile_image_url ? (
                                                <img
                                                    src={emp.profile_image_url}
                                                    alt={emp.first_name}
                                                    className="w-full h-full rounded-full object-cover border-4 border-[#0f1115] bg-gray-800"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://ui-avatars.com/api/?name=${emp.first_name}+${emp.last_name}&background=1a1d21&color=f59e0b&size=256`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full border-4 border-[#0f1115] bg-gray-800 flex items-center justify-center text-3xl font-bold text-urban-accent">
                                                    {emp.first_name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        {/* Status Dot */}
                                        <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#0f1115] ${emp.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} title={emp.is_active ? 'Activo' : 'Inactivo'}></div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 pb-6 flex-1 flex flex-col items-center text-center">
                                    <h3 className="text-xl font-bold text-white tracking-wide mb-1">{emp.first_name} <span className="font-light text-gray-400">{emp.last_name}</span></h3>
                                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-urban-accent uppercase tracking-widest mb-4 shadow-inner">
                                        {emp.title || 'Staff Member'}
                                    </div>

                                    <p className="text-sm text-gray-400 leading-relaxed mb-6 italic line-clamp-3 w-full">
                                        "{emp.bio || 'Listo para trasformar tu estilo. Profesional dedicado a la excelencia.'}"
                                    </p>

                                    {/* Contact Info Compact */}
                                    <div className="w-full space-y-2 mb-6 text-xs text-gray-500">
                                        {emp.phone && (
                                            <div className="flex items-center justify-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                                                <Phone size={12} className="text-green-500" /> {emp.phone}
                                            </div>
                                        )}
                                        {emp.email && (
                                            <div className="truncate opacity-70 hover:opacity-100 transition-opacity">
                                                {emp.email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto w-full pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => setScheduleEmployee(emp)}
                                            className="w-full group/btn flex items-center justify-center gap-2 bg-transparent hover:bg-urban-accent text-urban-accent hover:text-black py-2.5 rounded-lg border border-urban-accent/30 hover:border-urban-accent transition-all font-bold text-sm"
                                        >
                                            <Calendar size={16} className="group-hover/btn:scale-110 transition-transform" />
                                            Gestionar Horarios
                                        </button>
                                        <button
                                            onClick={() => handleEdit(emp)}
                                            className="w-full mt-2 group/btn flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-2 rounded-lg border border-white/5 transition-all text-sm font-medium"
                                        >
                                            Editar Perfil
                                        </button>
                                    </div>
                                </div>
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
                        <label className="block text-sm font-medium text-gray-700">Email (Para acceso al sistema)</label>
                        <input {...register('email')} placeholder="barbero@ejemplo.com" className="mt-1 block w-full input-urban text-black" />
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
                        <input {...register('profile_image_url')} placeholder="https://..." className="mt-1 block w-full input-urban text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Biografía Corta</label>
                        <textarea {...register('bio')} rows="3" className="mt-1 block w-full input-urban text-black" placeholder="Experiencia, especialidad..." />
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                        >
                            {selectedEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
                        </button>
                    </div>
                </form>

                {/* PORTFOLIO SECTION (Only when editing) */}
                {selectedEmployee && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Portafolio de Trabajos</h3>

                        <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Agregar Nueva Foto</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="new-portfolio-url"
                                    placeholder="https://..."
                                    className="input-urban flex-1 text-black bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const urlInput = document.getElementById('new-portfolio-url');
                                        if (!urlInput.value) return toast.error("Ingresa una URL");

                                        try {
                                            const { error } = await supabase.from('portfolio_items').insert({
                                                business_id: user.business_id,
                                                employee_id: selectedEmployee.id,
                                                image_url: urlInput.value,
                                                description: "Trabajo realizado"
                                            });
                                            if (error) throw error;
                                            toast.success("Foto agregada");
                                            urlInput.value = "";
                                            queryClient.invalidateQueries(['portfolio', selectedEmployee.id]);
                                        } catch (e) {
                                            toast.error("Error al agregar foto: " + e.message);
                                        }
                                    }}
                                    className="bg-urban-accent text-black px-4 py-2 rounded-lg font-bold hover:brightness-110"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>

                        <PortfolioList employeeId={selectedEmployee.id} businessId={user.business_id} />
                    </div>
                )}
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

// Subcomponent for listing portfolio items
const PortfolioList = ({ employeeId, businessId }) => {
    const queryClient = useQueryClient();
    const { data: items, isLoading } = useQuery({
        queryKey: ['portfolio', employeeId],
        queryFn: async () => {
            const { data } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false });
            return data || [];
        },
        enabled: !!employeeId
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Foto eliminada");
            queryClient.invalidateQueries(['portfolio', employeeId]);
        }
    });

    if (isLoading) return <p className="text-sm text-gray-500">Cargando portafolio...</p>;

    if (items?.length === 0) return <p className="text-sm text-gray-500 italic">No hay fotos en el portafolio aún.</p>;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {items?.map(item => (
                <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={item.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
