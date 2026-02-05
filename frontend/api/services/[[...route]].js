import supabase from '../_lib/supabase.js';
import { sendJson, handleError, verifyToken, getBusinessId } from '../_lib/utils.js';

export default async function handler(req, res) {
    const { route } = req.query;
    // /api/services -> route empty? No, this is [...route], so it captures everything AFTER /api/services/.
    // Wait, if it's main index, we need to handle root access?
    // Vercel routes: /api/services/[...route].js handles /api/services/foo.
    // DOES IT handle /api/services/ ? 
    // Usually [...route] requires at least one segment. [[...route]] (optional catch all) handles root too.
    // I should use [[...route]].js if I want to handle /api/services/ (index).
    // OR create index.js AND [...route].js. But that adds 2 functions.
    // Best practice: Use [[...route]].js (double brackets) for optional catch-all.
    // NOTE: Node.js file names in Windows can be tricky with brackets? No, standard in Next/Vercel.
    // Let's assume Vercel creates distinct entry points.
    // If I name it `index.js`, it handles `/`.
    // If I name it `[...route].js`, it handles `/anything`.
    // I want 1 function to handle ALL.
    // I will use `[[...route]].js`.

    // Logic:
    // if route is undefined or empty array -> Index
    // if route has 1 element -> ID

    // But `req.query.route` might be string or array.

    const routeArr = route || [];
    const resourceId = routeArr.length > 0 ? routeArr[0] : null;

    try {
        // --- INDEX (LIST / CREATE) ---
        if (!resourceId) {
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
        }

        // --- DETAIL (GET / PATCH / DELETE) ---
        else {
            const id = resourceId;

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
        }

    } catch (err) {
        return handleError(res, err);
    }
};
