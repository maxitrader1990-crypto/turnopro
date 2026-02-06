import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader, CheckCircle, Calendar as CalendarIcon, Clock, User, Scissors, MessageCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { supabase } from '../../supabase';

// Helper to clean phone for WhatsApp
const cleanPhone = (phone) => phone?.replace(/[^0-9]/g, '') || '';

const BookingPage = () => {
    const { slug } = useParams();
    const [step, setStep] = useState(0); // 0 = Loading Business
    const [business, setBusiness] = useState(null);
    const [loadingError, setLoadingError] = useState(null);
    const [bookingData, setBookingData] = useState({
        service: null,
        employee: null,
        date: '',
        time: '',
    });
    const { register, handleSubmit, formState: { errors } } = useForm();

    // 1. Fetch Business by Slug
    useEffect(() => {
        const fetchBusiness = async () => {
            if (!slug) {
                setLoadingError("No se especificó un negocio.");
                return;
            }
            try {
                // Try searching by subdomain first
                let { data, error } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('subdomain', slug)
                    .maybeSingle();

                // If not found by subdomain, check if slug is a valid UUID before trying to query by ID
                if (!data && !error) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

                    if (isUuid) {
                        const { data: byId, error: errId } = await supabase
                            .from('businesses')
                            .select('*')
                            .eq('id', slug)
                            .maybeSingle();
                        data = byId;
                        error = errId;
                    }
                }

                if (error) {
                    console.error('Supabase Error:', error);
                    setLoadingError('Error técnico cargando negocio: ' + error.message);
                    return;
                }

                if (!data) {
                    setLoadingError('Negocio no encontrado. Verifica el enlace.');
                    return;
                }
                setBusiness(data);
                setStep(1); // Ready to start
            } catch (e) {
                console.error(e);
                setLoadingError('Error cargando negocio.');
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
                .is('deleted_at', null); // Check soft delete
            if (error) throw error;
            return data;
        },
        enabled: !!businessId
    });

    const { data: employees } = useQuery({
        queryKey: ['public', 'employees', businessId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('business_id', businessId)
                .is('deleted_at', null);
            if (error) throw error;
            return data;
        },
        enabled: !!businessId && step >= 2
    });

    const { data: slots } = useQuery({
        queryKey: ['availability', bookingData.service?.id, bookingData.employee?.id, bookingData.date],
        queryFn: async () => {
            // Mocked Availability for MVP
            return ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
        },
        enabled: !!bookingData.date && step === 3
    });

    const mutation = useMutation({
        mutationFn: async (formData) => {
            if (!businessId) throw new Error("Business ID missing");

            // 1. Find or Create Customer
            let customerId;
            let currentPoints = 0;
            let totalVisits = 0;

            const { data: existingCust } = await supabase
                .from('customers')
                .select('id, points, total_visits')
                .eq('email', formData.email)
                .eq('business_id', businessId)
                .maybeSingle();

            if (existingCust) {
                customerId = existingCust.id;
                currentPoints = existingCust.points || 0;
                totalVisits = existingCust.total_visits || 0;
            } else {
                const { data: newCust, error: cErr } = await supabase
                    .from('customers')
                    .insert({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        phone: formData.phone,
                        business_id: businessId,
                        points: 0,
                        total_visits: 0
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

            // 3. GAMIFICATION LOGIC (Award Points)
            if (business?.gamification_enabled) {
                let pointsEarned = 10; // Base points per booking

                // Bonus for Barba/Premium
                const serviceName = bookingData.service?.name?.toLowerCase() || '';
                const category = bookingData.service?.category?.toLowerCase() || '';

                if (serviceName.includes('barba') || serviceName.includes('premium') || category.includes('barba')) {
                    pointsEarned += 20;
                }

                // Or use specific service points if defined
                if (bookingData.service?.points_reward > 0) {
                    // Check if we should ADD or REPLACE. Usually replace if specific.
                    // But for this simple logic, let's just take the max if provided, or add?
                    // Let's use the service specific points as the base if > 0
                    pointsEarned = bookingData.service.points_reward;
                }

                const newTotalPoints = currentPoints + pointsEarned;
                const newTotalVisits = totalVisits + 1;

                // Update Customer
                await supabase
                    .from('customers')
                    .update({
                        points: newTotalPoints,
                        total_visits: newTotalVisits,
                        last_visit_date: new Date().toISOString()
                    })
                    .eq('id', customerId);
            }
        },
        onSuccess: () => setStep(5),
        onError: (err) => toast.error('Error: ' + err.message)
    });

    // WhatsApp Link Generator
    const getWhatsAppLink = (emp, serv, date, time) => {
        const phone = emp?.phone || '5492804976552';
        const clean = cleanPhone(phone);
        const pointsLink = `${window.location.origin}/points/${slug}`;
        const msg = `Hola ${emp?.first_name || 'TurnoPro'}, quiero confirmar mi turno para ${serv?.name} el ${date} a las ${time}.\n\nConsulta mis puntos aquí: ${pointsLink}`;
        return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    };

    if (loadingError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-800">{loadingError}</h2>
                <p className="text-gray-500 mt-2">Por favor contacta al administrador del negocio.</p>
            </div>
        );
    }

    if (step === 0) return <div className="h-screen flex items-center justify-center"><Loader className="animate-spin text-black" size={40} /></div>;

    const handleServiceSelect = (s) => { setBookingData({ ...bookingData, service: s }); setStep(2); };
    const handleEmployeeSelect = (e) => { setBookingData({ ...bookingData, employee: e }); setStep(3); };
    const handleTimeSelect = (t) => { setBookingData({ ...bookingData, time: t }); setStep(4); };
    const onSubmit = (d) => mutation.mutate(d);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col relative">
                {/* Header */}
                <div className="bg-black p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 opacity-90"></div>
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold uppercase tracking-wider">{business?.name}</h1>
                        <p className="opacity-70 text-sm mt-1">Reserva tu experiencia profesional</p>
                    </div>
                </div>

                <div className="flex-1 p-6 sm:p-8">
                    {/* STEP 1: SERVICES */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><Scissors className="text-gray-900" /> Elige un Servicio</h2>
                            {loadingServices ? <div className="flex justify-center p-8"><Loader className="animate-spin" /></div> : (
                                <div className="grid gap-3">
                                    {services?.length === 0 && <p className="text-center text-gray-500">No hay servicios disponibles.</p>}
                                    {services?.map(s => (
                                        <div key={s.id} onClick={() => handleServiceSelect(s)} className="p-4 border border-gray-100 rounded-xl hover:border-black hover:shadow-md cursor-pointer transition-all flex justify-between items-center group bg-white">
                                            <div>
                                                <span className="font-bold text-gray-800 text-lg group-hover:text-black">{s.name}</span>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><Clock size={14} />{s.duration_minutes} min</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-900 text-lg">${s.price}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: STAFF */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User /> Elige Profesional</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div onClick={() => handleEmployeeSelect(null)} className="p-4 border rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer text-center flex flex-col items-center justify-center min-h-[160px]">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-500 font-bold text-xl">?</div>
                                    <span className="font-bold block">Cualquiera</span>
                                    <span className="text-xs text-gray-500">Disponibilidad máxima</span>
                                </div>
                                {employees?.map(e => (
                                    <div key={e.id} onClick={() => handleEmployeeSelect(e)} className="p-4 border rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer text-center flex flex-col items-center min-h-[160px]">
                                        <img src={e.photo || `https://ui-avatars.com/api/?name=${e.first_name}&background=random`} alt={e.first_name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover shadow-sm" />
                                        <span className="font-bold block text-gray-900">{e.first_name}</span>
                                        <span className="text-xs text-gray-500">{e.title || 'Barbero'}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)} className="mt-8 text-gray-400 hover:text-black underline text-sm">Volver</button>
                        </div>
                    )}

                    {/* STEP 3: DATE & TIME */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon /> Fecha y Hora</h2>
                            <input
                                type="date"
                                className="w-full p-4 border border-gray-300 rounded-xl mb-6 text-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                            />
                            {bookingData.date && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-in fade-in">
                                    {slots?.map(t => (
                                        <button key={t} onClick={() => handleTimeSelect(t)} className="py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-black hover:text-white transition-all font-medium">{t}</button>
                                    ))}
                                </div>
                            )}
                            <div className="pt-6"><button onClick={() => setStep(2)} className="text-gray-400 hover:text-black underline text-sm">Volver</button></div>
                        </div>
                    )}

                    {/* STEP 4: CONFIRMATION FORM */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold mb-6">Completa tus datos</h2>

                            <div className="bg-gray-50 p-5 rounded-xl text-sm border-l-4 border-black mb-6 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Servicio:</span>
                                    <span className="font-bold text-gray-900">{bookingData.service?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Precio:</span>
                                    <span className="font-bold text-gray-900">${bookingData.service?.price}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Profesional:</span>
                                    <span className="font-bold text-gray-900">{bookingData.employee ? bookingData.employee.first_name : 'Cualquiera'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Fecha:</span>
                                    <span className="font-bold text-gray-900">{bookingData.date} - {bookingData.time}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <input {...register('first_name', { required: true })} placeholder="Nombre" className="p-3 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all" />
                                        {errors.first_name && <span className="text-xs text-red-500">Requerido</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <input {...register('last_name', { required: true })} placeholder="Apellido" className="p-3 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all" />
                                        {errors.last_name && <span className="text-xs text-red-500">Requerido</span>}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <input {...register('email', { required: true })} type="email" placeholder="Email (para avisos)" className="p-3 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all" />
                                    {errors.email && <span className="text-xs text-red-500">Requerido</span>}
                                </div>
                                <div className="space-y-1">
                                    <input {...register('phone', { required: true })} placeholder="WhatsApp (Ej: 2804...)" className="p-3 border rounded-lg w-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all" />
                                    {errors.phone && <span className="text-xs text-red-500">Requerido</span>}
                                </div>

                                <button type="submit" className="w-full btn-primary mt-6" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Confirmando...' : 'Confirmar Reserva'}
                                </button>
                            </form>
                            <div className="pt-4 text-center"><button onClick={() => setStep(3)} className="text-gray-400 hover:text-black underline text-sm">Volver</button></div>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {step === 5 && (
                        <div className="text-center py-10 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
                            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Tu turno ha sido agendado correctamente. Te hemos enviado un email con los detalles.</p>

                            <a
                                href={getWhatsAppLink(bookingData.employee, bookingData.service, bookingData.date, bookingData.time)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold hover:bg-[#20bd5a] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                <MessageCircle size={24} />
                                Confirmar por WhatsApp
                            </a>

                            <div className="mt-12 border-t pt-8">
                                <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-black underline text-sm">Reservar otro turno</button>
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
                className="fixed bottom-6 right-6 bg-white text-green-600 p-3 rounded-full shadow-lg border border-green-100 hover:scale-110 transition-all z-50 flex items-center gap-2 group"
            >
                <div className="bg-green-500 text-white rounded-full p-2">
                    <MessageCircle size={24} />
                </div>
                <span className="font-bold text-green-700 pr-2 hidden group-hover:block transition-all">¿Ayuda?</span>
            </a>
        </div>
    );
};

// Simple Error Boundary for the Booking Page
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("BookingPage Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
                    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
                    <p className="text-gray-500 mb-4">No pudimos cargar la página de reservas.</p>
                    <div className="bg-white p-4 rounded-lg shadow border border-red-100 max-w-md overflow-auto text-left">
                        <p className="font-mono text-xs text-red-600 break-all">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function BookingPageWithBoundary() {
    return (
        <ErrorBoundary>
            <BookingPage />
        </ErrorBoundary>
    );
}
