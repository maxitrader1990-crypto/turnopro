import supabase from '../_lib/supabase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendJson, handleError, verifyToken } from '../_lib/utils.js';

export default async function handler(req, res) {
    const { route } = req.query;

    // Normalize route to array
    let segments = [];
    if (Array.isArray(route)) {
        segments = route;
    } else if (typeof route === 'string') {
        segments = [route];
    } else {
        // Fallback: try parsing req.url if backend maps it weirdly
        const path = req.url.split('?')[0];
        const parts = path.split('/');
        // parts: ['', 'api', 'auth', 'login']
        const authIndex = parts.indexOf('auth');
        if (authIndex !== -1 && authIndex < parts.length - 1) {
            segments = parts.slice(authIndex + 1);
        }
    }

    if (!segments || segments.length === 0) {
        return sendJson(res, 404, {
            success: false,
            error: 'Not Found',
            debug: { query: req.query, url: req.url, segments }
        });
    }

    const action = segments[0];

    try {
        // --- LOGIN ---
        if (action === 'login') {
            if (req.method !== 'POST') {
                return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
            }
            const { email, password, business_id } = req.body;
            // For login we rely on body business_id or assume it's provided
            if (!email || !password || !business_id) {
                return sendJson(res, 400, { success: false, error: 'Please provide email, password and business context' });
            }

            const { data: user, error } = await supabase
                .from('business_users')
                .select('*')
                .eq('email', email)
                .eq('business_id', business_id)
                .single();

            if (error || !user) {
                return sendJson(res, 401, { success: false, error: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return sendJson(res, 401, { success: false, error: 'Invalid credentials' });
            }

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
        }

        // --- REGISTER ---
        else if (action === 'register') {
            if (req.method !== 'POST') {
                return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
            }
            const { full_name, email, password, business_id, role } = req.body;

            if (!email || !password || !business_id) {
                return sendJson(res, 400, { success: false, error: 'Please provide all fields' });
            }

            const { data: existingUser } = await supabase
                .from('business_users')
                .select('email')
                .eq('email', email)
                .eq('business_id', business_id)
                .maybeSingle();

            if (existingUser) {
                return sendJson(res, 400, { success: false, error: 'User already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

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
        }

        // --- ME ---
        else if (action === 'me') {
            if (req.method !== 'GET') {
                return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
            }
            const user = await verifyToken(req);
            return sendJson(res, 200, {
                success: true,
                data: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    business_id: user.business_id
                }
            });
        }

        else {
            return sendJson(res, 404, { success: false, error: 'Not Found' });
        }

    } catch (err) {
        return handleError(res, err);
    }
};
