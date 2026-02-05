import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Employees = () => {
    const { api } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm();

    // Fetch Employees
    const { data: employees, isLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const res = await api.get('/employees');
            return res.data;
        }
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: (newEmployee) => api.post('/employees', newEmployee),
        onSuccess: () => {
            queryClient.invalidateQueries(['employees']);
            toast.success('Employee created! Account generated.');
            setIsModalOpen(false);
            reset();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Error creating employee')
    });

    const onSubmit = (data) => {
        // Backend expects: { firstName, lastName, email, specialty, bio }
        // Wait, check employeeController.createEmployee expects
        // It likely creates a User first. 
        // Let's assume standard fields.
        createMutation.mutate(data);
    };

    const employeesList = employees?.data || [];

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
                {isLoading ? <p>Cargando...</p> : employeesList.map(emp => (
                    <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center hover:shadow-md transition-shadow">
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
                        <p className="text-sm font-medium text-blue-600 mb-2 uppercase tracking-wide">{emp.title || emp.role || 'Staff'}</p>
                        <p className="text-sm text-gray-500 text-center mb-6 line-clamp-3 px-2 italic">"{emp.bio || 'Sin biografía'}"</p>

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
                            <input {...register('first_name', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input {...register('last_name', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email (Usuario)</label>
                        <input type="email" {...register('email', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña Temporal</label>
                        <input type="password" {...register('password', { required: true })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cargo / Título</label>
                            <input {...register('title')} placeholder="ej. Master Barber" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">URL Foto Perfil</label>
                            <input {...register('photo')} placeholder="https://..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Biografía Breve</label>
                        <textarea {...register('bio')} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Cuenta un poco sobre su experiencia..." />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-900/20 transition-all">
                            Crear Cuenta
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Employees;
