const db = require('../config/database');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM services WHERE business_id = $1 AND deleted_at IS NULL ORDER BY name ASC',
            [req.businessId]
        );
        res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM services WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
            [req.params.id, req.businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin)
exports.createService = async (req, res, next) => {
    try {
        const { name, description, duration_minutes, price, points_reward, category, image_url } = req.body;

        const result = await db.query(
            `INSERT INTO services 
            (business_id, name, description, duration_minutes, price, points_reward, category, image_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [req.businessId, name, description, duration_minutes, price, points_reward || 0, category, image_url]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Update service
// @route   PATCH /api/services/:id
// @access  Private (Admin)
exports.updateService = async (req, res, next) => {
    try {
        const { name, description, duration_minutes, price, points_reward, category, is_active } = req.body;

        const result = await db.query(
            `UPDATE services 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description),
                 duration_minutes = COALESCE($3, duration_minutes),
                 price = COALESCE($4, price),
                 points_reward = COALESCE($5, points_reward),
                 category = COALESCE($6, category),
                 is_active = COALESCE($7, is_active),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 AND business_id = $9 AND deleted_at IS NULL
             RETURNING *`,
            [name, description, duration_minutes, price, points_reward, category, is_active, req.params.id, req.businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
exports.deleteService = async (req, res, next) => {
    try {
        const result = await db.query(
            'UPDATE services SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND business_id = $2 RETURNING id',
            [req.params.id, req.businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
