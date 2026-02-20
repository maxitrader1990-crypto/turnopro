import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

const localizer = momentLocalizer(moment);

// --- CYBERPUNK / TECH THEME STYLES ---
const calendarStyles = `
  /* Base Calendar */
  .rbc-calendar {
    font-family: 'Outfit', 'Inter', sans-serif;
    color: #e0e0e0;
  }

  /* Header Grid */
  .rbc-header {
    background: rgba(13, 13, 16, 0.8);
    color: #00f3ff; /* Cyan Neon */
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    padding: 16px 0;
    border-bottom: 2px solid rgba(0, 243, 255, 0.2) !important;
    text-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
  }

  /* Off-Range Days */
  .rbc-off-range-bg {
    background-color: rgba(0, 0, 0, 0.4) !important;
    background-image: radial-gradient(circle at center, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  /* Today Highlight */
  .rbc-today {
    background-color: rgba(0, 243, 255, 0.03) !important;
    border: 1px solid rgba(0, 243, 255, 0.1);
  }

  /* Grid Lines */
  .rbc-day-bg + .rbc-day-bg,
  .rbc-month-row + .rbc-month-row,
  .rbc-month-view,
  .rbc-day-view,
  .rbc-time-view,
  .rbc-header + .rbc-header,
  .rbc-day-slot .rbc-time-slot {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }

  /* Time Column */
  .rbc-timeslot-group, .rbc-time-content, .rbc-time-header-content {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
  
  .rbc-time-gutter .rbc-timeslot-group {
    color: #6b7280;
    font-size: 0.7rem;
    font-family: 'JetBrains Mono', monospace;
    border-color: rgba(255, 255, 255, 0.08) !important;
  }

  /* Current Time Indicator */
  .rbc-current-time-indicator {
    background-color: #ff0055 !important; /* Neon Pink */
    height: 2px;
    box-shadow: 0 0 8px rgba(255, 0, 85, 0.8);
  }

  /* Remove default event styles to use custom component fully */
  .rbc-event {
    background-color: transparent;
    border: none;
    padding: 1px;
    outline: none;
  }
`;

