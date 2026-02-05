import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader, CheckCircle, Calendar as CalendarIcon, Clock, User, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '../../supabase';

// Helper to determine business from Slug or use Default
// For MVP, we default to the ID we know or specific ID.
const DEFAULT_BUSINESS_ID = 'a9baf9af-e526-4688-ae71-afbc98efd32d'; // Ibiza Estudio ID from seed

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
    const businessId = DEFAULT_BUSINESS_ID;

    // Queries
    const { data: services, isLoading: loadingServices } = useQuery({
        queryKey: ['public', 'services', businessId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('business_id', businessId)
                .is('deleted_at', null);
            if (error) throw error;
            return { data };
        }
    });

    const { data: employees } = useQuery({
        queryKey: ['public', 'employees', businessId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select(`*, business_users(first_name, last_name)`)
                .eq('business_id', businessId)
                .eq('is_active', true);
            if (error) throw error;

            // Map
            const mapped = data.map(e => ({
                id: e.id,
                first_name: e.business_users?.first_name || 'Staff',
                last_name: e.business_users?.last_name || '',
                photo: e.photo,
                bio: e.bio
            }));
            return { data: mapped };
        },
        enabled: step >= 2
    });

    // Determine availability (Mocked logic for now as Supabase RPC usually needed for complex slots, or client-side calc)
    // We will simulate slots for simplicity in this frontend-only migration phase unless we build a query.
    // Let's assume 10am to 6pm hourly.
    const { data: slots, isLoading: loadingSlots } = useQuery({
        queryKey: ['availability', bookingData.service?.id, bookingData.employee?.id, bookingData.date],
        queryFn: async () => {
            // Check existing appointments on this day
            const { data: existing, error } = await supabase
                .from('appointments')
                .select('start_time, end_time')
                .eq('business_id', businessId)
                .eq('appointment_date', bookingData.date) // Assuming text date match YYYY-MM-DD
                .neq('status', 'cancelled');

            // Generate slots
            const allSlots = ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];
            // Filter out booked (This is rudimentary)
            // Real implementation needs full moment js overlap check + employee specific schedules

            return { data: allSlots };
        },
        enabled: !!bookingData.date && !!bookingData.service && step === 3
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            // 1. Create/Find Customer
            // Check by email
            let customerId;
            const { data: existingCust } = await supabase
                .from('customers')
                .select('id')
                .eq('email', data.email)
                .eq('business_id', businessId)
                .single();

            if (existingCust) {
                customerId = existingCust.id;
            } else {
                const { data: newCust, error: cErr } = await supabase
                    .from('customers')
                    .insert({
                        first_name: data.first_name,
                        last_name: data.last_name,
                        email: data.email,
                        phone: data.phone,
                        business_id: businessId
                    })
                    .select('id')
                    .single();
                if (cErr) throw cErr;
                customerId = newCust.id;
            }

            // 2. Create Appointment
            // Need start/end time
            const startDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
            const duration = bookingData.service.duration_minutes || 60;
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            const { error: aErr } = await supabase
                .from('appointments')
                .insert({
                    business_id: businessId,
                    customer_id: customerId,
                    service_id: bookingData.service.id,
                    employee_id: bookingData.employee?.id, // Nullable for "any"
                    appointment_date: bookingData.date,
                    start_time: startDateTime.toISOString(), // Postgres DB usually wants timestamptz
                    end_time: endDateTime.toISOString(), // Wait, schema check?
                    status: 'pending'
                });

            if (aErr) throw aErr;
        },
        onSuccess: () => setStep(5),
        onError: (err) => toast.error('Booking failed: ' + err.message)
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
        mutation.mutate(data);
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
