import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

export default async function handler(req, res) {
    const { id } = req.query;
    try {
        const user = await verifyToken(req);

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .eq('business_id', user.business_id)
                .single();
            if (error || !data) return sendJson(res, 404, { error: 'Customer not found' });
            return sendJson(res, 200, { success: true, data });
        }
        else if (req.method === 'PATCH') {
            const { first_name, last_name, email, phone, notes } = req.body;
            const { data, error } = await supabase
                .from('customers')
                .update({ first_name, last_name, email, phone, notes, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('business_id', user.business_id)
                .select('*')
                .single();
            if (error || !data) return sendJson(res, 404, { error: 'Customer not found' });
            return sendJson(res, 200, { success: true, data });
        }
        else {
            return sendJson(res, 405, { error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};
