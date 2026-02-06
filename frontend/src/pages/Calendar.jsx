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

// --- CUSTOM STYLES FOR DARK THEME ---
const calendarStyles = `
  /* General Calendar Background */
  .rbc-calendar {
    font-family: 'Inter', sans-serif;
    color: #e5e7eb;
  }

  /* Header Grid */
  .rbc-header {
    background-color: rgba(255, 255, 255, 0.05); /* Premium Surface */
    color: #f59e0b; /* Urban Accent */
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  /* Off-Range Days */
  .rbc-off-range-bg {
    background-color: rgba(0, 0, 0, 0.2) !important;
  }

  /* Today Highlight */
  .rbc-today {
    background-color: rgba(245, 158, 11, 0.05) !important; /* Amber Tint */
  }

  /* Grid Lines */
  .rbc-day-bg + .rbc-day-bg,
  .rbc-month-row + .rbc-month-row,
  .rbc-month-view,
  .rbc-day-view,
  .rbc-time-view,
  .rbc-header + .rbc-header,
  .rbc-day-slot .rbc-time-slot {
    border-color: rgba(255, 255, 255, 0.05) !important;
  }

  /* Time Column */
  .rbc-timeslot-group, .rbc-time-content, .rbc-time-header-content {
    border-color: rgba(255, 255, 255, 0.05) !important;
  }
  
  .rbc-time-gutter .rbc-timeslot-group {
    color: #9ca3af; /* Gray 400 */
    font-size: 0.75rem;
    border-color: rgba(255, 255, 255, 0.05) !important;
  }

  /* Current Time Indicator */
  .rbc-current-time-indicator {
    background-color: #f59e0b !important;
  }
`;

// --- CUSTOM COMPONENTS ---

const CustomToolbar = (toolbar) => {
    const goToBack = () => { toolbar.onNavigate('PREV'); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); };
    const goToCurrent = () => { toolbar.onNavigate('TODAY'); };

    const label = () => {
        const date = moment(toolbar.date);
        return (
            <span className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <CalendarIcon className="text-urban-accent" size={20} />
                <span className="uppercase">{date.format('MMMM YYYY')}</span>
            </span>
        );
    };

    return (
        <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button onClick={goToBack} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center min-w-[200px]">{label()}</div>
                <button onClick={goToNext} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                    <ChevronRight size={24} />
                </button>
            </div>

            <div className="flex gap-2">
                <button onClick={goToCurrent} className="px-4 py-2 text-sm font-bold text-urban-accent border border-urban-accent/30 rounded-lg hover:bg-urban-accent hover:text-black transition-all">
                    HOY
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-2 self-center"></div>
                {['month', 'week', 'day'].map(view => (
                    <button
                        key={view}
                        onClick={() => toolbar.onView(view)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${toolbar.view === view
                            ? 'bg-white text-black shadow-lg shadow-white/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            } uppercase`}
                    >
                        {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : 'Día'}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CustomEvent = ({ event }) => {
    return (
        <div className="relative group h-full w-full">
            {/* Event Display */}
            <div className={`h-full w-full px-2 py-1 rounded-md border-l-4 shadow-sm transition-all duration-300
                ${event.resource.status === 'completed'
                    ? 'bg-green-900/40 border-green-500 text-green-100'
                    : 'bg-urban-accent/20 border-urban-accent text-urban-accent'
                } hover:scale-[1.02] hover:brightness-110`}
            >
                <div className="text-xs font-bold truncate">{event.resource.start_time ? moment(event.start).format('HH:mm') : ''}</div>
                <div className="text-xs font-semibold truncate">{event.resource.customer_name}</div>
            </div>

            {/* HOVER TOOLTIP / CARD */}
            <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-72 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl p-4 text-left relative overflow-hidden">
                    {/* Glow effect inside card */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-urban-accent/10 rounded-full blur-xl"></div>

                    <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-2">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-urban-accent font-bold">
                            {event.resource.customer_name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight">{event.resource.customer_name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <User size={10} /> Cliente
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Servicio:</span>
                            <span className="text-white font-medium text-right">{event.resource.service_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Horario:</span>
                            <span className="text-urban-accent font-mono text-xs bg-urban-accent/10 px-1.5 py-0.5 rounded">
                                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-400">Estado:</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
                                ${event.resource.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}
                            `}>
                                {event.resource.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-center text-gray-500 italic">
                        Click para ver detalles
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarPage = () => {
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState(null);

    const { data: appointments } = useQuery({
        queryKey: ['appointments', user?.business_id],
        queryFn: async () => {
            if (!user?.business_id) return { data: [] };

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
                console.error("Error fetching appointments:", error);
                throw error;
            }

            // Map to event format
            const mapped = data.map(app => {
                let start = app.start_time ? new Date(app.start_time) : new Date(app.appointment_date);
                let end = app.end_time ? new Date(app.end_time) : null;

                if (!end) {
                    const duration = app.services?.duration_minutes || 60;
                    end = new Date(start.getTime() + duration * 60000);
                }

                return {
                    id: app.id,
                    customer_name: `${app.customers?.first_name || 'Cliente'} ${app.customers?.last_name || ''}`,
                    service_name: app.services?.name || 'Servicio',
                    start: start,
                    end: end,
                    status: app.status || 'pending'
                };
            });

            return { data: mapped };
        },
        enabled: !!user?.business_id
    });

    const events = appointments?.data?.map(app => ({
        id: app.id,
        title: `${app.customer_name}`,
        start: app.start,
        end: app.end,
        resource: app
    })) || [];

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

    const queryClient = useQueryClient();

    const completeMutation = useMutation({
        mutationFn: async (appointmentId) => {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appointmentId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Cita completada con éxito');
            queryClient.invalidateQueries(['appointments']);
            setSelectedEvent(null);
        },
        onError: (error) => {
            console.error('Error completing appointment:', error);
            toast.error('Error al completar la cita');
        }
    });

    return (
        <div className="h-[85vh] bg-premium-bg p-6 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
            {/* Inject Custom Styles */}
            <style>{calendarStyles}</style>

            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-urban-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

            <BigCalendar
                localizer={localizer}
                events={events}
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
            />

            {/* Appointment Detail Modal */}
            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Detalles del Turno">
                {selectedEvent && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="w-16 h-16 rounded-full bg-urban-accent/10 flex items-center justify-center text-urban-accent font-bold text-2xl">
                                {selectedEvent.resource.customer_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.resource.customer_name}</h3>
                                <p className="text-sm text-gray-500">Cliente Recurrente</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Servicio</p>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Clock size={16} className="text-urban-accent" />
                                    {selectedEvent.resource.service_name}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Horario</p>
                                <p className="font-semibold text-gray-800">
                                    {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Estado Actual</p>
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold
                                ${selectedEvent.resource.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                            `}>
                                {selectedEvent.resource.status === 'completed' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <span className="capitalize">
                                    {selectedEvent.resource.status === 'completed' ? 'Completado' :
                                        selectedEvent.resource.status === 'pending' ? 'Pendiente' : selectedEvent.resource.status}
                                </span>
                            </span>
                        </div>

                        {selectedEvent.resource.status === 'pending' && (
                            <div className="pt-6">
                                <button
                                    onClick={() => completeMutation.mutate(selectedEvent.id)}
                                    disabled={completeMutation.isPending}
                                    className={`w-full py-3 rounded-xl text-white font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg ${completeMutation.isPending
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                        }`}
                                >
                                    {completeMutation.isPending ? 'Procesando...' : 'Marcar como Completado'}
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
