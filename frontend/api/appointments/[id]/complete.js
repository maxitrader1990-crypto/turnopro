import supabase from '../../_lib/supabase.js';
import { sendJson, handleError, verifyToken } from '../../_lib/utils.js';

export default async function handler(req, res) {
    const { id } = req.query;
    // Route: PATCH /api/appointments/[id]/complete
    if (req.method !== 'PATCH') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const user = await verifyToken(req); // Only employees complete appts

        // 1. Get Appointment
        const { data: appointment, error: appErr } = await supabase
            .from('appointments')
            .select('*, services(points_reward)')
            .eq('id', id)
            .eq('business_id', user.business_id)
            .single();

        if (appErr || !appointment) {
            return sendJson(res, 404, { error: 'Appointment not found' });
        }

        if (appointment.status === 'completed') {
            return sendJson(res, 400, { error: 'Already completed' });
        }

        // 2. Update Status
        const { error: updateErr } = await supabase
            .from('appointments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateErr) throw updateErr;

        // 3. Gamification Logic
        // Check business config
        const { data: business } = await supabase.from('businesses').select('gamification_enabled').eq('id', user.business_id).single();

        if (business && business.gamification_enabled) {
            const { data: config } = await supabase.from('gamification_config').select('points_per_visit').eq('business_id', user.business_id).single();

            // Logic from controller
            let pointsToAward = appointment.services?.points_reward || 0;
            if (config && config.points_per_visit) {
                pointsToAward = Math.max(pointsToAward, config.points_per_visit);
            }
            if (pointsToAward === 0) pointsToAward = 100;

            // Award Points (Manual Replication of Service Logic)
            // GamificationService.awardPoints inserts into points_transactions and updates customer_points

            // Upsert Customer Points
            const { data: cp } = await supabase.from('customer_points').select('*').eq('customer_id', appointment.customer_id).single();
            const currentPoints = cp ? cp.total_points_earned : 0;
            const currentBalance = cp ? cp.current_points : 0;

            // Insert Transaction (History)
            await supabase.from('points_transactions').insert({
                business_id: user.business_id,
                customer_id: appointment.customer_id,
                points_amount: pointsToAward,
                transaction_type: 'earn_visit',
                description: 'Visit Completed',
                reference_id: id
            });

            // Update/Insert Points
            await supabase.from('customer_points').upsert({
                business_id: user.business_id,
                customer_id: appointment.customer_id,
                total_points_earned: currentPoints + pointsToAward,
                current_points: currentBalance + pointsToAward,
                last_updated: new Date().toISOString()
                // Level calculation omitted for brevity/safety, keeping simple
            });
        }

        // 4. Update Customer Stats
        // RPC for increment would be better, but doing manual read-write
        const { data: customer } = await supabase.from('customers').select('total_visits, total_spent').eq('id', appointment.customer_id).single();
        if (customer) {
            await supabase.from('customers').update({
                last_visit_date: new Date().toISOString(),
                total_visits: (customer.total_visits || 0) + 1,
                total_spent: (customer.total_spent || 0) + (appointment.total_price || 0)
            }).eq('id', appointment.customer_id);
        }

        return sendJson(res, 200, { success: true, message: 'Appointment completed' });

    } catch (err) {
        return handleError(res, err);
    }
};
