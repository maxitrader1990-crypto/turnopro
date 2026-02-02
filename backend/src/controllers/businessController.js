const db = require('../config/database');
const bcrypt = require('bcrypt');

// @desc    Get all businesses
// @route   GET /api/admin/businesses
// @access  Private (Super Admin)
exports.getBusinesses = async (req, res, next) => {
    try {
        // TODO: Add pagination
        const result = await db.query('SELECT * FROM businesses WHERE deleted_at IS NULL ORDER BY created_at DESC');
        res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single business
// @route   GET /api/admin/businesses/:id
// @access  Private (Super Admin)
exports.getBusiness = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM businesses WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Business not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new business (Onboarding)
// @route   POST /api/admin/businesses
// @access  Private (Super Admin) or Public (if onboarding)
exports.createBusiness = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        const {
            name,
            subdomain,
            email,
            owner_name,
            owner_password,
            plan_type,
            gamification_enabled,
            phone
        } = req.body;

        await client.query('BEGIN');

        // 1. Create Business
        const businessRes = await client.query(
            `INSERT INTO businesses 
            (name, subdomain, email, plan_type, gamification_enabled, phone) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id, name, subdomain`,
            [name, subdomain, email, plan_type || 'starter', gamification_enabled || false, phone]
        );
        const business = businessRes.rows[0];

        // 2. Create Owner User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(owner_password, salt);

        await client.query(
            `INSERT INTO business_users 
            (business_id, full_name, email, password_hash, role) 
            VALUES ($1, $2, $3, $4, 'owner')`,
            [business.id, owner_name, email, hashedPassword]
        );

        // 3. Create Default Gamification Config (if enabled)
        if (gamification_enabled) {
            await client.query(
                `INSERT INTO gamification_config (business_id) VALUES ($1)`,
                [business.id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            data: business
        });

    } catch (err) {
        await client.query('ROLLBACK');
        // Handle unique violation (23505)
        if (err.code === '23505') {
            return res.status(400).json({ success: false, error: 'Subdomain or Email already exists' });
        }
        next(err);
    } finally {
        client.release();
    }
};

// @desc    Update business
// @route   PATCH /api/admin/businesses/:id
// @access  Private (Super Admin)
exports.updateBusiness = async (req, res, next) => {
    try {
        const { name, plan_type, subscription_status } = req.body;

        // Simple dynamic update could be better, but fixed fields for now
        const result = await db.query(
            `UPDATE businesses 
             SET name = COALESCE($1, name), 
                 plan_type = COALESCE($2, plan_type), 
                 subscription_status = COALESCE($3, subscription_status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND deleted_at IS NULL
             RETURNING *`,
            [name, plan_type, subscription_status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Business not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete business (Soft delete)
// @route   DELETE /api/admin/businesses/:id
// @access  Private (Super Admin)
exports.deleteBusiness = async (req, res, next) => {
    try {
        const result = await db.query(
            'UPDATE businesses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Business not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
