import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState(null);

    const { data: appointments } = useQuery({
        queryKey: ['appointments', user?.business_id],
        queryFn: async () => {
            if (!user?.business_id) return { data: [] };

            console.log("Fetching appointments for business:", user.business_id);

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

            console.log("Raw appointments data:", data);

            // Map to event format
            const mapped = data.map(app => {
                // Use explicit start_time if available, otherwise fallback to appointment_date (legacy)
                let start = app.start_time ? new Date(app.start_time) : new Date(app.appointment_date);
                let end = app.end_time ? new Date(app.end_time) : null;

                // Fallback for end time calculation
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
        title: `${app.customer_name} - ${app.service_name}`,
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
        <div className="h-[80vh] bg-white p-4 rounded-xl shadow-sm">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                views={['month', 'week', 'day']}
                defaultView="week"
            />

            {/* Appointment Detail Modal */}
            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Detalles del Turno">
                {selectedEvent && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cliente</p>
                            <p className="text-lg font-bold">{selectedEvent.resource.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Servicio</p>
                            <p>{selectedEvent.resource.service_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Horario</p>
                            <p>{moment(selectedEvent.start).format('LLL')} - {moment(selectedEvent.end).format('LT')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Estado</p>
                            <p className="capitalize">
                                {selectedEvent.resource.status === 'completed' ? 'Completado' :
                                    selectedEvent.resource.status === 'pending' ? 'Pendiente' : selectedEvent.resource.status}
                            </p>
                        </div>

                        {selectedEvent.resource.status === 'pending' && (
                            <div className="pt-4">
                                <button
                                    onClick={() => completeMutation.mutate(selectedEvent.id)}
                                    disabled={completeMutation.isPending}
                                    className={`w-full py-2 rounded-lg text-white font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg ${completeMutation.isPending
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
