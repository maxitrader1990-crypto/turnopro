const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper: Generate JWT
const generateToken = (id, business_id, role) => {
    return jwt.sign({ id, business_id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user (usually for onboarding or admin creating employees)
// @route   POST /api/auth/register
// @access  Public (for initial setup) or Private (for adding employees)
exports.register = async (req, res, next) => {
    try {
        const { full_name, email, password, business_id, role } = req.body;

        // Simple validation
        if (!email || !password || !business_id) {
            return res.status(400).json({ success: false, error: 'Please provide all fields' });
        }

        // Check if user exists
        const userExists = await db.query('SELECT email FROM business_users WHERE email = $1 AND business_id = $2', [email, business_id]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            'INSERT INTO business_users (business_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role',
            [business_id, full_name, email, hashedPassword, role || 'employee']
        );

        const user = result.rows[0];

        // Generate token
        const token = generateToken(user.id, business_id, user.role);

        res.status(201).json({
            success: true,
            token,
            user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password, business_id } = req.body;

        // If business_id is not provided in body, try to infer from header/context
        // But for login, usually we need to know WHERE they are logging in, OR email must be unique globally? 
        // Schema says UNIQUE(business_id, email), so email is NOT unique globally. 
        // Thus, we MUST know the business_id.
        // It should come from the frontend context (subdomain) or a selection.

        const targetBusinessId = business_id || req.businessId;

        if (!email || !password || !targetBusinessId) {
            return res.status(400).json({ success: false, error: 'Please provide email, password and business context' });
        }

        // Check for user
        const result = await db.query(
            'SELECT * FROM business_users WHERE email = $1 AND business_id = $2',
            [email, targetBusinessId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.business_id, user.role);

        res.status(200).json({
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
        next(err);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await db.query(
            'SELECT id, full_name, email, role, business_id FROM business_users WHERE id = $1',
            [req.user.id] // user id from JWT
        );

        res.status(200).json({
            success: true,
            data: user.rows[0]
        });
    } catch (err) {
        next(err);
    }
};
