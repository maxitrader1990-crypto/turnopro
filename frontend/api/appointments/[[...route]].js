
import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

// --- Helpers ---

const getSlots = (startTimeStr, endTimeStr, durationMinutes) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTimeStr}`);
    const end = new Date(`2000-01-01T${endTimeStr}`);
    const durationMs = durationMinutes * 60 * 1000;

    let current = start;
    while (current.getTime() + durationMs <= end.getTime()) {
        slots.push(current.toTimeString().substring(0, 5));
        current = new Date(current.getTime() + 15 * 60 * 1000); // 15 min step
    }
    return slots;
};

// --- Handlers ---

const indexHandler = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const user = await verifyToken(req);
            const { start_date, end_date, employee_id } = req.query;

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    customers (first_name),
                    services (name)
                `)
                .eq('business_id', user.business_id)
                .gte('appointment_date', start_date || '2000-01-01')
                .lte('appointment_date', end_date || '2100-01-01')
                .order('appointment_date', { ascending: true });

            if (employee_id) {
                query = query.eq('employee_id', employee_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const flattened = data.map(a => ({
                ...a,
                customer_name: a.customers?.first_name,
                service_name: a.services?.name,
                customers: undefined,
                services: undefined
            }));

            return sendJson(res, 200, { success: true, count: flattened.length, data: flattened });
        }
        else if (req.method === 'POST') {
            let businessId = getBusinessId(req);
            let customerId = req.body.customer_id;

            const { service_id, employee_id, date, time, notes } = req.body;
            if (!businessId) return sendJson(res, 400, { error: 'Business Context Missing' });

            const { data: service } = await supabase.from('services').select('*').eq('id', service_id).single();
            if (!service) return sendJson(res, 404, { error: 'Service not found' });

            const startDate = new Date(`${date}T${time}`);
            const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

            const { data: appointment, error } = await supabase
                .from('appointments')
                .insert({
                    business_id: businessId,
                    customer_id: customerId,
                    employee_id,
                    service_id,
                    appointment_date: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    total_price: service.price,
                    status: 'confirmed',
                    notes
                })
                .select('id, confirmation_code')
                .single();

            if (error) throw error;
            return sendJson(res, 201, { success: true, data: appointment });
        }
        else {
            return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};

const availabilityHandler = async (req, res) => {
    if (req.method !== 'GET') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const { date, service_id, employee_id } = req.query;
        const businessId = getBusinessId(req);

        if (!date || !service_id || !businessId) {
            return sendJson(res, 400, { success: false, error: 'Date, Service ID and Business Context required' });
        }

        const queryDate = new Date(date);
        const dayOfWeek = queryDate.getDay();

        const { data: service, error: sErr } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', service_id)
            .single();

        if (sErr || !service) return sendJson(res, 404, { error: 'Service not found' });
        const serviceDuration = service.duration_minutes;

        let empQuery = supabase
            .from('employees')
            .select(`
                id,
                employee_services!inner(service_id),
                employee_schedules!inner(start_time, end_time, day_of_week, is_available)
            `)
            .eq('business_id', businessId)
            .eq('is_active', true)
            .eq('employee_services.service_id', service_id)
            .eq('employee_schedules.day_of_week', dayOfWeek)
            .eq('employee_schedules.is_available', true);

        if (employee_id) {
            empQuery = empQuery.eq('id', employee_id);
        }

        const { data: employees, error: empErr } = await empQuery;
        if (empErr) throw empErr;

        if (!employees || employees.length === 0) {
            return sendJson(res, 200, { success: true, slots: [] });
        }

        let allSlots = [];
        const empIds = employees.map(e => e.id);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: appointments } = await supabase
            .from('appointments')
            .select('employee_id, appointment_date, end_time')
            .in('employee_id', empIds)
            .gte('appointment_date', startOfDay.toISOString())
            .lte('appointment_date', endOfDay.toISOString())
            .neq('status', 'cancelled')
            .neq('status', 'no_show');

        const existingApps = appointments || [];

        for (const emp of employees) {
            const schedule = emp.employee_schedules[0];
            if (!schedule) continue;

            const baseSlots = getSlots(schedule.start_time, schedule.end_time, serviceDuration);
            const empApps = existingApps.filter(a => a.employee_id === emp.id);

            const availableSlots = baseSlots.filter(timeStr => {
                const slotStart = new Date(`${date}T${timeStr}`);
                const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

                const conflict = empApps.some(app => {
                    const appStart = new Date(app.appointment_date);
                    const appEnd = new Date(app.end_time);
                    return slotStart < appEnd && slotEnd > appStart;
                });
                return !conflict;
            });

            availableSlots.forEach(slot => {
                allSlots.push({ time: slot, employee_id: emp.id });
            });
        }

        const groupedSlots = {};
        allSlots.forEach(s => {
            if (!groupedSlots[s.time]) groupedSlots[s.time] = [];
            groupedSlots[s.time].push(s.employee_id);
        });

        return sendJson(res, 200, { success: true, data: groupedSlots });

    } catch (err) {
        return handleError(res, err);
    }
};

