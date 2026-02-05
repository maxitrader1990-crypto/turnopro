import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const businessId = getBusinessId(req);
            if (!businessId) return sendJson(res, 400, { error: 'Business ID required' });

            const { data } = await supabase
                .from('rewards')
                .select('*')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .order('points_cost', { ascending: true });

            return sendJson(res, 200, { success: true, count: data?.length || 0, data: data || [] });
        }
        else if (req.method === 'POST') {
            const user = await verifyToken(req); // Admin check needed usually
            const { name, description, points_cost, type, stock } = req.body;

            const { data, error } = await supabase
                .from('rewards')
                .insert({
                    business_id: user.business_id,
                    name,
                    description,
                    points_cost,
                    type,
                    stock
                })
                .select('*')
                .single();

            if (error) throw error;
            return sendJson(res, 201, { success: true, data });
        }
        else {
            return sendJson(res, 405, { error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};
