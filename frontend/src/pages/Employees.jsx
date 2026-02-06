import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, Trash2, Phone } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';

const Employees = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm();

    // Fetch Employees
    const { data: employees, isLoading } = useQuery({
        queryKey: ['employees', user?.business_id],
        queryFn: async () => {
            // We need to join with business_users if we want the name from there, 
            // BUT simpler: Employees table usually has names if created directly?
            // Checking BookingPage logic: it expects `business_users` relation OR fallback.
            // For simplify, let's assume we store basic info in 'employees' too or we create a 'business_users' record?
            // Re-reading 'Employees.jsx' original code: it expected a backend to handle this.
            // Since we are frontend-only, we should insert into 'employees' table directly.
            // Let's assume 'employees' table has 'first_name', 'last_name', 'phone', 'photo', 'bio', 'title'.
            // If schema doesn't match, we might need a migration.
            // BookingPage uses: `first_name: e.business_users?.first_name || 'Staff'`
            // Wait, the Schema likely assumes employees are USERS.
            // But for a Barber Shop, they might just be dumb records.
            // Let's check BookingPage again.
            // If I use `employees` table, I should probably add `first_name`, `last_name` columns to it directly if they don't exist, 
            // OR create a `business_users` record for them. 
            // Creating a `business_users` record requires a `user_id` (auth user) usually?
            // Migration `MIGRATION_FIX_BUSINESS_USERS.sql` made `user_id` nullable? No, `uuid references auth.users(id)`.
            // Wait, `ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);`
            // Only if we want them to login.
            // For now, let's add `first_name`, `last_name` to `employees` table via migration too if needed?
            // Actually, `BookingPage` selects `email`? No.
            // Let's use `employees` table directly for names if possible.
            // I will create a migration to add names to `employees` table to make it standalone.
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('business_id', user?.business_id)
                .is('deleted_at', null);

            if (error) throw error;
            return data;
        },
        enabled: !!user?.business_id
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (data) => {
            // Insert directly into employees
            // We need to ensure 'employees' table has these columns.
            // I will add them in SQL migration just in case.
            const { error } = await supabase
                .from('employees')
                .insert({
                    business_id: user.business_id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email, // Optional?
                    phone: data.phone,
                    photo: data.photo,
                    bio: data.bio,
                    title: data.title,
                    is_active: true
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

    const onSubmit = (data) => {
        createMutation.mutate(data);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Equipo de Trabajo</h1>
                    <p className="text-gray-500 mt-1">Gestiona a tus profesionales</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 font-medium"
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
                            <img
                                src={emp.photo}
                                alt={emp.first_name}
                                className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-gray-50 shadow-sm"
                            />
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
                                <Phone size={12} />
                                {emp.phone}
                            </div>
                        )}

                        <div className="mt-auto flex gap-2 w-full">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2.5 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors border border-gray-200">
                                <Clock size={16} /> Horarios
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Profesional">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input {...register('first_name', { required: true })} placeholder="Juan" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input {...register('last_name', { required: true })} placeholder="Pérez" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Teléfono (WhatsApp)</label>
                        <input {...register('phone')} placeholder="549..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cargo / Título</label>
                        <input {...register('title')} placeholder="ej. Master Barber" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">URL Foto</label>
                        <input {...register('photo')} placeholder="https://..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Biografía</label>
                        <textarea {...register('bio')} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Experiencia..." />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-all">
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Employees;
