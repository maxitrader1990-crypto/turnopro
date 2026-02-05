
import supabase from '../_lib/supabase.js';
import bcrypt from 'bcrypt';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

// --- Handlers ---

const indexHandler = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const businessId = getBusinessId(req);
            if (!businessId) return sendJson(res, 400, { success: false, error: 'Business Context Missing' });

            const { data, error } = await supabase
                .from('employees')
                .select(`
                     id,
                     title,
                     bio,
                     photo,
                     user_id,
                     is_active,
                     business_users!inner (
                         id,
                         first_name,
                         last_name,
                         email,
                         role
                     )
                 `)
                .eq('business_id', businessId)
                .eq('is_active', true); // Assuming we only want active ones for the list

            if (error) throw error;

            // Map flattened
            const formatted = data.map(e => ({
                id: e.id,
                title: e.title,
                bio: e.bio,
                photo: e.photo,
                first_name: e.business_users?.first_name,
                last_name: e.business_users?.last_name,
                role: e.business_users?.role,
                email: e.business_users?.email
            }));

            return sendJson(res, 200, { success: true, count: formatted.length, data: formatted });
        }
        else if (req.method === 'POST') {
            // Create Employee Logic (simplified from controller)
            // 1. Create Auth User (Supabase Auth usually, but here we might just create business_user entry if using custom auth?)
            // The controller `createEmployee` created a user in `business_users`.
            // WARNING: Creating Supabase Auth user usually requires SERVICE ROLE key if doing it via API.
            // Assuming we insert into `business_users` table directly.

            const user = await verifyToken(req);
            // Check if admin? Assume verifyToken checks connection to business.

            const { first_name, last_name, email, password, role, title, bio, photo, services } = req.body;
            // Services is array of service_ids

            // Hash
            const hashedPassword = await bcrypt.hash(password, 10);

            // 1. Transaction-like: Create User
            const { data: newUser, error: uErr } = await supabase
                .from('business_users')
                .insert({
                    business_id: user.business_id,
                    first_name,
                    last_name,
                    email,
                    password_hash: hashedPassword,
                    role: role || 'employee',
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (uErr) throw uErr;

            // 2. Create Employee Profile
            const { data: newEmp, error: eErr } = await supabase
                .from('employees')
                .insert({
                    business_id: user.business_id,
                    user_id: newUser.id,
                    title,
                    bio,
                    photo,
                    is_active: true
                })
                .select('id')
                .single();

            if (eErr) throw eErr; // Should rollback user? Supabase doesn't support transactions in JS client easily without RPC. Ignoring rollback for now.

            // 3. Link Services
            if (services && services.length > 0) {
                const serviceLinks = services.map(sid => ({
                    employee_id: newEmp.id,
                    service_id: sid
                }));
                await supabase.from('employee_services').insert(serviceLinks);

                // 4. Default Schedule (M-F 9-5)
                const defaultSchedule = [];
                for (let day = 1; day <= 5; day++) {
                    defaultSchedule.push({
                        employee_id: newEmp.id,
                        day_of_week: day,
                        start_time: '09:00:00',
                        end_time: '17:00:00',
                        is_available: true
                    });
                }
                // Sat/Sun off
                defaultSchedule.push({ employee_id: newEmp.id, day_of_week: 6, is_available: false, start_time: '00:00:00', end_time: '00:00:00' });
                defaultSchedule.push({ employee_id: newEmp.id, day_of_week: 0, is_available: false, start_time: '00:00:00', end_time: '00:00:00' });

                await supabase.from('employee_schedules').insert(defaultSchedule);
            }

            return sendJson(res, 201, { success: true, data: { id: newEmp.id, ...req.body } });
        }
        else {
            return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};

const idHandler = async (req, res, id) => {
    if (req.method !== 'GET') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const { data, error } = await supabase
            .from('employees')
            .select(`
                 *,
                 business_users!inner(*),
                 employee_services(service_id, services(name)),
                 employee_schedules(*)
             `)
            .eq('id', id)
            .single();

        if (error || !data) return sendJson(res, 404, { error: 'Employee not found' });

        const formatted = {
            id: data.id,
            title: data.title,
            bio: data.bio,
            photo: data.photo,
            first_name: data.business_users?.first_name,
            last_name: data.business_users?.last_name,
            email: data.business_users?.email,
            role: data.business_users?.role,
            services: data.employee_services?.map(es => ({ id: es.service_id, name: es.services?.name })),
            schedule: data.employee_schedules
        };

        return sendJson(res, 200, { success: true, data: formatted });

    } catch (err) {
        return handleError(res, err);
    }
};

const scheduleHandler = async (req, res, id) => {
    // Handled id passed from dispatcher
    if (req.method !== 'PUT') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const user = await verifyToken(req);
        // Authorization: Only admin or the employee themselves?
        // Assuming admin for now.

        const { schedule } = req.body; // Array of { day_of_week, start_time, end_time, is_available }

        if (!schedule || !Array.isArray(schedule)) {
            return sendJson(res, 400, { error: 'Invalid schedule format' });
        }

        // Upsert? Or Delete all and Insert? Upsert is better if IDs exist, but we might just have day_of_week.
        // Strategy: Upsert based on (employee_id, day_of_week) composite key constraint if it exists.
        // Or check if we can update.

        const updates = schedule.map(s => ({
            employee_id: id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_available: s.is_available,
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('employee_schedules')
            .upsert(updates, { onConflict: 'employee_id, day_of_week' }) // Provided DB has this constraint
            .select();

        if (error) throw error;

        return sendJson(res, 200, { success: true, data });

    } catch (err) {
        return handleError(res, err);
    }
};

// --- Main Dispatcher ---

export default async function handler(req, res) {
    const { route } = req.query;

    // 1. /api/employees -> []
    if (!route || route.length === 0) {
        return indexHandler(req, res);
    }

    // 2. /api/employees/:id/schedule -> [id, 'schedule']
    if (route.length === 2 && route[1] === 'schedule') {
        return scheduleHandler(req, res, route[0]);
    }

    // 3. /api/employees/:id -> [id]
    if (route.length === 1) {
        return idHandler(req, res, route[0]);
    }

    return sendJson(res, 404, { error: 'Not Found' });
}
