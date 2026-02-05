
const supabase = require('../../api/_lib/supabase');
const bcrypt = require('bcrypt');
const { sendJson, handleError, verifyToken, getBusinessId } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const businessId = getBusinessId(req);
            if (!businessId) return sendJson(res, 400, { success: false, error: 'Business ID required' });

            const { data, error } = await supabase
                .from('employees')
                .select(`
                    *,
                    business_users!inner (
                        full_name,
                        email,
                        phone
                    )
                `)
                .eq('business_id', businessId)
                .is('business_users.deleted_at', null)
                .order('business_users(full_name)', { ascending: true });

            if (error) throw error;

            // Flatten logic if needed, but returning nested is fine for frontend usually
            // Backend was returning flat fields. Let's flatten to match "maintaining functionalities"
            const flattened = data.map(e => ({
                ...e,
                full_name: e.business_users?.full_name,
                email: e.business_users?.email,
                phone: e.business_users?.phone,
                business_users: undefined
            }));

            return sendJson(res, 200, { success: true, count: flattened.length, data: flattened });
        }
        else if (req.method === 'POST') {
            const user = await verifyToken(req);
            // TODO: Check if user is admin/owner

            const { full_name, email, password, specialty, bio, schedules, service_ids } = req.body;

            if (!email || !password || !full_name) {
                return sendJson(res, 400, { success: false, error: 'Please provide required fields' });
            }

            // 1. Create User
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const { data: newUser, error: userError } = await supabase
                .from('business_users')
                .insert({
                    business_id: user.business_id,
                    full_name,
                    email,
                    password_hash: hashedPassword,
                    role: 'employee'
                })
                .select('id')
                .single();

            if (userError) throw userError;

            // 2. Create Employee Profile
            const { data: newEmployee, error: empError } = await supabase
                .from('employees')
                .insert({
                    business_id: user.business_id,
                    user_id: newUser.id,
                    specialty,
                    bio
                })
                .select('id')
                .single();

            if (empError) {
                // Try to rollback user?
                await supabase.from('business_users').delete().eq('id', newUser.id);
                throw empError;
            }

            // 3. Assign Services
            if (service_ids && service_ids.length > 0) {
                const servicesToInsert = service_ids.map(sid => ({
                    employee_id: newEmployee.id,
                    service_id: sid,
                    business_id: user.business_id
                }));
                const { error: servError } = await supabase.from('employee_services').insert(servicesToInsert);
                if (servError) console.error('Error assigning services', servError); // Non-critical?
            }

            // 4. Create Schedule
            if (schedules && schedules.length > 0) {
                const schedulesToInsert = schedules.map(s => ({
                    business_id: user.business_id,
                    employee_id: newEmployee.id,
                    day_of_week: s.day_of_week,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    is_available: true
                }));
                await supabase.from('employee_schedules').insert(schedulesToInsert);
            }

            return sendJson(res, 201, { success: true, data: { id: newEmployee.id, user_id: newUser.id, name: full_name } });
        }
        else {
            return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
        }

    } catch (err) {
        return handleError(res, err);
    }
};
