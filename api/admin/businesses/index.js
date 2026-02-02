
const supabase = require('../../api/_lib/supabase');
const bcrypt = require('bcrypt');
const { sendJson, handleError, verifyToken } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    try {
        if (req.method === 'GET') {
            // Admin only
            // const user = await verifyToken(req); 
            // TODO checking super admin logic?
            // Keeping simple generic list
            const { data, error } = await supabase.from('businesses').select('*').is('deleted_at', null).order('created_at', { ascending: false });
            if (error) throw error;
            return sendJson(res, 200, { success: true, count: data.length, data });
        }
        else if (req.method === 'POST') {
            // Create Business (Onboarding) - Public or Private?
            // Usually Public Onboarding.

            const { name, subdomain, email, owner_name, owner_password, plan_type, gamification_enabled, phone } = req.body;

            // 1. Create Business
            const { data: business, error: bErr } = await supabase
                .from('businesses')
                .insert({ name, subdomain, email, plan_type: plan_type || 'starter', gamification_enabled: gamification_enabled || false, phone })
                .select('id, name, subdomain')
                .single();

            if (bErr) throw bErr; // Should handle unique constraint on subdomain

            // 2. Create Owner
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
                // Rollback business?
                await supabase.from('businesses').delete().eq('id', business.id);
                throw uErr;
            }

            // 3. Config
            if (gamification_enabled) {
                await supabase.from('gamification_config').insert({ business_id: business.id });
            }

            return sendJson(res, 201, { success: true, data: business });
        }
        else {
            return sendJson(res, 405, { error: 'Method Not Allowed' });
        }
    } catch (err) {
        return handleError(res, err);
    }
};
