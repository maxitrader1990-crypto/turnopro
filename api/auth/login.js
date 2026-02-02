
const supabase = require('../../api/_lib/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendJson, handleError } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const { email, password, business_id } = req.body;

        const targetBusinessId = business_id; // For login we rely on body

        if (!email || !password || !targetBusinessId) {
            return sendJson(res, 400, { success: false, error: 'Please provide email, password and business context' });
        }

        // Check for user
        const { data: user, error } = await supabase
            .from('business_users')
            .select('*')
            .eq('email', email)
            .eq('business_id', targetBusinessId)
            .single();

        if (error || !user) {
            return sendJson(res, 401, { success: false, error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return sendJson(res, 401, { success: false, error: 'Invalid credentials' });
        }

        // Generate Token
        // Using existing logic (JWT_SECRET must be in env)
        const token = jwt.sign(
            { id: user.id, business_id: user.business_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return sendJson(res, 200, {
            success: true,
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
                business_id: user.business_id
            }
        });

    } catch (err) {
        return handleError(res, err);
    }
};
