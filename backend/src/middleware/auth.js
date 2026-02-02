const jwt = require('jsonwebtoken');
const db = require('../config/database');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        // Optional: Fetch full user from DB if needed, but JWT payload usually creates enough context
        // const { rows } = await db.query('SELECT * FROM business_users WHERE id = $1', [decoded.id]);
        // if (rows.length === 0) return res.status(401).send('User not found');

        // Validation: Ensure user belongs to the requested business context (if set)
        if (req.businessId && req.user.business_id && req.businessId !== req.user.business_id) {
            // Super admin exception could go here
            return res.status(403).json({ success: false, error: 'User does not belong to this business context' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
};

// Generic Role check
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
