import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const OnboardingPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { register: registerAuth } = useAuth(); // Renaming to avoid conflict with form register

    const registerMutation = useMutation({
        mutationFn: async (data) => {
            const success = await registerAuth(data.email, data.password, data.businessName);
            if (!success) throw new Error("Registration failed");
            return success;
        },
        onSuccess: () => {
            // Navigate handled by toast guidance or auto-login in AuthContext
            // But simpler to just redirect to login if email verification needed or dashboard if auto-logged in.
            // Our AuthContext logic for register stops at "Verify email", but let's assume auto-confirm or login for now or redirect to login.
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        },
        onError: (error) => {
            console.error(error);
        }
    });

    const onSubmit = (data) => {
        registerMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Start your free trial</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Get your Business online in minutes.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Business Name</label>
                            <input {...register('businessName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unique URL Slug</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    turnopro.com/p/
                                </span>
                                <input {...register('slug', { required: true })} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 p-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input {...register('firstName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input {...register('lastName', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email address</label>
                            <input type="email" {...register('email', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                            <input type="tel" {...register('phone')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" {...register('password', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>

                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                                Create Account
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="mt-8 text-center text-xs text-gray-500">
                Desarrollado por <span className="font-semibold text-gray-700">Patagonia Automatiza</span>
            </div>
        </div>
    );
};

export default OnboardingPage;
