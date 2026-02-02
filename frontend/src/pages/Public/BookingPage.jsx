import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader, CheckCircle, Calendar as CalendarIcon, Clock, User, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

// Public instance
const publicApi = axios.create({ baseURL: '/api' });

const BookingPage = () => {
    const { slug } = useParams();
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        service: null,
        employee: null,
        date: '',
        time: '',
    });
    const { register, handleSubmit } = useForm();

    // 1. Fetch Business by Slug (Need endpoint! For now using mock/hardcoded ID or guessing ID if we don't have slug resolution yet)
    // TODO: Create GET /api/public/business/:slug
    // STARTUP HACK: We will assume we are testing with the business we created manually or just use ID passed via query for now if slug fails.
    // Let's assume slug IS the business ID for this MVP phase 
    const businessId = "123e4567-e89b-12d3-a456-426614174000"; // Replace with actual ID for testing or implement slug resolver
    // Note: In real app, we need backend resolver.

    // Headers for standard queries
    const headers = { 'x-business-id': businessId };

    // Queries
    const { data: services, isLoading: loadingServices } = useQuery({
        queryKey: ['public', 'services', businessId],
        queryFn: async () => (await publicApi.get('/services', { headers })).data
    });

    const { data: employees } = useQuery({
        queryKey: ['public', 'employees', businessId],
        queryFn: async () => (await publicApi.get('/employees', { headers })).data,
        enabled: step >= 2
    });

    // Determine availability (only if all selected)
    const { data: slots, isLoading: loadingSlots } = useQuery({
        queryKey: ['availability', bookingData.service?.id, bookingData.employee?.id, bookingData.date],
        queryFn: async () => {
            const res = await publicApi.get('/appointments/availability', {
                params: {
                    date: bookingData.date,
                    service_id: bookingData.service.id,
                    employee_id: bookingData.employee?.id
                },
                headers
            });
            return res.data;
        },
        enabled: !!bookingData.date && !!bookingData.service && step === 3
    });

    const mutation = useMutation({
        mutationFn: (data) => publicApi.post('/appointments', {
            customer_id: null, // Guest booking logic needed! 
            // Wait, appointmentController.createAppointment expects customer_id. 
            // We need a Guest Flow: Create/Find customer by email/phone first.
            // Let's handle that in the onSubmit.
            ...data,
            business_id: businessId
        }, { headers }),
        onSuccess: () => setStep(5),
        onError: () => toast.error('Booking failed')
    });

    const handleServiceSelect = (s) => {
        setBookingData({ ...bookingData, service: s });
        setStep(2);
    };

    const handleEmployeeSelect = (e) => {
        setBookingData({ ...bookingData, employee: e });
        setStep(3);
    };

    const handleTimeSelect = (time) => {
        setBookingData({ ...bookingData, time });
        setStep(4);
    };

    const onSubmit = async (data) => {
        // 1. Register/Find Customer (Public Endpoint needed!)
        // Improv: Call createCustomer directly? It's public? 
        // customerController.createCustomer: "router.post('/', createCustomer)" -> Yes!

        try {
            const customerRes = await publicApi.post('/customers', {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                // business_id needed
            }, { headers });

            const customerId = customerRes.data.data.id;

            // 2. Book
            mutation.mutate({
                customer_id: customerId,
                service_id: bookingData.service.id,
                employee_id: bookingData.employee?.id,
                date: bookingData.date,
                time: bookingData.time
            });

        } catch (err) {
            toast.error('Failed to register customer');
        }
    };

    if (loadingServices) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

    const slotList = slots?.data ? Object.keys(slots.data) : [];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold">TurnoPro Demo</h1>
                    <p className="opacity-90">Book your next visit</p>
                </div>

                <div className="flex-1 p-8">
                    {/* Step 1: Service */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Scissors /> Select Service</h2>
                            <div className="grid gap-3">
                                {services?.data?.map(s => (
                                    <div key={s.id} onClick={() => handleServiceSelect(s)} className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex justify-between items-center group">
                                        <div>
                                            <span className="font-bold text-gray-800">{s.name}</span>
                                            <p className="text-sm text-gray-500">{s.duration_minutes} min</p>
                                        </div>
                                        <span className="font-bold text-blue-600 group-hover:scale-105 transition-transform">${s.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Staff (Skip option?) */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2"><User /> Select Professional</h2>
                                <button onClick={() => setStep(3)} className="text-sm text-blue-600 underline">Skip (Any)</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {employees?.data?.map(e => (
                                    <div key={e.id} onClick={() => handleEmployeeSelect(e)} className="p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer text-center group">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-gray-500 group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
                                            {e.first_name[0]}
                                        </div>
                                        <span className="font-medium">{e.first_name}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)} className="mt-8 text-gray-400">Back</button>
                        </div>
                    )}

                    {/* Step 3: Date & Time */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon /> Select Time</h2>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg mb-4"
                                // Min today
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                            />

                            {loadingSlots && <p>Loading slots...</p>}

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                                {slotList.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => handleTimeSelect(time)}
                                        className="py-2 px-1 bg-gray-100 rounded hover:bg-green-500 hover:text-white text-sm transition-colors"
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                            {!bookingData.date && <p className="text-gray-500">Please select a date first.</p>}
                            <div className="pt-6">
                                <button onClick={() => setStep(2)} className="text-gray-400">Back</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Details */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4">Your Information</h2>
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
                                <p><strong>Service:</strong> {bookingData.service?.name}</p>
                                <p><strong>Date:</strong> {bookingData.date} at {bookingData.time}</p>
                                {bookingData.employee && <p><strong>With:</strong> {bookingData.employee.first_name}</p>}
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input {...register('first_name', { required: true })} placeholder="First Name" className="p-2 border rounded w-full" />
                                    <input {...register('last_name', { required: true })} placeholder="Last Name" className="p-2 border rounded w-full" />
                                </div>
                                <input {...register('email', { required: true })} type="email" placeholder="Email" className="p-2 border rounded w-full" />
                                <input {...register('phone', { required: true })} placeholder="Phone" className="p-2 border rounded w-full" />

                                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4 shadow-lg disabled:opacity-50" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Booking...' : 'Confirm Appointment'}
                                </button>
                            </form>
                            <div className="pt-2">
                                <button onClick={() => setStep(3)} className="text-gray-400">Back</button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                            <p className="text-gray-500 mb-8">You will receive a confirmation email shortly.</p>
                            <button onClick={() => window.location.reload()} className="text-blue-600 font-bold">Book Another</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
