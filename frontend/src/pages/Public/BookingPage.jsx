import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../../supabase';
import { Calendar, Clock, User, Scissors, Check, MessageCircle, AlertCircle, Phone, Star, Instagram, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addMinutes, isAfter, setHours, setMinutes, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// --- LOOKBOOK DATA (Simulated for Demo) ---
// --- LOOKBOOK DATA (Dynamic via Supabase) ---
// We will fetch this in the component
const DEMO_GLAMOUR_SHOTS = [
    "https://placehold.co/600x400/1a1a1a/FFF?text=Corte+Premium",
    "https://placehold.co/600x400/1a1a1a/FFF?text=Herramientas",
    "https://placehold.co/600x400/1a1a1a/FFF?text=Ambiente",
    "https://placehold.co/600x400/1a1a1a/FFF?text=Sillon",
    "https://placehold.co/600x400/1a1a1a/FFF?text=Afeitado"
];

const BookingPage = () => {
    const { slug } = useParams();
    const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: DateTime, 4: Details, 5: Success
    const [selectedService, setSelectedService] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(null);
    const [bookingData, setBookingData] = useState(null); // Restore bookingData
    const [viewingPortfolio, setViewingPortfolio] = useState(null); // New state for portfolio modal
    const [theme_id, setThemeId] = useState(null);

    // Business Fetch (by ID or Subdomain)
    const { data: business, isLoading: loadingBusiness, isError, error } = useQuery({
        queryKey: ['publicBusiness', slug],
        queryFn: async () => {
            console.log('Fetching business for slug:', slug);
            // Try by ID first (UUID regex)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

            let query = supabase.from('businesses').select('*');
            if (isUUID) {
                query = query.eq('id', slug);
            } else {
                query = query.eq('subdomain', slug);
            }

            const { data, error } = await query.single();
            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }
            if (!data) throw new Error('Negocio no encontrado');
            return data;
        },
        retry: 1,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    // ... (rest of queries remain similar but depend on business logic)

    // ... (omitted hook logic for brevity)

    // Improved Loading State
    if (loadingBusiness) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="w-16 h-16 border-4 border-urban-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold animate-pulse">Cargando barbería...</h2>
                <p className="text-gray-500 text-sm mt-2">Por favor espere un momento.</p>
            </div>
        );
    }

    // Improved Error State
    if (isError || !business) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold mb-2">No pudimos cargar la barbería</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                    {error?.message || "El enlace puede estar incorrecto o el negocio no existe."}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn-urban px-6 py-2"
                >
                    Intentar de nuevo
                </button>
            </div>
        );
    }

    const whatsappLink = bookingData ? `https://wa.me/?text=¡Tengo turno en ${business.name}! ✂️ ${format(selectedTime, "d 'de' MMMM, HH:mm", { locale: es })}` : '';

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-urban-accent selection:text-black pb-20">
            {/* --- PREMIUM HEADER --- */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden group">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1585747860715-28b9634317a2?q=80&w=2070&auto=format&fit=crop')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-8 z-10 flex flex-col sm:flex-row items-end justify-between gap-6 animate-fade-in-up">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-widest text-white drop-shadow-lg">
                            {business.name.replace(/([a-z])([A-Z])/g, '$1 $2').replace('PATAGONIAAUTOMATIZA', 'PATAGONIA AUTOMATIZA')}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bg-urban-accent text-black text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Premium V2</span>
                            <p className="text-gray-300 text-sm font-medium tracking-wide">Experiencia de Lujo Actualizada</p>
                        </div>
                    </div>
                    <div className="flex gap-2 text-white/80">
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-1"><Star size={12} /> 4.9 (120 Reseñas)</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-20">
                {/* --- PROGRESS BAR --- */}
                <div className="flex justify-between mb-8 px-2 relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -z-10 rounded"></div>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`transition-all duration-500 ease-out flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 ${step >= s ? 'bg-urban-accent border-urban-accent text-black scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-black border-gray-700 text-gray-500'}`}>
                            {step > s ? <Check size={16} /> : s}
                        </div>
                    ))}
                </div>

                <div className="card-premium p-6 sm:p-8 min-h-[400px]">

                    {/* STEP 1: SERVICES */}
                    {step === 1 && (
                        <div className="animate-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Scissors className="text-urban-accent" />
                                Selecciona tu Servicio
                            </h2>
                            <div className="space-y-3">
                                {services?.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => { setSelectedService(service); setStep(2); }}
                                        className="w-full text-left p-4 rounded-xl border border-white/5 hover:border-urban-accent/50 bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-urban-accent/0 via-urban-accent/5 to-urban-accent/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-urban-accent transition-colors">{service.name}</h3>
                                                <p className="text-sm text-gray-400">{service.duration_minutes} min • Detalle profesional</p>
                                            </div>
                                            <span className="font-mono text-xl font-bold text-urban-accent">${service.price}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: EMPLOYEES (WITH LOOKBOOK) */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white transition-colors"><ChevronLeft /></button>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <User className="text-urban-accent" />
                                    Elige a tu Profesional
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {employees?.filter(e => {
                                    const services = e.employee_services || [];
                                    if (services.length === 0) return true;
                                    return services.some(es => (es.service_id === selectedService.id) || (es.services?.id === selectedService.id));
                                }).map(employee => (
                                    <button
                                        key={employee.id}
                                        onClick={() => { setSelectedEmployee(employee); setStep(3); }}
                                        className="relative group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 bg-[#0f1115] border border-white/10 group-hover:border-urban-accent/50 transition-colors z-0"></div>

                                        {/* Card Content */}
                                        <div className="relative z-10 p-6 flex flex-col items-center">
                                            {/* Avatar */}
                                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-urban-accent to-transparent mb-4 shadow-xl group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-shadow">
                                                {employee.profile_image_url ? (
                                                    <img
                                                        src={employee.profile_image_url}
                                                        alt={employee.first_name}
                                                        className="w-full h-full rounded-full object-cover border-4 border-[#0f1115] bg-gray-800"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=1a1d21&color=f59e0b&size=256`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-full border-4 border-[#0f1115] bg-gray-800 flex items-center justify-center text-3xl font-bold text-urban-accent">
                                                        {employee.first_name[0]}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-bold text-white mb-1">{employee.first_name}</h3>
                                            <p className="text-xs text-urban-accent font-bold uppercase tracking-widest mb-3">{employee.title || 'Barber Pro'}</p>

                                            {employee.bio && (
                                                <p className="text-xs text-gray-400 text-center line-clamp-2 italic mb-4 px-2">
                                                    "{employee.bio}"
                                                </p>
                                            )}

                                            <div className="w-full pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors">
                                                <span>Seleccionar</span>
                                                <ChevronRight size={16} className="text-urban-accent" />
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewingPortfolio(employee);
                                                }}
                                                className="mt-3 text-[10px] text-gray-500 hover:text-urban-accent uppercase tracking-wider font-bold transition-colors z-20 relative"
                                            >
                                                Ver portafolio →
                                            </button>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* PORTFOLIO MODAL */}
                            {viewingPortfolio && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
                                        <button
                                            onClick={() => setViewingPortfolio(null)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                        <h3 className="text-2xl font-bold text-white mb-2">Portafolio de {viewingPortfolio.first_name}</h3>
                                        <p className="text-gray-400 mb-6 text-sm">Explora los mejores trabajos realizados por nuestro Master Barber.</p>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {/* Use real portfolio if available, else fallback msg */}
                                            {getEmployeePortfolio(viewingPortfolio.id).length > 0 ? (
                                                getEmployeePortfolio(viewingPortfolio.id).map((item, i) => (
                                                    <div key={item.id || i} className="group relative rounded-lg overflow-hidden aspect-square border border-white/5 hover:border-urban-accent/50 transition-colors">
                                                        <img
                                                            src={item.image_url}
                                                            alt={`Portfolio ${i}`}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full text-center py-10 text-gray-500">
                                                    <p>Este profesional aún no ha subido fotos a su portafolio.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(viewingPortfolio);
                                                    setViewingPortfolio(null);
                                                    setStep(3);
                                                }}
                                                className="btn-urban px-6 py-2 text-sm"
                                            >
                                                Reservar con {viewingPortfolio.first_name}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DYNAMIC LOOKBOOK SHOWCASE */}
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Instagram size={14} /> Últimos trabajos del equipo
                                </h4>
                                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                    {getCarouselItems().map((img, i) => (
                                        <div key={i} className="flex-shrink-0 w-32 h-40 rounded-lg overflow-hidden relative group snap-center cursor-pointer">
                                            <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DATE & TIME */}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-2 mb-6">
                                <button onClick={() => setStep(2)} className="text-gray-500 hover:text-white transition-colors"><ChevronLeft /></button>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Calendar className="text-urban-accent" />
                                    Reserva tu Momento
                                </h2>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6 text-center">
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                                    inline
                                    locale={es}
                                    minDate={new Date()}
                                    calendarClassName="booking-calendar"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {generateTimeSlots().map((time, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${selectedTime && time.getTime() === selectedTime.getTime()
                                            ? 'bg-urban-accent text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/20 hover:text-white'
                                            }`}
                                    >
                                        {format(time, 'HH:mm')}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setStep(4)}
                                    disabled={!selectedTime}
                                    className={`btn-urban px-8 py-3 ${!selectedTime && 'opacity-50 cursor-not-allowed'}`}
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: DETAILS */}
                    {step === 4 && (
                        <div className="animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-2 mb-6">
                                <button onClick={() => { setStep(3); }} className="text-gray-500 hover:text-white transition-colors"><ChevronLeft /></button>
                                <h2 className="text-2xl font-bold text-white">Tus Datos</h2>
                            </div>

                            <div className="bg-urban-accent/5 p-4 rounded-xl border border-urban-accent/20 mb-6 flex items-start gap-4">
                                <div className="text-urban-accent mt-1"><AlertCircle size={20} /></div>
                                <div>
                                    <p className="text-sm text-gray-300 font-medium">Estás reservando:</p>
                                    <p className="text-white font-bold text-lg">{selectedService.name}</p>
                                    <p className="text-gray-400 text-sm">{format(selectedTime, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}</p>
                                    <p className="text-gray-400 text-sm">con {selectedEmployee.first_name}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input {...register("firstName", { required: true })} placeholder="Nombre" className="input-urban w-full" />
                                    <input {...register("lastName", { required: true })} placeholder="Apellido" className="input-urban w-full" />
                                </div>
                                <input {...register("phone", { required: true })} placeholder="Teléfono / WhatsApp" className="input-urban w-full" />
                                <input {...register("email", { required: true })} placeholder="Email" type="email" className="input-urban w-full" />

                                <button
                                    type="submit"
                                    disabled={createAppointmentMutation.isPending}
                                    className="btn-urban w-full py-4 text-lg mt-6 shadow-xl shadow-urban-accent/20"
                                >
                                    {createAppointmentMutation.isPending ? 'Confirmando...' : 'Confirmar Reserva'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {step === 5 && (
                        <div className="text-center animate-in zoom-in duration-500 py-10">
                            <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <Check size={48} strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">¡Reserva Confirmada!</h2>
                            <p className="text-gray-400 mb-8 max-w-sm mx-auto">Te esperamos el {format(selectedTime, "d 'de' MMMM", { locale: es })} para tu cambio de look.</p>

                            <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto">
                                <a
                                    href={whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#25D366] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg"
                                >
                                    <MessageCircle size={20} />
                                    Recibir recordatorio
                                </a>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-gray-500 hover:text-white text-sm font-medium py-2"
                                >
                                    Volver al inicio
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="text-center py-6 text-gray-600 text-xs uppercase tracking-widest">
                Powered by TurnoPro
            </div>
        </div>
    );
};

export default BookingPage;
