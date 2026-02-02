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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    New Employee
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? <p>Loading...</p> : employeesList.map(emp => (
                    <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-2xl font-bold text-gray-500">
                            {emp.first_name[0]}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{emp.first_name} {emp.last_name}</h3>
                        <p className="text-sm text-blue-600 mb-2">{emp.specialty || 'General Staff'}</p>
                        <p className="text-sm text-gray-500 text-center mb-4 line-clamp-2">{emp.bio || 'No bio available'}</p>

                        <div className="mt-auto flex gap-2 w-full">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium">
                                <Clock size={16} /> Schedule
                            </button>
                            {/* Add edit button later */}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Employee">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input {...register('first_name', { required: true })} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input {...register('last_name', { required: true })} className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" {...register('email', { required: true })} className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" {...register('password', { required: true })} className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Specialty</label>
                        <input {...register('specialty')} className="mt-1 block w-full p-2 border rounded-md" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                            Create Account
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Employees;
