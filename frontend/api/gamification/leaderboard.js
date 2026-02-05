import supabase from '../_lib/supabase.js';
import { sendJson, handleError, getBusinessId } from '../_lib/utils.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const businessId = getBusinessId(req);
        // Join customer to get name
        const { data, error } = await supabase
            .from('customer_points')
            .select(`
                total_points_earned,
                current_level,
                customers!inner (
                    first_name,
                    last_name
                )
            `)
            .eq('business_id', businessId)
            .order('total_points_earned', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Format
        const formatted = data.map(cp => ({
            total_points_earned: cp.total_points_earned,
            current_level: cp.current_level,
            first_name: cp.customers?.first_name,
            last_initial: cp.customers?.last_name ? cp.customers.last_name[0] : ''
        }));

        return sendJson(res, 200, { success: true, data: formatted });

    } catch (err) {
        return handleError(res, err);
    }
};
