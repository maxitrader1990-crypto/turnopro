import supabase from '../_lib/supabase.js';
import { sendJson, handleError, getBusinessId } from '../_lib/utils.js';

// Helper
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

export default async function handler(req, res) {
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

        // 1. Get Service Duration
        const { data: service, error: sErr } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', service_id)
            .single();

        if (sErr || !service) return sendJson(res, 404, { error: 'Service not found' });
        const serviceDuration = service.duration_minutes;

        // 2. Identify Candidates (Employees)
        // Complex Join: Employees -> EmployeeServices(check service) -> EmployeeScheules(check day)
        // Supabase approach: Select from Employees with inner joins

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

        // 3. For each employee, calculate slots
        let allSlots = [];

        // Pre-fetch all appointments for these employees on this date to optimize?
        // Or loop. Loop is easier to write now. Optimizing later.
        // Actually, let's fetch all relevant appointments in one go.
        const empIds = employees.map(e => e.id);

        // Date Range
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
            // Emp schedules might be array if multiple entries per day? Assuming 1 per day based on previous code
            // employee_schedules returns array. Take first.
            const schedule = emp.employee_schedules[0];
            if (!schedule) continue;

            const baseSlots = getSlots(schedule.start_time, schedule.end_time, serviceDuration);

            // Filter
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

        // Grouping
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
