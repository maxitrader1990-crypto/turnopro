import supabase from '../_lib/supabase.js';
import bcrypt from 'bcrypt';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

export default async function handler(req, res) {
    const { route } = req.query;
    // /api/admin/businesses -> route=['businesses']
    // /api/admin/businesses/123 -> route=['businesses', '123']

    if (!route || route.length === 0) {
        return sendJson(res, 404, { success: false, error: 'Not Found' });
    }

    const resource = route[0];

    try {
        // --- BUSINESSES ---
        if (resource === 'businesses') {

            // LIST or CREATE
            if (route.length === 1) {
                if (req.method === 'GET') {
                    // Admin Listing
                    const { data, error } = await supabase
                        .from('businesses')
                        .select('*')
                        .is('deleted_at', null)
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return sendJson(res, 200, { success: true, count: data.length, data });
                }
                else if (req.method === 'POST') {
                    // Create Business (Onboarding)
                    const { name, subdomain, email, owner_name, owner_password, plan_type, gamification_enabled, phone } = req.body;

                    const { data: business, error: bErr } = await supabase
                        .from('businesses')
                        .insert({ name, subdomain, email, plan_type: plan_type || 'starter', gamification_enabled: gamification_enabled || false, phone })
                        .select('id, name, subdomain')
                        .single();

                    if (bErr) throw bErr;

                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(owner_password, salt);

                    const { error: uErr } = await supabase.from('business_users').insert({
                        business_id: business.id,
                        full_name: owner_name,
                        email,
                        password_hash: hashedPassword,
                        role: 'owner'
                    });

                    if (uErr) {
                        await supabase.from('businesses').delete().eq('id', business.id);
                        throw uErr;
                    }

                    if (gamification_enabled) {
                        await supabase.from('gamification_config').insert({ business_id: business.id });
                    }

                    return sendJson(res, 201, { success: true, data: business });
                }
                else {
                    return sendJson(res, 405, { error: 'Method Not Allowed' });
                }
            }

            // DETAIL (GET, PATCH, DELETE)
            else if (route.length === 2) {
                const id = route[1];

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
                else {
                    return sendJson(res, 405, { error: 'Method Not Allowed' });
                }
            }
        }

        else {
            return sendJson(res, 404, { success: false, error: 'Not Found' });
        }

    } catch (err) {
        return handleError(res, err);
    }
};
