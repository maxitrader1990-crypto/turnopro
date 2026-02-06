import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader, CheckCircle, Calendar as CalendarIcon, Clock, User, Scissors, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '../../supabase';

// Helper to clean phone for WhatsApp
const cleanPhone = (phone) => phone?.replace(/[^0-9]/g, '') || '';

const BookingPage = () => {
    const { slug } = useParams();
    const [step, setStep] = useState(0); // 0 = Loading Business
    const [business, setBusiness] = useState(null);
    const [bookingData, setBookingData] = useState({
        service: null,
        employee: null,
        date: '',
        time: '',
    });
    const { register, handleSubmit } = useForm();

    // 1. Fetch Business by Slug
    useEffect(() => {
        const fetchBusiness = async () => {
            if (!slug) return;
            try {
                const { data, error } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('subdomain', slug)
                    .single();

                if (error || !data) {
                    toast.error('Negocio no encontrado');
                    return;
                }
                setBusiness(data);
                setStep(1); // Ready to start
            } catch (e) {
                console.error(e);
                toast.error('Error cargando negocio');
            }
        };
        fetchBusiness();
    }, [slug]);

    const businessId = business?.id;

    // Queries (Enabled only when businessId exists)
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
        },
        enabled: !!businessId
    });

    const { data: employees } = useQuery({
        queryKey: ['public', 'employees', businessId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*') // Select all columns including new phone/names
                .eq('business_id', businessId)
                .is('deleted_at', null); // Soft delete check?
            if (error) throw error;

            return {
                data: data.map(e => ({
                    id: e.id,
                    first_name: e.first_name || 'Staff',
                    last_name: e.last_name || '',
                    phone: e.phone,
                    photo: e.photo,
                    bio: e.bio,
                    title: e.title
                }))
            };
        },
        enabled: !!businessId && step >= 2
    });

    // ... (Slots logic remains similar)
    const { data: slots, isLoading: loadingSlots } = useQuery({
        queryKey: ['availability', bookingData.service?.id, bookingData.employee?.id, bookingData.date],
        queryFn: async () => {
            // Mocked for MVP
            return { data: ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00'] };
        },
        enabled: !!bookingData.date && step === 3
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            // ... (Keep existing customer/appointment logic, just verify ID usage)
            // 1. Find/Create Customer
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
            const startDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
            const duration = bookingData.service.duration_minutes || 60;
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            const { error: aErr } = await supabase
                .from('appointments')
                .insert({
                    business_id: businessId,
                    customer_id: customerId,
                    service_id: bookingData.service.id,
                    employee_id: bookingData.employee?.id,
                    appointment_date: bookingData.date,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    status: 'pending'
                });

            if (aErr) throw aErr;
        },
        onSuccess: () => setStep(5),
        onError: (err) => toast.error('Error: ' + err.message)
    });

    // WhatsApp Link Generator
    const getWhatsAppLink = (emp, serv, date, time) => {
        const phone = emp?.phone || '5492804976552'; // Specific fallback as requested
        const clean = cleanPhone(phone);
        const msg = `Hola ${emp?.first_name || 'TurnoPro'}, quiero confirmar mi turno para ${serv?.name} el ${date} a las ${time}.`;
        return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    };

    if (step === 0 && !business) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

    const handleServiceSelect = (s) => { setBookingData({ ...bookingData, service: s }); setStep(2); };
    const handleEmployeeSelect = (e) => { setBookingData({ ...bookingData, employee: e }); setStep(3); };
    const handleTimeSelect = (t) => { setBookingData({ ...bookingData, time: t }); setStep(4); };
    const onSubmit = (d) => mutation.mutate(d);

    const slotList = slots?.data || [];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">{business?.name || 'Reserva tu Turno'}</h1>
                    <p className="opacity-70 text-sm">Reserva profesional en segundos</p>
                </div>

                <div className="flex-1 p-8">
                    {/* Steps 1-4 (Keep mostly same structure but valid data) */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><Scissors /> Elige un Servicio</h2>
                            {loadingServices ? <Loader className="animate-spin" /> : (
                                <div className="grid gap-3">
                                    {services?.data?.map(s => (
                                        <div key={s.id} onClick={() => handleServiceSelect(s)} className="p-4 border rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer transition-all flex justify-between items-center">
                                            <div><span className="font-bold text-gray-800">{s.name}</span><p className="text-sm text-gray-500">{s.duration_minutes} min</p></div>
                                            <span className="font-bold text-gray-900">${s.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User /> Elige Profesional</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {employees?.data?.map(e => (
                                    <div key={e.id} onClick={() => handleEmployeeSelect(e)} className="p-4 border rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer text-center">
                                        <img src={e.photo || `https://ui-avatars.com/api/?name=${e.first_name}&background=random`} alt={e.first_name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                                        <span className="font-bold block">{e.first_name}</span>
                                        <span className="text-xs text-gray-500">{e.title}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)} className="mt-8 text-gray-400">Volver</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon /> Fecha y Hora</h2>
                            <input type="date" className="w-full p-3 border rounded-lg mb-4" min={new Date().toISOString().split('T')[0]} onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })} />
                            <div className="grid grid-cols-4 gap-2">
                                {slotList.map(t => (
                                    <button key={t} onClick={() => handleTimeSelect(t)} className="py-2 bg-gray-100 rounded hover:bg-black hover:text-white transition-colors">{t}</button>
                                ))}
                            </div>
                            <div className="pt-6"><button onClick={() => setStep(2)} className="text-gray-400">Volver</button></div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4">Tus Datos</h2>
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm border-l-4 border-black">
                                <p><strong>Servicio:</strong> {bookingData.service?.name}</p>
                                <p><strong>Profesional:</strong> {bookingData.employee?.first_name}</p>
                                <p><strong>Fecha:</strong> {bookingData.date} a las {bookingData.time}</p>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input {...register('first_name', { required: true })} placeholder="Nombre" className="p-3 border rounded-lg w-full" />
                                    <input {...register('last_name', { required: true })} placeholder="Apellido" className="p-3 border rounded-lg w-full" />
                                </div>
                                <input {...register('email', { required: true })} type="email" placeholder="Email" className="p-3 border rounded-lg w-full" />
                                <input {...register('phone', { required: true })} placeholder="Teléfono" className="p-3 border rounded-lg w-full" />
                                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 mt-4 shadow-lg" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Confirmando...' : 'Confirmar Turno'}
                                </button>
                            </form>
                            <div className="pt-2"><button onClick={() => setStep(3)} className="text-gray-400">Volver</button></div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Turno Confirmado!</h2>
                            <p className="text-gray-500 mb-8">Te esperamos.</p>

                            <a
                                href={getWhatsAppLink(bookingData.employee, bookingData.service, bookingData.date, bookingData.time)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-colors shadow-lg animate-pulse"
                            >
                                <MessageCircle size={24} />
                                Confirmar por WhatsApp
                            </a>

                            <div className="mt-8">
                                <button onClick={() => window.location.reload()} className="text-gray-400 underline">Reservar Otro</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky WhatsApp Help Button */}
            <a
                href="https://wa.me/5492804976552?text=Hola,%20tengo%20una%20consulta%20sobre%20turnos."
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 transition-all z-50 flex items-center gap-2"
            >
                <MessageCircle size={28} />
                <span className="font-bold hidden sm:inline">Consultar</span>
            </a>
        </div>
    );
};

export default BookingPage;
