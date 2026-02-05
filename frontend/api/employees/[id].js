
const supabase = require('../../api/_lib/supabase');
const { sendJson, handleError, getBusinessId } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    const { id } = req.query;
    if (req.method !== 'GET') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const businessId = getBusinessId(req);
        if (!businessId) return sendJson(res, 400, { success: false, error: 'Business ID required' });

        // 1. Get Employee Basic info
        const { data: employeeData, error: empError } = await supabase
            .from('employees')
            .select(`
                *,
                business_users!inner (
                    full_name,
                    email,
                    phone
                )
            `)
            .eq('id', id)
            .eq('business_id', businessId)
            .single();

        if (empError || !employeeData) {
            return sendJson(res, 404, { success: false, error: 'Employee not found' });
        }

        const employee = {
            ...employeeData,
            full_name: employeeData.business_users?.full_name,
            email: employeeData.business_users?.email,
            phone: employeeData.business_users?.phone,
            business_users: undefined
        };

        // 2. Get Services
        const { data: services } = await supabase
            .from('services')
            .select('id, name, duration_minutes, price, employee_services!inner(employee_id)')
            .eq('employee_services.employee_id', id);

        // Transform purely to service objects (remove join artifact if needed)
        // In Supabase many-to-many, we select from join table or target table.
        // Method above selects from Target (Services) filtering by inner join on EmployeeServices

        employee.services = services || [];

        // 3. Get Schedule
        const { data: schedule } = await supabase
            .from('employee_schedules')
            .select('day_of_week, start_time, end_time, is_available')
            .eq('employee_id', id)
            .order('day_of_week', { ascending: true });

        employee.schedule = schedule || [];

        return sendJson(res, 200, { success: true, data: employee });

    } catch (err) {
        return handleError(res, err);
    }
};
