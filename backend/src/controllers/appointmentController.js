const db = require('../config/database');
const GamificationService = require('../services/gamificationService');

// Helper to determine time slots
const getSlots = (startTimeStr, endTimeStr, durationMinutes) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTimeStr}`);
    const end = new Date(`2000-01-01T${endTimeStr}`);
    const durationMs = durationMinutes * 60 * 1000;

    let current = start;
    while (current.getTime() + durationMs <= end.getTime()) {
        slots.push(current.toTimeString().substring(0, 5));
        current = new Date(current.getTime() + 15 * 60 * 1000); // Step every 15 mins (change if needed)
    }
    return slots;
};

// @desc    Get Availability for a specific date and service
// @route   GET /api/appointments/availability
// @access  Public
exports.getAvailability = async (req, res, next) => {
    try {
        const { date, service_id, employee_id } = req.query; // date: 2024-02-01

        if (!date || !service_id) {
            return res.status(400).json({ success: false, error: 'Date and Service ID are required' });
        }

        const queryDate = new Date(date);
        const dayOfWeek = queryDate.getDay(); // 0-6

        // 1. Get Service Duration
        const serviceRes = await db.query('SELECT duration_minutes FROM services WHERE id = $1', [service_id]);
        if (serviceRes.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
        const serviceDuration = serviceRes.rows[0].duration_minutes;

        // 2. Identify Candidates (Employees)
        // If employee_id provided, check only that one. If not, check all who perform service.
        let employeeQuery = `
            SELECT e.id, es_sched.start_time, es_sched.end_time
            FROM employees e
            JOIN employee_services es ON e.id = es.employee_id
            JOIN employee_schedules es_sched ON e.id = es_sched.employee_id
            WHERE es.service_id = $1 
            AND es_sched.day_of_week = $2
            AND e.business_id = $3
            AND e.is_active = true
            AND es_sched.is_available = true
        `;
        const empParams = [service_id, dayOfWeek, req.businessId];

        if (employee_id) {
            employeeQuery += ' AND e.id = $4';
            empParams.push(employee_id);
        }

        const employees = await db.query(employeeQuery, empParams);

        if (employees.rows.length === 0) {
            return res.status(200).json({ success: true, slots: [] }); // No one working
        }

        // 3. For each employee, calculate pure slots and subtract existing appointments
        let allSlots = [];

        for (const emp of employees.rows) {
            // Get existing appointments for this employee on this date
            const appointmentsRes = await db.query(
                `SELECT appointment_date, end_time 
                 FROM appointments 
                 WHERE employee_id = $1 
                 AND date_trunc('day', appointment_date) = $2
                 AND status NOT IN ('cancelled', 'no_show')`,
                [emp.id, date]
            );
            const existingApps = appointmentsRes.rows;

            // Generate base slots
            const baseSlots = getSlots(emp.start_time, emp.end_time, serviceDuration);

            // Filter availables
            const availableSlots = baseSlots.filter(timeStr => {
                // Construct specific date objects to compare
                const slotStart = new Date(`${date}T${timeStr}`);
                const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

                // Check collision
                const conflict = existingApps.some(app => {
                    const appStart = new Date(app.appointment_date);
                    const appEnd = new Date(app.end_time);

                    // Logic: Slot overlaps if (SlotStart < AppEnd) AND (SlotEnd > AppStart)
                    return slotStart < appEnd && slotEnd > appStart;
                });

                return !conflict;
            });

            // Add to pool
            availableSlots.forEach(slot => {
                allSlots.push({
                    time: slot,
                    employee_id: emp.id
                });
            });
        }

        // De-duplicate and sort if not specific employee (or group by time)
        const groupedSlots = {};
        allSlots.forEach(s => {
            if (!groupedSlots[s.time]) {
                groupedSlots[s.time] = [];
            }
            groupedSlots[s.time].push(s.employee_id);
        });

        res.status(200).json({ success: true, data: groupedSlots });

    } catch (err) {
        next(err);
    }
};

// @desc    Create Appointment
// @route   POST /api/appointments
// @access  Public (or Private)
exports.createAppointment = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        const {
            customer_id,
            service_id,
            employee_id,
            date, // YYYY-MM-DD
            time, // HH:MM
            notes
        } = req.body;

        await client.query('BEGIN');

        // 1. Get Service details
        const serviceRes = await client.query('SELECT duration_minutes, price, points_reward FROM services WHERE id = $1', [service_id]);
        if (serviceRes.rows.length === 0) throw new Error('Service not found');
        const service = serviceRes.rows[0];

        // 2. Calculate End Time
        const startDate = new Date(`${date}T${time}`);
        const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

        // 3. Create Appointment
        const appRes = await client.query(
            `INSERT INTO appointments 
            (business_id, customer_id, employee_id, service_id, appointment_date, end_time, total_price, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id, confirmation_code`,
            [req.businessId, customer_id, employee_id, service_id, startDate, endDate, service.price, 'confirmed']
        );
        const appointment = appRes.rows[0];

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: appointment });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// @desc    List appointments
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
    try {
        const { start_date, end_date, employee_id } = req.query;
        let query = `
            SELECT a.*, c.first_name as customer_name, s.name as service_name
            FROM appointments a
            JOIN customers c ON a.customer_id = c.id
            JOIN services s ON a.service_id = s.id
            WHERE a.business_id = $1
            AND a.appointment_date BETWEEN $2 AND $3
        `;
        const params = [
            req.businessId,
            start_date || '2000-01-01',
            end_date || '2100-01-01'
        ];

        if (employee_id) {
            query += ` AND a.employee_id = $4`;
            params.push(employee_id);
        }

        query += ` ORDER BY a.appointment_date ASC`;

        const result = await db.query(query, params);
        res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Complete Appointment (and award points)
// @route   PATCH /api/appointments/:id/complete
// @access  Private
exports.completeAppointment = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        const appointmentId = req.params.id;

        await client.query('BEGIN');

        // 1. Get Appointment details
        const appRes = await client.query(
            `SELECT a.*, s.points_reward, s.price 
             FROM appointments a 
             LEFT JOIN services s ON a.service_id = s.id
             WHERE a.id = $1 AND a.business_id = $2`,
            [appointmentId, req.businessId]
        );

        if (appRes.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const appointment = appRes.rows[0];

        if (appointment.status === 'completed') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Already completed' });
        }

        // 2. Update Status
        await client.query(
            'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['completed', appointmentId]
        );

        // 3. Check for Gamification
        const businessRes = await client.query('SELECT gamification_enabled FROM businesses WHERE id = $1', [req.businessId]);

        if (businessRes.rows[0].gamification_enabled) {
            // How many points? 
            // - Base points from service (points_reward)
            // - OR Base points from config (points_per_visit)

            const configRes = await client.query('SELECT points_per_visit FROM gamification_config WHERE business_id = $1', [req.businessId]);
            const config = configRes.rows.length > 0 ? configRes.rows[0] : null;

            let pointsToAward = appointment.points_reward || 0;
            if (config && config.points_per_visit) {
                pointsToAward = Math.max(pointsToAward, config.points_per_visit);
            }

            // If no explicit points, maybe default 100?
            if (pointsToAward === 0) pointsToAward = 100;

            // Award Points
            await GamificationService.awardPoints(
                client,
                req.businessId,
                appointment.customer_id,
                pointsToAward,
                'earn_visit',
                `Visit Completed`,
                appointmentId
            );
        }

        // 4. Update Customer stats (last visit, total spent)
        await client.query(
            `UPDATE customers 
             SET last_visit_date = CURRENT_DATE, 
                 total_visits = total_visits + 1,
                 total_spent = total_spent + $1
             WHERE id = $2`,
            [appointment.total_price || 0, appointment.customer_id]
        );

        await client.query('COMMIT');

        res.status(200).json({ success: true, message: 'Appointment completed' });

    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};
