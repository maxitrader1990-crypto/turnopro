
const supabase = require('../../api/_lib/supabase');
const { sendJson, handleError } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    const { id } = req.query;
    try {
        if (req.method === 'GET') {
            const { data } = await supabase.from('businesses').select('*').eq('id', id).single();
            if (!data) return sendJson(res, 404, { error: 'Not found' });
            return sendJson(res, 200, { success: true, data });
        }
        else if (req.method === 'PATCH') {
            const { name, plan_type, subscription_status } = req.body;
            const { data } = await supabase
                .from('businesses')
                .update({ name, plan_type, subscription_status, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('*')
                .single();
            return sendJson(res, 200, { success: true, data });
        }
        else if (req.method === 'DELETE') {
            await supabase.from('businesses').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            return sendJson(res, 200, { success: true, data: {} });
        }
    } catch (err) {
        return handleError(res, err);
    }
}
