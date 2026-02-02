import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
    const { api } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch Appointments for range (simplified for MVP: fetch last month/next month logic usually needed)
    // Here getting all or just current month roughly
    const { data: appointments } = useQuery({
        queryKey: ['appointments'],
        queryFn: async () => (await api.get('/appointments')).data
    });

    const events = appointments?.data?.map(app => ({
        id: app.id,
        title: `${app.customer_name} - ${app.service_name}`,
        start: new Date(app.appointment_date),
        end: new Date(app.end_time),
        resource: app
    })) || [];

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

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
            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Appointment Details">
                {selectedEvent && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Customer</p>
                            <p className="text-lg font-bold">{selectedEvent.resource.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Service</p>
                            <p>{selectedEvent.resource.service_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Time</p>
                            <p>{moment(selectedEvent.start).format('LLL')} - {moment(selectedEvent.end).format('LT')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <p className="capitalize">{selectedEvent.resource.status}</p>
                        </div>

                        {selectedEvent.resource.status !== 'completed' && (
                            <div className="pt-4">
                                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                                    Complete Appointment (Needs API hook)
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
