import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const user = await verifyToken(req);
        let customerId = req.query.customer_id;

        // If user is customer, force their own ID
        if (user.role === 'customer') {
            // In this system, user is linked to business_users table.
            // Is there a link to `customers` table? 
            // The controller said: "Need to link user->customer first (TODO)... For now, if called by admin/employee..."
            // So I will assume the same limitation. 
        }

        if (!customerId) return sendJson(res, 400, { error: 'Customer ID required' });

        const { data: wallet } = await supabase.from('customer_points').select('*').eq('customer_id', customerId).eq('business_id', user.business_id).single();
        const { data: history } = await supabase.from('points_transactions').select('*').eq('customer_id', customerId).eq('business_id', user.business_id).order('created_at', { ascending: false }).limit(20);
        const { data: config } = await supabase.from('gamification_config').select('levels_config').eq('business_id', user.business_id).single();

        const data = wallet || { current_points: 0, current_level: 'Novato' };
        data.history = history || [];
        if (config) data.levels = config.levels_config;

        return sendJson(res, 200, { success: true, data });

    } catch (err) {
        return handleError(res, err);
    }
};
