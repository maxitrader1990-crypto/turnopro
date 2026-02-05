import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

export default async function handler(req, res) {
    if (req.method !== 'PATCH') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const user = await verifyToken(req);
        const { points_per_visit, levels_config } = req.body;

        const { data, error } = await supabase
            .from('gamification_config')
            .upsert({
                business_id: user.business_id,
                points_per_visit,
                levels_config: levels_config, // JSONB usually
                updated_at: new Date().toISOString()
            }, { onConflict: 'business_id' })
            .select('*')
            .single();

        if (error) throw error;
        return sendJson(res, 200, { success: true, data });

    } catch (err) {
        return handleError(res, err);
    }
};
