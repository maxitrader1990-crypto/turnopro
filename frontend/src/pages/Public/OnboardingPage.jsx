import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OnboardingPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();

    // Use raw axios here to avoid AuthInterceptor injecting bad headers if we had logic for that
    // But AuthContext api is fine if it handles no-token gracefully.
    // Let's use clean axios to be safe for public registration.

    // Use mutation to call the API
    const registerMutation = useMutation({
        mutationFn: (data) => axios.post('/api/admin/businesses', data),
        onSuccess: (response) => {
            const business = response.data.data;
            toast.success("Business created successfully!", { duration: 5000 });

            // Show the Business ID to the user (important for login)
            alert(`Business Created!\n\nYOUR BUSINESS ID: ${business.id}\n\nPlease save this ID to login.`);

            // Navigate to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        },
        onError: (error) => {
            console.error(error);
            toast.error(error.response?.data?.error || "Registration failed. Please try again.");
        }
    });

    const onSubmit = (data) => {
        // Prepare payload matching backend schema
        const payload = {
            name: data.businessName,
            subdomain: data.slug,
            email: data.email,
            owner_name: `${data.firstName} ${data.lastName}`,
            owner_password: data.password,
            plan_type: 'starter',
            phone: data.phone,
            gamification_enabled: true
        };

        registerMutation.mutate(payload);
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
        </div>
    );
};

export default OnboardingPage;
