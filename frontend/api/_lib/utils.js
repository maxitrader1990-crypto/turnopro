import jwt from 'jsonwebtoken';
import supabase from './supabase.js';

// Standard response helper
export const sendJson = (res, statusCode, data) => {
    res.status(statusCode).json(data);
};

// Error handler helper
export const handleError = (res, err) => {
    console.error('API Error:', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Server Error'
    });
};

// Verify Token Middleware (Logic)
// Returns user object or throws error
export const verifyToken = async (req) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        const error = new Error('Not authorized to access this route');
        error.statusCode = 401;
        throw error;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB to ensure validity/role
        const { data: user, error } = await supabase
            .from('business_users')
            .select('*')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            throw new Error('User not found');
        }

        if (user.role !== decoded.role) {
            // Role changed? Optional check
        }


        return user;
    } catch (err) {
        const error = new Error('Not authorized to access this route');
        error.statusCode = 401;
        throw error;
    }
};

export const getBusinessId = (req) => {
    // 1. Check header
    if (req.headers['x-business-id']) {
        return req.headers['x-business-id'];
    }
    // 2. Check query param (fallback)
    if (req.query && req.query.business_id) {
        return req.query.business_id;
    }
    return null;
}
