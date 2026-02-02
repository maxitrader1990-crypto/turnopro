const express = require('express');
const {
    getWallet,
    getRewards,
    redeemReward,
    getLeaderboard,
    updateConfig,
    createReward
} = require('../controllers/gamificationController');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(tenantIsolation);

// Public Routes (or public context)
router.get('/rewards', getRewards); // Catalog
router.get('/leaderboard', getLeaderboard);

// Protected Routes (Customer/Admin)
router.get('/wallet', protect, getWallet); // Needs JWT to identify user/customer
router.post('/redeem', protect, redeemReward);

// Admin Routes
router.patch('/config', protect, authorize('owner', 'admin'), updateConfig);
router.post('/rewards', protect, authorize('owner', 'admin'), createReward);

module.exports = router;
