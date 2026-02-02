const db = require('../config/database');
const GamificationService = require('../services/gamificationService');

// @desc    Get Customer Wallet (Points, Level, History)
// @route   GET /api/gamification/wallet
// @access  Private (Customer/Admin)
exports.getWallet = async (req, res, next) => {
    try {
        // If admin, can pass ?customer_id
        let customerId;

        // Logic to determine customer_id based on role
        if (req.user.role === 'customer') {
            // Need to link user->customer first (TODO in phase 5 usually, assuming customer linked)
            // For now, if called by admin/employee:
            customerId = req.query.customer_id;
        } else {
            customerId = req.query.customer_id;
        }

        if (!customerId) return res.status(400).json({ error: 'Customer ID required' });

        const walletRes = await db.query(
            'SELECT * FROM customer_points WHERE business_id = $1 AND customer_id = $2',
            [req.businessId, customerId]
        );

        const historyRes = await db.query(
            'SELECT * FROM points_transactions WHERE business_id = $1 AND customer_id = $2 ORDER BY created_at DESC LIMIT 20',
            [req.businessId, customerId]
        );

        const data = walletRes.rows[0] || { current_points: 0, current_level: 'Novato' };
        data.history = historyRes.rows;

        // Get config to show next level progress
        const configRes = await db.query('SELECT levels_config FROM gamification_config WHERE business_id = $1', [req.businessId]);
        if (configRes.rows.length > 0) {
            data.levels = configRes.rows[0].levels_config;
        }

        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Rewards Catalog
// @route   GET /api/gamification/rewards
// @access  Public
exports.getRewards = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT * FROM rewards WHERE business_id = $1 AND is_active = true ORDER BY points_cost ASC',
            [req.businessId]
        );
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Redeem Reward
// @route   POST /api/gamification/redeem
// @access  Private
exports.redeemReward = async (req, res, next) => {
    try {
        const { customer_id, reward_id } = req.body;
        const result = await GamificationService.redeemReward(req.businessId, customer_id, reward_id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get Leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT cp.total_points_earned, cp.current_level, c.first_name, LEFT(c.last_name, 1) as last_initial
             FROM customer_points cp
             JOIN customers c ON cp.customer_id = c.id
             WHERE cp.business_id = $1
             ORDER BY cp.total_points_earned DESC
             LIMIT 10`,
            [req.businessId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Gamification Config (Admin)
// @route   PATCH /api/gamification/config
// @access  Private (Admin)
exports.updateConfig = async (req, res, next) => {
    try {
        const { points_per_visit, levels_config } = req.body;

        // Upsert
        const result = await db.query(
            `INSERT INTO gamification_config (business_id, points_per_visit, levels_config)
             VALUES ($1, $2, $3)
             ON CONFLICT (business_id) DO UPDATE SET
                points_per_visit = COALESCE($2, gamification_config.points_per_visit),
                levels_config = COALESCE($3, gamification_config.levels_config),
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.businessId, points_per_visit, levels_config ? JSON.stringify(levels_config) : null]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// @desc    Create Reward (Admin)
// @route   POST /api/gamification/rewards
// @access  Private (Admin)
exports.createReward = async (req, res, next) => {
    try {
        const { name, description, points_cost, type, stock } = req.body;
        const result = await db.query(
            `INSERT INTO rewards (business_id, name, description, points_cost, type, stock)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.businessId, name, description, points_cost, type, stock]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
};
