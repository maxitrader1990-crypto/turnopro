const express = require('express');
const {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(tenantIsolation);

router.get('/', protect, authorize('owner', 'admin', 'employee'), getCustomers);
router.get('/:id', protect, authorize('owner', 'admin', 'employee'), getCustomer);
router.post('/', createCustomer); // Public (booking) or Protected? Usually public for self-registration, or protected for admin
router.patch('/:id', protect, authorize('owner', 'admin'), updateCustomer);

module.exports = router;
