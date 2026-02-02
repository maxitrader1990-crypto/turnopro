
const supabase = require('../../api/_lib/supabase');
const { sendJson, handleError, verifyToken, getBusinessId } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
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

            // Map join names to flattened structure if needed
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
            // Note: createAppointment in controller was Public or Private.
            // If public, we need businessId from body/header.
            // We'll check token IF present, else look for businessId.
            // But wait, the controller used 'req.businessId' which came from middleware.
            // Middleware usually runs on all routes.
            // If header is present, we use it.

            let businessId = getBusinessId(req);
            let customerId = req.body.customer_id;

            // If user is logged in (e.g. employee booking for someone), we might verify token?
            // Prompt said "Backend must function as serverless".
            // Let's assume booking is PUBLIC for customers via widget?
            // But if it requires customer_id, who creates the customer?
            // Usually Flow: 1. Create Customer -> 2. Create Appointment.

            const { service_id, employee_id, date, time, notes } = req.body;
            if (!businessId) return sendJson(res, 400, { error: 'Business Context Missing' });

            // 1. Get Service
            const { data: service } = await supabase.from('services').select('*').eq('id', service_id).single();
            if (!service) return sendJson(res, 404, { error: 'Service not found' });

            // 2. Times
            const startDate = new Date(`${date}T${time}`);
            const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);

            // 3. Create
            const { data: appointment, error } = await supabase
                .from('appointments')
                .insert({
                    business_id: businessId,
                    customer_id: customerId, // Must be provided
                    employee_id,
                    service_id,
                    appointment_date: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    total_price: service.price,
                    status: 'confirmed',
                    notes
                })
                .select('id, confirmation_code') // generated DB side? Or should I generate?
                // Returning clause in original SQL returned confirmation_code. Assuming DB default or trigger generates it.
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
