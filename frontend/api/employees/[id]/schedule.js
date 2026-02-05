
const supabase = require('../../../api/_lib/supabase'); // Note: 3 levels up because api/employees/[id]/schedule.js
const { sendJson, handleError, verifyToken } = require('../../../api/_lib/utils');

module.exports = async (req, res) => {
    const { id } = req.query; // employee id
    if (req.method !== 'PUT') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const user = await verifyToken(req);
        const { schedules } = req.body;

        // Delete existing
        await supabase
            .from('employee_schedules')
            .delete()
            .eq('employee_id', id);

        // Insert new
        if (schedules && schedules.length > 0) {
            const schedulesToInsert = schedules.map(s => ({
                business_id: user.business_id,
                employee_id: id,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                is_available: s.is_available ?? true
            }));
            await supabase.from('employee_schedules').insert(schedulesToInsert);
        }

        return sendJson(res, 200, { success: true, message: 'Schedule updated' });

    } catch (err) {
        return handleError(res, err);
    }
};
