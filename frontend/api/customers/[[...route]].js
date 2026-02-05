
import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

// --- Handlers ---

const indexHandler = async (req, res) => {
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
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return sendJson(res, 200, { success: true, count: data.length, data });
        }
        else if (req.method === 'POST') {
            // Logic says Private OR Public (Booking Flow).
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

const idHandler = async (req, res, id) => {
    if (req.method !== 'GET' && req.method !== 'PATCH' && req.method !== 'DELETE') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    try {
        const user = await verifyToken(req);

        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .eq('business_id', user.business_id)
                .single();
            if (error || !data) return sendJson(res, 404, { error: 'Customer not found' });
            return sendJson(res, 200, { success: true, data });
        }
        else if (req.method === 'PATCH') {
            const { first_name, last_name, email, phone, notes } = req.body;
            const { data, error } = await supabase
                .from('customers')
                .update({ first_name, last_name, email, phone, notes, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('business_id', user.business_id)
                .select('*')
                .single();
            if (error || !data) return sendJson(res, 404, { error: 'Customer not found' });
            return sendJson(res, 200, { success: true, data });
        }
        // Assuming delete is soft delete usually, but sticking to existing logic which didn't have DELETE in [id].js?
        // Wait, [id].js viewed in step 313 ONLY had GET and PATCH.
        // admin/businesses/[id].js HAD DELETE.
        // I won't add DELETE here if it wasn't there.

        return sendJson(res, 405, { error: 'Method Not Allowed' });

    } catch (err) {
        return handleError(res, err);
    }
};

// --- Main Dispatcher ---

export default async function handler(req, res) {
    // Normalize route to array
    let segments = [];
    if (Array.isArray(route)) {
        segments = route;
    } else if (typeof route === 'string') {
        segments = [route];
    } else {
        // Fallback: try parsing req.url
        const path = req.url.split('?')[0];
        const parts = path.split('/');
        // parts: ['', 'api', 'customers', '123']
        const customersIndex = parts.indexOf('customers');
        if (customersIndex !== -1 && customersIndex < parts.length - 1) {
            segments = parts.slice(customersIndex + 1);
        }
    }

    // 1. /api/customers -> []
    if (!segments || segments.length === 0) {
        return indexHandler(req, res);
    }

    // 2. /api/customers/:id -> [id]
    if (segments.length === 1) {
        return idHandler(req, res, segments[0]);
    }

    return sendJson(res, 404, { error: 'Not Found' });
}
