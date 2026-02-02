const db = require('../config/database');

class GamificationService {

    /**
     * Award points to a customer and handle level upgrades
     * @param {Object} client - DB Client (optional for transaction)
     * @param {string} businessId 
     * @param {string} customerId 
     * @param {number} points 
     * @param {string} type - 'earn_visit', 'earn_bonus', etc.
     * @param {string} description 
     * @param {string} appointmentId - Optional
     */
    static async awardPoints(client, businessId, customerId, points, type, description, appointmentId = null) {
        const dbClient = client || db; // Use passed client (transaction) or pool

        // 1. Get current config/levels
        const configRes = await dbClient.query('SELECT levels_config FROM gamification_config WHERE business_id = $1', [businessId]);

        let levelsConfig = [];
        if (configRes.rows.length > 0) {
            levelsConfig = configRes.rows[0].levels_config;
        }

        // 2. Insert Transaction
        await dbClient.query(
            `INSERT INTO points_transactions 
            (business_id, customer_id, appointment_id, amount, transaction_type, description) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [businessId, customerId, appointmentId, points, type, description]
        );

        // 3. Update Customer Wallet (Upsert)
        // We use current_points + points, AND total_points_earned + points (only if points > 0)
        // If points < 0 (deduction), total_points_earned doesn't change

        const updateQuery = `
            INSERT INTO customer_points (business_id, customer_id, current_points, total_points_earned, last_points_activity)
            VALUES ($1, $2, $3, GREATEST($3, 0), CURRENT_TIMESTAMP)
            ON CONFLICT (business_id, customer_id) 
            DO UPDATE SET 
                current_points = customer_points.current_points + $3,
                total_points_earned = customer_points.total_points_earned + (CASE WHEN $3 > 0 THEN $3 ELSE 0 END),
                last_points_activity = CURRENT_TIMESTAMP
            RETURNING current_points, total_points_earned, current_level
        `;

        const walletRes = await dbClient.query(updateQuery, [businessId, customerId, points]);
        const wallet = walletRes.rows[0];

        // 4. Check Level Up
        if (levelsConfig.length > 0 && points > 0) {
            const newLevel = this.calculateLevel(wallet.total_points_earned, levelsConfig);
            if (newLevel !== wallet.current_level) {
                await dbClient.query(
                    'UPDATE customer_points SET current_level = $1 WHERE business_id = $2 AND customer_id = $3',
                    [newLevel, businessId, customerId]
                );
                // Return event for notification?
                return { ...wallet, newLevel, levelUp: true };
            }
        }

        return { ...wallet, levelUp: false };
    }

    static calculateLevel(totalPoints, levelsConfig) {
        // levelsConfig is array: [{name, min_points, max_points}, ...]
        // Sort by min_points DESC to find highest match
        const convert = (val) => typeof val === 'string' ? JSON.parse(val) : val;
        const levels = Array.isArray(levelsConfig) ? levelsConfig : convert(levelsConfig);

        if (!levels) return 'Novato';

        const match = levels.find(l => totalPoints >= l.min_points && totalPoints <= (l.max_points || 99999999));
        return match ? match.name : 'Novato';
    }

    /**
     * Redeem a reward
     */
    static async redeemReward(businessId, customerId, rewardId) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Check Reward
            const rewardRes = await client.query(
                'SELECT * FROM rewards WHERE id = $1 AND business_id = $2 AND is_active = true',
                [rewardId, businessId]
            );
            if (rewardRes.rows.length === 0) throw new Error('Reward not found or inactive');
            const reward = rewardRes.rows[0];

            if (reward.stock !== null && reward.stock <= 0) throw new Error('Out of stock');

            // 2. Check Balance
            const walletRes = await client.query(
                'SELECT current_points FROM customer_points WHERE business_id = $1 AND customer_id = $2',
                [businessId, customerId]
            );

            const currentPoints = walletRes.rows.length > 0 ? walletRes.rows[0].current_points : 0;
            if (currentPoints < reward.points_cost) throw new Error('Insufficient points');

            // 3. Deduct Points using awardPoints logic (negative amount)
            await this.awardPoints(
                client,
                businessId,
                customerId,
                -reward.points_cost,
                'redeem_reward',
                `Redeemed: ${reward.name}`
            );

            // 4. Create Redemption Record
            await client.query(
                `INSERT INTO reward_redemptions (business_id, customer_id, reward_id, points_cost, status)
                 VALUES ($1, $2, $3, $4, 'redeemed')`,
                [businessId, customerId, rewardId, reward.points_cost]
            );

            // 5. Decrease Stock
            if (reward.stock !== null) {
                await client.query('UPDATE rewards SET stock = stock - 1 WHERE id = $1', [rewardId]);
            }

            await client.query('COMMIT');
            return { success: true, reward: reward.name };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = GamificationService;
