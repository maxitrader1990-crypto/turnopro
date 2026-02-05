
const supabase = require('../../api/_lib/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendJson, handleError } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const { full_name, email, password, business_id, role } = req.body;

        if (!email || !password || !business_id) {
            return sendJson(res, 400, { success: false, error: 'Please provide all fields' });
        }

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('business_users')
            .select('email')
            .eq('email', email)
            .eq('business_id', business_id)
            .maybeSingle();

        if (existingUser) {
            return sendJson(res, 400, { success: false, error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const { data: user, error } = await supabase
            .from('business_users')
            .insert({
                business_id,
                full_name,
                email,
                password_hash: hashedPassword,
                role: role || 'employee'
            })
            .select('id, full_name, email, role, business_id')
            .single();

        if (error) throw error;

        // Generate token
        const token = jwt.sign(
            { id: user.id, business_id: user.business_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return sendJson(res, 201, {
            success: true,
            token,
            user
        });

    } catch (err) {
        return handleError(res, err);
    }
};
