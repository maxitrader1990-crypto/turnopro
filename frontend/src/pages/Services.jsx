import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Services = () => {
    const { api } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const { register, handleSubmit, reset, setValue } = useForm();

    // Fetch Services
    const { data: services, isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const res = await api.get('/services');
            return res.data; // Assuming response structure { success: true, data: [...] } or just array if controller returns array directly?
            // Controller returns: res.status(200).json({ success: true, count: ..., data: rows })
        }
    });

    const servicesList = services?.data || [];

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newService) => api.post('/services', newService),
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('Service created!');
            closeModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Error creating service');
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.patch(`/services/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('Service updated!');
            closeModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Error updating service');
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/services/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['services']);
            toast.success('Service deleted');
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
        if (window.confirm('Are you sure you want to delete this service?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Services</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Service
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : servicesList.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No services found. Create one!</td></tr>
                        ) : (
                            servicesList.map((service) => (
                                <tr key={service.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                                        <div className="text-sm text-gray-500">{service.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {service.duration_minutes} min
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${service.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {service.points_reward} pts
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEditModal(service)} className="text-blue-600 hover:text-blue-900 mr-4">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900">
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
                title={editingService ? 'Edit Service' : 'New Service'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Service Name</label>
                        <input
                            {...register('name', { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register('description')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                            <input
                                type="number"
                                {...register('duration_minutes', { required: true, valueAsNumber: true })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('price', { required: true, valueAsNumber: true })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gamification Points</label>
                        <input
                            type="number"
                            {...register('points_reward', { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                            {...register('category')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            placeholder="e.g. Haircut, Spa, Consultation"
                        />
                    </div>

                    <div className="mt-5 sm:mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
                        >
                            {editingService ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Services;
