
import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const user = await verifyToken(req); // Private standard
            const { search } = req.query;

            let query = supabase
                .from('customers')
                .select('*')
                .eq('business_id', user.business_id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(50);

            if (search) {
                // Supabase 'ilike' or 'or' filter
                // .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return sendJson(res, 200, { success: true, count: data.length, data });
        }
        else if (req.method === 'POST') {
            // Logic says Private OR Public (Booking Flow).
            // If Booking Flow, how is business_id passed? Body.
            // We need to differentiate. Check header/token.
            // If token valid, use token.business_id. Else request body logic?

            // Simplification: Assume Public if token missing but business_id in body?
            // But Booking flow needs to be secure?
            // Actually, `customerController` said "Or Public (Booking Flow)".

            let businessId;
            try {
                const user = await verifyToken(req);
                businessId = user.business_id;
            } catch (e) {
                // Public fallback
                businessId = req.body.business_id; // Must be provided
            }

            if (!businessId) return sendJson(res, 400, { error: 'Business ID required' });

            const { first_name, last_name, email, phone, birth_date, notes } = req.body;
            if (!first_name || !email) return sendJson(res, 400, { error: 'Name and email required' });

            // Check exists
            const { data: exists } = await supabase.from('customers').select('id').eq('email', email).eq('business_id', businessId).maybeSingle();
            if (exists) return sendJson(res, 400, { error: 'Customer already exists' });

            const { data, error } = await supabase
                .from('customers')
                .insert({
                    business_id: businessId, first_name, last_name, email, phone, birth_date, notes
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
