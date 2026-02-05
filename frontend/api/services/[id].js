
import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

export default async function handler(req, res) {
    const { id } = req.query; // Vercel extracts [id] into query
    if (!id) return sendJson(res, 400, { success: false, error: 'ID required' });

    try {
        if (req.method === 'GET') {
            const businessId = getBusinessId(req);
            if (!businessId) {
                return sendJson(res, 400, { success: false, error: 'Business ID required' });
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .eq('business_id', businessId)
                .is('deleted_at', null)
                .single();

            if (error || !data) {
                return sendJson(res, 404, { success: false, error: 'Service not found' });
            }
            return sendJson(res, 200, { success: true, data });
        }
        else if (req.method === 'PATCH') {
            const user = await verifyToken(req);
            const { name, description, duration_minutes, price, points_reward, category, is_active } = req.body;

            // Update with COALESCE logic handled by JS update object
            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
            if (price !== undefined) updateData.price = price;
            if (points_reward !== undefined) updateData.points_reward = points_reward;
            if (category !== undefined) updateData.category = category;
            if (is_active !== undefined) updateData.is_active = is_active;
            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('services')
                .update(updateData)
                .eq('id', id)
                .eq('business_id', user.business_id)
                .is('deleted_at', null)
                .select('*')
                .single();

            if (error || !data) {
                return sendJson(res, 404, { success: false, error: 'Service not found' });
            }
            return sendJson(res, 200, { success: true, data });
        }
        else if (req.method === 'DELETE') {
            const user = await verifyToken(req);

            // Soft delete
            const { data, error } = await supabase
                .from('services')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('business_id', user.business_id)
                .select('id')
                .single();

            if (error || !data) {
                return sendJson(res, 404, { success: false, error: 'Service not found' });
            }
            return sendJson(res, 200, { success: true, data: {} });
        }
        else {
            return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};
