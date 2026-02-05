
import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

// --- Handlers ---

const configHandler = async (req, res) => {
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

const leaderboardHandler = async (req, res) => {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const businessId = getBusinessId(req);
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

const redeemHandler = async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const user = await verifyToken(req);
        const { customer_id, reward_id } = req.body;

        const { data: reward } = await supabase.from('rewards').select('*').eq('id', reward_id).single();
        if (!reward) throw new Error('Reward not found');

        const { data: wallet } = await supabase.from('customer_points').select('*').eq('customer_id', customer_id).single();
        if (!wallet || wallet.current_points < reward.points_cost) {
            return sendJson(res, 400, { success: false, error: 'Insufficient points' });
        }

        await supabase.from('customer_points').update({
            current_points: wallet.current_points - reward.points_cost,
            last_updated: new Date().toISOString()
        }).eq('customer_id', customer_id);

        await supabase.from('points_transactions').insert({
            business_id: user.business_id,
            customer_id,
            points_amount: -reward.points_cost,
            transaction_type: 'redeem',
            description: `Redeemed: ${reward.name}`,
            reference_id: reward.id
        });

        if (reward.stock !== null) {
            await supabase.from('rewards').update({ stock: reward.stock - 1 }).eq('id', reward.id);
        }

        return sendJson(res, 200, { success: true, message: 'Reward redeemed successfully' });

    } catch (err) {
        return handleError(res, err);
    }
};

const rewardsHandler = async (req, res) => {
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
            const user = await verifyToken(req);
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

const walletHandler = async (req, res) => {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const user = await verifyToken(req);
        let customerId = req.query.customer_id;

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

// --- Main Dispatcher ---

export default async function handler(req, res) {
    const { route } = req.query;
    const endpoint = route && route[0] ? route[0] : null;

    switch (endpoint) {
        case 'config':
            return configHandler(req, res);
        case 'leaderboard':
            return leaderboardHandler(req, res);
        case 'redeem':
            return redeemHandler(req, res);
        case 'rewards':
            return rewardsHandler(req, res);
        case 'wallet':
            return walletHandler(req, res);
        default:
            return sendJson(res, 404, { error: 'Not Found' });
    }
}
