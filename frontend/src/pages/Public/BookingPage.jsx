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
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-premium-bg text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold">{loadingError}</h2>
                <p className="text-gray-400 mt-2">Por favor contacta al administrador del negocio.</p>
            </div>
        );
    }

    if (step === 0) return (
        <div className="h-screen flex items-center justify-center bg-premium-bg">
            <Loader className="animate-spin text-urban-accent" size={40} />
        </div>
    );

    const handleServiceSelect = (s) => { setBookingData({ ...bookingData, service: s }); setStep(2); };
    const handleEmployeeSelect = (e) => { setBookingData({ ...bookingData, employee: e }); setStep(3); };
    const handleTimeSelect = (t) => { setBookingData({ ...bookingData, time: t }); setStep(4); };
    const onSubmit = (d) => mutation.mutate(d);

    return (
        <div className="min-h-screen bg-premium-bg flex flex-col items-center p-4">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-urban-secondary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-urban-accent/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-3xl w-full bg-premium-card backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden min-h-[600px] flex flex-col relative z-10 animate-fade-in-up">

                {/* Header with Cover Image */}
                <div className="relative h-56 w-full overflow-hidden group">
                    {/* Cover Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1585747860715-28b9634317a2?q=80&w=2070&auto=format&fit=crop')` }}
                    ></div>

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 w-full p-8 text-center sm:text-left z-10 flex flex-col sm:flex-row items-end gap-6 animate-fade-in-up">
                        {/* Optional Logo/Avatar Placeholder if we wanted */}
                        {/* <div className="w-20 h-20 rounded-full bg-urban-accent border-4 border-black shadow-xl hidden sm:block"></div> */}

                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {business?.name?.replace(/([a-z])([A-Z])/g, '$1 $2').replace('PATAGONIAAUTOMATIZA', 'PATAGONIA AUTOMATIZA')}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                                <span className="bg-urban-accent text-black text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Premium</span>
                                <p className="text-gray-300 text-sm font-medium tracking-wide">Experiencia de Lujo</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-6 sm:p-10">
                    {/* STEP 1: SERVICES */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                                <Scissors className="text-urban-accent" />
                                Elige un Servicio
                            </h2>

                            {loadingServices ? (
                                <div className="flex justify-center p-8"><Loader className="animate-spin text-urban-accent" /></div>
                            ) : (
                                <div className="grid gap-4">
                                    {services?.length === 0 && <p className="text-center text-gray-500">No hay servicios disponibles.</p>}
                                    {services?.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => handleServiceSelect(s)}
                                            className="p-5 border border-white/5 bg-white/5 rounded-2xl hover:border-urban-accent/50 hover:bg-white/10 hover:scale-[1.02] cursor-pointer transition-all duration-300 group flex justify-between items-center"
                                        >
                                            <div>
                                                <span className="font-bold text-gray-100 text-lg group-hover:text-white transition-colors">{s.name}</span>
                                                <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                                        <Clock size={14} className="text-urban-accent" /> {s.duration_minutes} min
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-urban-accent text-xl group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all">
                                                ${s.price}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: STAFF */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                                <User className="text-urban-accent" />
                                Elige Profesional
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                <div
                                    onClick={() => handleEmployeeSelect(null)}
                                    className="p-6 border border-white/5 bg-white/5 rounded-2xl hover:border-urban-accent/50 hover:bg-white/10 cursor-pointer text-center flex flex-col items-center justify-center min-h-[180px] transition-all duration-300 group"
                                >
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400 font-bold text-2xl group-hover:text-white group-hover:bg-urban-accent/20 transition-all border border-white/5 group-hover:border-urban-accent/30">?</div>
                                    <span className="font-bold block text-white mb-1">Cualquiera</span>
                                    <span className="text-xs text-gray-400 group-hover:text-urban-accent transition-colors">Disponibilidad máxima</span>
                                </div>

                                {employees?.map(e => (
                                    <div
                                        key={e.id}
                                        onClick={() => handleEmployeeSelect(e)}
                                        className="p-6 border border-white/5 bg-white/5 rounded-2xl hover:border-urban-accent/50 hover:bg-white/10 cursor-pointer text-center flex flex-col items-center min-h-[180px] transition-all duration-300 group"
                                    >
                                        <div className="relative mb-4">
                                            <div className="absolute inset-0 bg-urban-accent rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                                            <img
                                                src={e.photo || `https://ui-avatars.com/api/?name=${e.first_name}&background=1f1f23&color=fff`}
                                                alt={e.first_name}
                                                className="relative w-20 h-20 rounded-full object-cover shadow-lg border-2 border-transparent group-hover:border-urban-accent transition-all"
                                            />
                                        </div>
                                        <span className="font-bold block text-white text-lg">{e.first_name}</span>
                                        <span className="text-xs text-urban-accent uppercase tracking-wider font-medium mt-1">{e.title || 'Specialist'}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)} className="mt-8 text-gray-500 hover:text-white underline text-sm transition-colors">Volver</button>
                        </div>
                    )}

                    {/* STEP 3: DATE & TIME */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                                <CalendarIcon className="text-urban-accent" />
                                Fecha y Hora
                            </h2>

                            <input
                                type="date"
                                className="w-full p-4 border border-white/10 bg-black/20 rounded-xl mb-8 text-lg text-white font-medium focus:ring-1 focus:ring-urban-accent focus:border-urban-accent outline-none transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                style={{ colorScheme: 'dark' }}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                            />

                            {bookingData.date && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-in fade-in">
                                    {slots?.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => handleTimeSelect(t)}
                                            className="py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-urban-accent hover:text-black hover:border-urban-accent hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all font-bold text-gray-300"
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="pt-6"><button onClick={() => setStep(2)} className="text-gray-500 hover:text-white underline text-sm transition-colors">Volver</button></div>
                        </div>
                    )}

                    {/* STEP 4: CONFIRMATION FORM */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold mb-6 text-white text-center">Completa tus datos</h2>

                            <div className="bg-white/5 p-6 rounded-2xl text-sm border-l-4 border-urban-accent mb-8 space-y-3 shadow-lg">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-400">Servicio</span>
                                    <span className="font-bold text-white text-base">{bookingData.service?.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-400">Precio</span>
                                    <span className="font-bold text-urban-accent text-base">${bookingData.service?.price}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-gray-400">Profesional</span>
                                    <span className="font-bold text-white">{bookingData.employee ? bookingData.employee.first_name : 'Cualquiera'}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-gray-400">Fecha</span>
                                    <span className="font-bold text-white uppercase tracking-wider">{bookingData.date} • {bookingData.time}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <input
                                            {...register('first_name', { required: true })}
                                            placeholder="Nombre"
                                            className="input-urban w-full"
                                        />
                                        {errors.first_name && <span className="text-xs text-red-400">Requerido</span>}
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            {...register('last_name', { required: true })}
                                            placeholder="Apellido"
                                            className="input-urban w-full"
                                        />
                                        {errors.last_name && <span className="text-xs text-red-400">Requerido</span>}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <input
                                        {...register('email', { required: true })}
                                        type="email"
                                        placeholder="Email (para avisos)"
                                        className="input-urban w-full"
                                    />
                                    {errors.email && <span className="text-xs text-red-400">Requerido</span>}
                                </div>
                                <div className="space-y-1">
                                    <input
                                        {...register('phone', { required: true })}
                                        placeholder="WhatsApp (Ej: 2804...)"
                                        className="input-urban w-full"
                                    />
                                    {errors.phone && <span className="text-xs text-red-400">Requerido</span>}
                                </div>

                                <button type="submit" className="w-full btn-urban mt-6 text-lg tracking-wide uppercase" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Confirmando...' : 'Confirmar Reserva'}
                                </button>
                            </form>
                            <div className="pt-4 text-center"><button onClick={() => setStep(3)} className="text-gray-500 hover:text-white underline text-sm transition-colors">Volver</button></div>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {step === 5 && (
                        <div className="text-center py-12 animate-in zoom-in duration-500">
                            <div className="relative w-28 h-28 mx-auto mb-8">
                                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-premium-bg">
                                    <CheckCircle size={56} className="text-white drop-shadow-md" />
                                </div>
                            </div>

                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">¡Confirmado!</h2>
                            <p className="text-gray-400 mb-10 max-w-sm mx-auto text-lg">Tu turno ha sido agendado. Te enviamos los detalles por email.</p>

                            <a
                                href={getWhatsAppLink(bookingData.employee, bookingData.service, bookingData.date, bookingData.time)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#1faa53] transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] transform hover:-translate-y-1"
                            >
                                <MessageCircle size={24} />
                                <span>Confirmar por WhatsApp</span>
                            </a>

                            <div className="mt-16 border-t border-white/5 pt-8">
                                <button onClick={() => window.location.reload()} className="text-urban-accent hover:text-white hover:underline text-sm font-medium transition-colors">Reservar otro turno</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pb-6 text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white">Powered by <span className="font-bold text-urban-accent">Patagonia Automatiza</span></p>
                </div>
            </div>

            {/* Sticky WhatsApp Help Button */}
            <a
                href="https://wa.me/5492804976552?text=Hola,%20tengo%20una%20consulta%20sobre%20turnos."
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-6 right-6 bg-premium-card backdrop-blur-md border border-white/10 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center gap-3 group overflow-hidden pr-0 hover:pr-4"
            >
                <div className="bg-[#25D366] text-white rounded-full p-2 shadow-[0_0_10px_rgba(37,211,102,0.4)]">
                    <MessageCircle size={24} />
                </div>
                <span className="font-bold text-white hidden group-hover:block transition-all whitespace-nowrap">¿Necesitas ayuda?</span>
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
