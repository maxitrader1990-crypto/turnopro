
const supabase = require('../../api/_lib/supabase');
const { sendJson, handleError, verifyToken, getBusinessId } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            const businessId = getBusinessId(req);
            if (!businessId) {
                return sendJson(res, 400, { success: false, error: 'Business ID required' });
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('business_id', businessId)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (error) throw error;
            return sendJson(res, 200, { success: true, count: data.length, data });
        }
        else if (req.method === 'POST') {
            const user = await verifyToken(req);
            // Assuming role check is done or user is allowed
            // Logic: createService
            const { name, description, duration_minutes, price, points_reward, category, image_url } = req.body;

            const { data, error } = await supabase
                .from('services')
                .insert({
                    business_id: user.business_id,
                    name,
                    description,
                    duration_minutes,
                    price,
                    points_reward: points_reward || 0,
                    category,
                    image_url
                })
                .select('*')
                .single();

            if (error) throw error;
            return sendJson(res, 201, { success: true, data });
        }
        else {
            return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};
