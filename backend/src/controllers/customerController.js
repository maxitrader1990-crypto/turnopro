const db = require('../config/database');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = 'SELECT * FROM customers WHERE business_id = $1 AND deleted_at IS NULL';
        const params = [req.businessId];

        if (search) {
            query += ' AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await db.query(query, params);
        res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM customers WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
            [req.params.id, req.businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // Optional: Get gamification stats here if needed, or in a separate endpoint

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private (Admin/Employee) or Public (Booking Flow)
exports.createCustomer = async (req, res, next) => {
    try {
        const { first_name, last_name, email, phone, birth_date, notes } = req.body;

        // Validation
        if (!first_name || !email) {
            return res.status(400).json({ success: false, error: 'Name and email are required' });
        }

        // Check duplicates? Maybe allow duplicates with same phone/email if business wants, but usually unique by email/phone per business
        // Schema doesn't enforce UNIQUE(email) per business strictly via constraint if nulls allowed, but we can check.

        const exists = await db.query(
            'SELECT id FROM customers WHERE email = $1 AND business_id = $2 AND deleted_at IS NULL',
            [email, req.businessId]
        );

        if (exists.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Customer with this email already exists' });
        }

        const result = await db.query(
            `INSERT INTO customers 
            (business_id, first_name, last_name, email, phone, birth_date, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [req.businessId, first_name, last_name, email, phone, birth_date, notes]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Update customer
// @route   PATCH /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
    try {
        const { first_name, last_name, email, phone, notes } = req.body;

        const result = await db.query(
            `UPDATE customers 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name),
                 email = COALESCE($3, email),
                 phone = COALESCE($4, phone),
                 notes = COALESCE($5, notes),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND business_id = $7
             RETURNING *`,
            [first_name, last_name, email, phone, notes, req.params.id, req.businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};
