import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

    try {
        const user = await verifyToken(req);
        const { customer_id, reward_id } = req.body;

        // Logic: 
        // 1. Get Reward cost
        // 2. Check Customer points
        // 3. Deduct points
        // 4. Log transaction
        // 5. Update stock

        const { data: reward } = await supabase.from('rewards').select('*').eq('id', reward_id).single();
        if (!reward) throw new Error('Reward not found');

        const { data: wallet } = await supabase.from('customer_points').select('*').eq('customer_id', customer_id).single();
        if (!wallet || wallet.current_points < reward.points_cost) {
            return sendJson(res, 400, { success: false, error: 'Insufficient points' });
        }

        // Deduct
        await supabase.from('customer_points').update({
            current_points: wallet.current_points - reward.points_cost,
            last_updated: new Date().toISOString()
        }).eq('customer_id', customer_id);

        // Log
        await supabase.from('points_transactions').insert({
            business_id: user.business_id,
            customer_id,
            points_amount: -reward.points_cost,
            transaction_type: 'redeem',
            description: `Redeemed: ${reward.name}`,
            reference_id: reward.id
        });

        // Update Stock (if tracked)
        if (reward.stock !== null) {
            await supabase.from('rewards').update({ stock: reward.stock - 1 }).eq('id', reward.id);
        }

        return sendJson(res, 200, { success: true, message: 'Reward redeemed successfully' });

    } catch (err) {
        return handleError(res, err);
    }
};