const completeHandler = async (req, res, id) => {
    // Note: id passed from dispatcher
    if (req.method !== 'PATCH') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const user = await verifyToken(req);

        const { data: appointment, error: appErr } = await supabase
            .from('appointments')
            .select('*, services(points_reward)')
            .eq('id', id)
            .eq('business_id', user.business_id)
            .single();

        if (appErr || !appointment) {
            return sendJson(res, 404, { error: 'Appointment not found' });
        }

        if (appointment.status === 'completed') {
            return sendJson(res, 400, { error: 'Already completed' });
        }

        const { error: updateErr } = await supabase
            .from('appointments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateErr) throw updateErr;

        const { data: business } = await supabase.from('businesses').select('gamification_enabled').eq('id', user.business_id).single();

        if (business && business.gamification_enabled) {
            const { data: config } = await supabase.from('gamification_config').select('points_per_visit').eq('business_id', user.business_id).single();

            let pointsToAward = appointment.services?.points_reward || 0;
            if (config && config.points_per_visit) {
                pointsToAward = Math.max(pointsToAward, config.points_per_visit);
            }
            if (pointsToAward === 0) pointsToAward = 100;

            const { data: cp } = await supabase.from('customer_points').select('*').eq('customer_id', appointment.customer_id).single();
            const currentPoints = cp ? cp.total_points_earned : 0;
            const currentBalance = cp ? cp.current_points : 0;

            await supabase.from('points_transactions').insert({
                business_id: user.business_id,
                customer_id: appointment.customer_id,
                points_amount: pointsToAward,
                transaction_type: 'earn_visit',
                description: 'Visit Completed',
                reference_id: id
            });

            await supabase.from('customer_points').upsert({
                business_id: user.business_id,
                customer_id: appointment.customer_id,
                total_points_earned: currentPoints + pointsToAward,
                current_points: currentBalance + pointsToAward,
                last_updated: new Date().toISOString()
            });
        }

        const { data: customer } = await supabase.from('customers').select('total_visits, total_spent').eq('id', appointment.customer_id).single();
        if (customer) {
            await supabase.from('customers').update({
                last_visit_date: new Date().toISOString(),
                total_visits: (customer.total_visits || 0) + 1,
                total_spent: (customer.total_spent || 0) + (appointment.total_price || 0)
            }).eq('id', appointment.customer_id);
        }

        return sendJson(res, 200, { success: true, message: 'Appointment completed' });

    } catch (err) {
        return handleError(res, err);
    }
};

// --- Main Dispatcher ---

export default async function handler(req, res) {
    const { route } = req.query;

    // Route matching
    // 1. undefined or [] -> /api/appointments
    if (!route || route.length === 0) {
        return indexHandler(req, res);
    }

    // 2. /api/appointments/availability -> ['availability']
    if (route.length === 1 && route[0] === 'availability') {
        return availabilityHandler(req, res);
    }

    // 3. /api/appointments/:id/complete -> [id, 'complete']
    if (route.length === 2 && route[1] === 'complete') {
        return completeHandler(req, res, route[0]);
    }

    return sendJson(res, 404, { error: 'Not Found' });
}
