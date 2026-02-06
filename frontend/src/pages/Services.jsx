import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Plus, Edit2, Trash2, Wand2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const DEFAULT_SERVICES = [
    { name: 'Corte Clásico', description: 'Corte de cabello tradicional con tijera o máquina.', duration_minutes: 30, price: 1500, category: 'Cabello', points_reward: 100 },
    { name: 'Corte Degradado (Fade)', description: 'Corte moderno con degradado perfecto.', duration_minutes: 45, price: 2000, category: 'Cabello', points_reward: 120 },
    { name: 'Barba Completa', description: 'Perfilado y arreglo de barba con toalla caliente.', duration_minutes: 30, price: 1200, category: 'Barba', points_reward: 80 },
    { name: 'Corte + Barba', description: 'Servicio completo de corte y arreglo de barba.', duration_minutes: 60, price: 3000, category: 'Combo', points_reward: 200 },
    { name: 'Perfilado de Cejas', description: 'Limpieza y perfilado de cejas.', duration_minutes: 15, price: 500, category: 'Rostro', points_reward: 30 },
];

const Services = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const { register, handleSubmit, reset, setValue } = useForm();

    // Fetch Services
    const { data: services, isLoading } = useQuery({
        queryKey: ['services', user?.business_id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('business_id', user.business_id)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            return data;
        },
        enabled: !!user?.business_id
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (newService) => {
            const { error } = await supabase
                .from('services')
                .insert({ ...newService, business_id: user.business_id });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('Servicio creado!');
            closeModal();
        },
        onError: (err) => {
            toast.error('Error al crear: ' + err.message);
        }
    });

    // Seed Mutation
    const seedMutation = useMutation({
        mutationFn: async () => {
            const servicesToInsert = DEFAULT_SERVICES.map(s => ({
                ...s,
                business_id: user.business_id
            }));
            const { error } = await supabase
                .from('services')
                .insert(servicesToInsert);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('¡Servicios cargados exitosamente!');
        },
        onError: (err) => {
            toast.error('Error al cargar servicios: ' + err.message);
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const { error } = await supabase
                .from('services')
                .update(data)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('Servicio actualizado!');
            closeModal();
        },
        onError: (err) => {
            toast.error('Error al actualizar: ' + err.message);
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            // Soft delete
            const { error } = await supabase
                .from('services')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('Servicio eliminado');
        }
    });

    const openCreateModal = () => {
        setEditingService(null);
        reset({
            name: '',
            description: '',
            duration_minutes: 30,
            price: 0,
            points_reward: 0,
            category: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (service) => {
        setEditingService(service);
        setValue('name', service.name);
        setValue('description', service.description);
        setValue('duration_minutes', service.duration_minutes);
        setValue('price', service.price);
        setValue('points_reward', service.points_reward);
        setValue('category', service.category);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        reset();
    };

    const onSubmit = (data) => {
        if (editingService) {
            updateMutation.mutate({ id: editingService.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
                    <p className="text-gray-500 text-sm">Gestiona el catálogo de servicios de tu barbería.</p>
                </div>
                <div className="flex gap-2">
                    {services?.length === 0 && (
                        <button
                            onClick={() => seedMutation.mutate()}
                            disabled={seedMutation.isPending}
                            className="btn-success flex items-center gap-2"
                        >
                            <Wand2 size={18} />
                            {seedMutation.isPending ? 'Cargando...' : 'Cargar Default'}
                        </button>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nuevo Servicio
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div></td></tr>
                        ) : services?.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No hay servicios. ¡Carga los default o crea uno nuevo!</td></tr>
                        ) : (
                            services?.map((service) => (
                                <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-gray-900">{service.name}</div>
                                        <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded-full mt-1">{service.category || 'General'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {service.duration_minutes} min
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ${service.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                                        +{service.points_reward} pts
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEditModal(service)} className="text-blue-600 hover:text-blue-900 mr-4 p-2 hover:bg-blue-50 rounded-full transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
                        <input
                            {...register('name', { required: true })}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black p-2.5 border"
                            placeholder="ej. Corte Clásico"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            {...register('description')}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black p-2.5 border"
                            rows="3"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duración (min)</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    {...register('duration_minutes', { required: true, valueAsNumber: true })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black p-2.5 border pl-9"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">⏱️</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('price', { required: true, valueAsNumber: true })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black p-2.5 border pl-7"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Puntos de Recompensa</label>
                        <input
                            type="number"
                            {...register('points_reward', { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black p-2.5 border"
                            placeholder="ej. 50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Puntos que gana el cliente al completar este servicio.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoría</label>
                        <input
                            {...register('category')}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black p-2.5 border"
                            placeholder="ej. Cabello, Barba, Spa"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="btn-secondary text-sm py-2 px-4"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary text-sm py-2 px-4"
                        >
                            {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Services;