// --- MODERN TOOLBAR ---
const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToCurrent = () => toolbar.onNavigate('TODAY');

    const label = () => {
        const date = moment(toolbar.date);
        return (
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tighter flex items-center gap-3">
                <span className="uppercase">{date.format('MMMM')}</span>
                <span className="text-white/30 font-light">{date.format('YYYY')}</span>
            </span>
        );
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 p-1 gap-4">
            <div className="flex items-center gap-6 bg-black/20 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                <button onClick={goToBack} className="p-3 rounded-xl hover:bg-white/10 text-cyan-500 hover:text-cyan-300 transition-all active:scale-95">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center min-w-[220px] select-none">{label()}</div>
                <button onClick={goToNext} className="p-3 rounded-xl hover:bg-white/10 text-cyan-500 hover:text-cyan-300 transition-all active:scale-95">
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className="flex gap-3 bg-black/20 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                <button
                    onClick={goToCurrent}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
                >
                    HOY
                </button>
                <div className="w-[1px] bg-white/10 my-1 mx-2"></div>
                {['month', 'week', 'day'].map(view => (
                    <button
                        key={view}
                        onClick={() => toolbar.onView(view)}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all border ${toolbar.view === view
                            ? 'bg-white/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                            } uppercase tracking-wide`}
                    >
                        {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : 'Día'}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- TECH EVENT COMPONENT ---
const CustomEvent = ({ event }) => {
    const isCompleted = event.resource.status === 'completed';
    const isPending = event.resource.status === 'pending';

    return (
        <div className="relative group h-full w-full overflow-visible z-10">
            {/* Event Card */}
            <div className={`h-full w-full px-2 py-1.5 rounded-lg border-l-[3px] shadow-lg backdrop-blur-sm transition-all duration-300
                ${isCompleted
                    ? 'bg-green-500/10 border-green-500 text-green-100'
                    : 'bg-cyan-500/10 border-cyan-400 text-cyan-100'
                } 
                group-hover:scale-[1.03] group-hover:bg-opacity-20 group-hover:z-50 ring-1 ring-white/5`}
            >
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono opacity-80 leading-none mb-0.5 block">
                        {moment(event.start).format('HH:mm')}
                    </span>
                    {isCompleted && <CheckCircle size={10} className="text-green-400" />}
                </div>
                <div className="text-xs font-bold truncate leading-tight tracking-wide shadow-black drop-shadow-md">
                    {event.resource.customer_name}
                </div>
                <div className="text-[9px] truncate opacity-70 mt-0.5">
                    {event.resource.service_name}
                </div>
            </div>

            {/* HOVER HOLOGRAM CARD */}
            <div className="opacity-0 group-hover:opacity-100 absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 pointer-events-none z-[100] transition-all duration-300 scale-95 group-hover:scale-100">
                <div className="bg-[#0f1115] border border-cyan-500/30 rounded-2xl p-0 overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-3 border-b border-cyan-500/20 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400">ID: #{event.id.toString().slice(0, 4)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isCompleted ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'}`}>
                            {isCompleted ? 'COMPLETADO' : 'PENDIENTE'}
                        </span>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3 relative">
                        {/* Background Grid Effect */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

                        <div className="relative z-10">
                            <h4 className="text-white font-bold text-lg leading-tight">{event.resource.customer_name}</h4>
                            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                                <Clock size={12} className="text-cyan-500" />
                                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-2 border border-white/5 relative z-10">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Servicio</p>
                            <p className="text-sm font-medium text-cyan-100">{event.resource.service_name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarPage = () => {
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const queryClient = useQueryClient();

    const { data: appointmentData, refetch, isRefetching } = useQuery({
        queryKey: ['appointments', user?.business_id],
        queryFn: async () => {
            // 1. Validate User Context
            if (!user?.business_id) {
                console.warn("⚠️ Calendar: No business_id found for user.");
                return [];
            }

            console.log("🔄 Fetching Appointments for Business:", user.business_id);

            // 2. Fetch Data
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    start_time,
                    end_time,
                    status,
                    customers (first_name, last_name),
                    services (name, duration_minutes)
                `)
                .eq('business_id', user.business_id);

            if (error) {
                console.error("🔥 Error fetching appointments:", error);
                toast.error("Error al cargar turnos");
                throw error;
            }

            console.log("✅ Raw Appointments Data:", data);

            // 3. Robust Mapping
            const mapped = data.map(app => {
                try {
                    // Safe Date Parsing
                    // We treat appointment_date as the anchor YYYY-MM-DD
                    const dateAnchor = moment(app.appointment_date).format('YYYY-MM-DD');

                    // Parse start time (HH:mm:ss) strictly
                    const startMoment = app.start_time
                        ? moment(`${dateAnchor}T${app.start_time}`)
                        : moment(app.appointment_date); // Fallback to raw date if no time

                    // Calculate End Time
                    let endMoment;
                    if (app.end_time) {
                        endMoment = moment(`${dateAnchor}T${app.end_time}`);
                    } else {
                        // Default duration fallback
                        const duration = app.services?.duration_minutes || 60;
                        endMoment = startMoment.clone().add(duration, 'minutes');
                    }

                    return {
                        id: app.id,
                        title: `${app.customers?.first_name || 'Cliente'} ${app.customers?.last_name || ''}`,
                        start: startMoment.toDate(), // Convert moment to native JS Date for BigCalendar
                        end: endMoment.toDate(),
                        resource: {
                            ...app,
                            customer_name: `${app.customers?.first_name || 'Cliente'} ${app.customers?.last_name || ''}`,
                            service_name: app.services?.name || 'Servicio General',
                            status: app.status || 'pending'
                        }
                    };
                } catch (err) {
                    console.error("⚠️ Error mapping appointment:", app, err);
                    return null;
                }
            }).filter(Boolean); // Filter out any failed mappings

            console.log("📅 Mapped Events for Calendar:", mapped);
            return mapped;
        },
        enabled: !!user?.business_id,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    // --- REAL-TIME UPDATES ---
    React.useEffect(() => {
        if (!user?.business_id) return;

        const channel = supabase
            .channel('appointments-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'appointments',
                    filter: `business_id=eq.${user.business_id}`
                },
                (payload) => {
                    console.log("🔔 Real-time change detected:", payload);
                    toast.success('Agenda actualizada', { icon: '📅', duration: 2000 });
                    refetch(); // Trigger re-fetch
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.business_id, refetch]);

    const handleSelectEvent = (event) => setSelectedEvent(event);

    const completeMutation = useMutation({
        mutationFn: async (appointmentId) => {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appointmentId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('¡Turno completado!', { icon: '✅' });
            queryClient.invalidateQueries(['appointments']);
            setSelectedEvent(null);
        },
        onError: () => toast.error('Error al actualizar estado')
    });

    return (
        <div className="h-[calc(100vh-2rem)] bg-[#09090b] p-6 rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden flex flex-col">
            {/* Inject Custom Styles */}
            <style>{calendarStyles}</style>

            {/* Background Ambient Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Stats / Header Bar */}
            <div className="flex justify-between items-center mb-4 relative z-10 px-2">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">AGENDA <span className="text-cyan-400">DIGITAL</span></h1>
                    <p className="text-gray-500 text-xs font-mono">
                        {appointmentData?.length || 0} TURNOS REGISTRADOS
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 transition-all ${isRefetching ? 'animate-spin text-cyan-400' : ''}`}
                    title="Actualizar Agenda"
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                    </div>
                </button>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-4 backdrop-blur-md relative z-10">
                <BigCalendar
                    localizer={localizer}
                    events={appointmentData || []}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={handleSelectEvent}
                    views={['month', 'week', 'day']}
                    defaultView="week"
                    components={{
                        toolbar: CustomToolbar,
                        event: CustomEvent
                    }}
                    // Cyberpunk Settings
                    step={30}
                    timeslots={2}
                    min={new Date(0, 0, 0, 8, 0, 0)} // Start at 8 AM
                    max={new Date(0, 0, 0, 22, 0, 0)} // End at 10 PM
                />
            </div>

            {/* Appointment Detail Modal (Redesigned) */}
            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Detalles del Turno">
                {selectedEvent && (
                    <div className="space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -z-10"></div>

                        <div className="flex items-center gap-5 border-b border-gray-100/10 pb-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-3xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                                {selectedEvent.resource.customer_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white leading-none mb-1">{selectedEvent.resource.customer_name}</h3>
                                <p className="text-sm text-gray-500 font-mono">ID: {selectedEvent.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Servicio</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <Clock size={16} className="text-cyan-500" />
                                    {selectedEvent.resource.service_name}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Horario</p>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                                    {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estado Actual</span>
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                                ${selectedEvent.resource.status === 'completed'
                                    ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'}
                            `}>
                                {selectedEvent.resource.status === 'completed' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {selectedEvent.resource.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </span>
                        </div>

                        {selectedEvent.resource.status === 'pending' && (
                            <div className="pt-4">
                                <button
                                    onClick={() => completeMutation.mutate(selectedEvent.id)}
                                    disabled={completeMutation.isPending}
                                    className={`w-full py-4 rounded-xl text-white font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg relative overflow-hidden group ${completeMutation.isPending
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30'
                                        }`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {completeMutation.isPending ? 'Procesando...' : (
                                            <>
                                                <CheckCircle size={20} /> MARCAR COMO COMPLETADO
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CalendarPage;
