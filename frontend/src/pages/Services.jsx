import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Plus, Edit2, Trash2, Wand2, Scissors, Clock, DollarSign, Star } from 'lucide-react';
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
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-widest drop-shadow-md flex items-center gap-3">
                        <Scissors className="text-urban-accent animate-pulse-slow" /> Book-the-Look
                    </h1>
                    <p className="text-gray-400 text-sm font-light mt-1">Gestiona tu catálogo visual de servicios exclusivos.</p>
                </div>
                <div className="flex gap-3">
                    {services?.length === 0 && (
                        <button
                            onClick={() => seedMutation.mutate()}
                            disabled={seedMutation.isPending}
                            className="btn-ghost-dark text-green-400 border-green-500/30 hover:bg-green-500/10 flex items-center gap-2"
                        >
                            <Wand2 size={18} />
                            {seedMutation.isPending ? 'Cargando...' : 'Cargar Default'}
                        </button>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="btn-urban flex items-center gap-2 shadow-lg shadow-urban-accent/20"
                    >
                        <Plus size={20} />
                        Nuevo Estilo
                    </button>
                </div>
            </div>

            {/* Grid Layout for Book-the-Look Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urban-accent mx-auto"></div>
                    </div>
                ) : services?.length === 0 ? (
                    <div className="col-span-full card-premium p-12 text-center border-dashed border-2 border-white/10">
                        <Scissors className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400 text-lg">Tu catálogo está vacío.</p>
                        <p className="text-gray-500 text-sm">Empieza a definir tu estilo agregando servicios.</p>
                    </div>
                ) : (
                    services?.map((service) => (
                        <div key={service.id} className="card-premium group hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
                            {/* Decorative glow */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-urban-accent/5 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none group-hover:bg-urban-accent/10 transition-colors"></div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/5 text-gray-300 border border-white/10">
                                        {service.category || 'General'}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(service)} className="text-blue-400 hover:text-white transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="text-red-400 hover:text-white transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-urban-accent transition-colors">{service.name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-3 mb-4 font-light leading-relaxed">{service.description || 'Sin descripción disponible.'}</p>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center text-sm text-gray-300 gap-2">
                                        <Clock size={16} className="text-urban-secondary" />
                                        {service.duration_minutes} min
                                    </div>
                                    <div className="flex items-center text-sm text-gray-300 gap-2">
                                        <DollarSign size={16} className="text-green-400" />
                                        <span className="font-bold text-white text-lg">${service.price}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-urban-accent gap-1 mt-2 font-mono">
                                        <Star size={12} fill="currentColor" />
                                        Recompensa: +{service.points_reward} XP
                                    </div>
                                </div>
                            </div>

                            {/* Bottom aesthetic line */}
                            <div className="h-1 w-full bg-gradient-to-r from-transparent via-urban-accent/50 to-transparent opacity-50"></div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingService ? 'Editar Estilo' : 'Nuevo Estilo'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
                        <input
                            {...register('name', { required: true })}
                            className="mt-1 block w-full input-urban text-black"
                            placeholder="ej. Corte Fade Urbano"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            {...register('description')}
                            className="mt-1 block w-full input-urban text-black"
                            rows="3"
                            placeholder="Detalles del estilo..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duración (min)</label>
                            <div className="relative mt-1">
                                <input
                                    type="number"
                                    {...register('duration_minutes', { required: true, valueAsNumber: true })}
                                    className="block w-full input-urban pl-9 text-black"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">⏱️</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 z-10">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('price', { required: true, valueAsNumber: true })}
                                    className="block w-full input-urban pl-7 text-black"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Puntos de Recompensa (XP)</label>
                        <input
                            type="number"
                            {...register('points_reward', { valueAsNumber: true })}
                            className="mt-1 block w-full input-urban text-black"
                            placeholder="ej. 50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Puntos que gana el cliente al completar este servicio.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoría</label>
                        <input
                            {...register('category')}
                            className="mt-1 block w-full input-urban text-black"
                            placeholder="ej. Cabello, Barba, Spa"
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="btn-ghost-dark text-gray-500 hover:text-gray-700 border-transparent"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-urban"
                        >
                            {editingService ? 'Guardar Cambios' : 'Crear Estilo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Services;
