const db = require('../config/database');
const bcrypt = require('bcrypt');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public
exports.getEmployees = async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT e.*, u.full_name, u.email, u.phone 
             FROM employees e 
             JOIN business_users u ON e.user_id = u.id 
             WHERE e.business_id = $1 AND u.deleted_at IS NULL
             ORDER BY u.full_name ASC`,
            [req.businessId]
        );
        res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single employee details (with services and schedule)
// @route   GET /api/employees/:id
// @access  Public
exports.getEmployee = async (req, res, next) => {
    try {
        // 1. Get Employee Basic info
        const employeeRes = await db.query(
            `SELECT e.*, u.full_name, u.email, u.phone 
             FROM employees e 
             JOIN business_users u ON e.user_id = u.id 
             WHERE e.id = $1 AND e.business_id = $2`,
            [req.params.id, req.businessId]
        );

        if (employeeRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        const employee = employeeRes.rows[0];

        // 2. Get Services
        const servicesRes = await db.query(
            `SELECT s.id, s.name, s.duration_minutes, s.price 
             FROM services s
             JOIN employee_services es ON s.id = es.service_id
             WHERE es.employee_id = $1`,
            [employee.id]
        );
        employee.services = servicesRes.rows;

        // 3. Get Schedule
        const scheduleRes = await db.query(
            `SELECT day_of_week, start_time, end_time, is_available 
             FROM employee_schedules 
             WHERE employee_id = $1 
             ORDER BY day_of_week ASC`,
            [employee.id]
        );
        employee.schedule = scheduleRes.rows;

        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new employee (and User)
// @route   POST /api/employees
// @access  Private (Admin)
exports.createEmployee = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        const { full_name, email, password, specialty, bio, schedules, service_ids } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, error: 'Please provide required fields' });
        }

        await client.query('BEGIN');

        // 1. Create User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userRes = await client.query(
            `INSERT INTO business_users (business_id, full_name, email, password_hash, role) 
             VALUES ($1, $2, $3, $4, 'employee') RETURNING id`,
            [req.businessId, full_name, email, hashedPassword]
        );
        const userId = userRes.rows[0].id;

        // 2. Create Employee Profile
        const employeeRes = await client.query(
            `INSERT INTO employees (business_id, user_id, specialty, bio) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [req.businessId, userId, specialty, bio]
        );
        const employeeId = employeeRes.rows[0].id;

        // 3. Assign Services (if provided)
        if (service_ids && service_ids.length > 0) {
            for (const serviceId of service_ids) {
                await client.query(
                    `INSERT INTO employee_services (employee_id, service_id, business_id) VALUES ($1, $2, $3)`,
                    [employeeId, serviceId, req.businessId]
                );
            }
        }

        // 4. Create Schedule (if provided, else default?)
        // schedules: [{ day_of_week: 0, start_time: '09:00', end_time: '17:00' }, ...]
        if (schedules && schedules.length > 0) {
            for (const sched of schedules) {
                await client.query(
                    `INSERT INTO employee_schedules 
                    (business_id, employee_id, day_of_week, start_time, end_time, is_available) 
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [req.businessId, employeeId, sched.day_of_week, sched.start_time, sched.end_time, true]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: { id: employeeId, user_id: userId, name: full_name } });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }
        next(err);
    } finally {
        client.release();
    }
};

// @desc    Update employee schedule
// @route   PUT /api/employees/:id/schedule
// @access  Private (Admin)
exports.updateEmployeeSchedule = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        const { schedules } = req.body; // Array of schedule objects
        const employeeId = req.params.id;

        await client.query('BEGIN');

        // Delete existing schedule
        await client.query(
            'DELETE FROM employee_schedules WHERE employee_id = $1',
            [employeeId]
        );

        // Insert new
        if (schedules && schedules.length > 0) {
            for (const sched of schedules) {
                await client.query(
                    `INSERT INTO employee_schedules 
                    (business_id, employee_id, day_of_week, start_time, end_time, is_available) 
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [req.businessId, employeeId, sched.day_of_week, sched.start_time, sched.end_time, sched.is_available ?? true]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Schedule updated' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};
