const express = require('express');
const {
    getServices,
    getService,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(tenantIsolation); // Ensure context

// Public access to read services (for booking portal)
router.get('/', getServices);
router.get('/:id', getService);

// Protected routes for admin
router.post('/', protect, authorize('owner', 'admin'), createService);
router.patch('/:id', protect, authorize('owner', 'admin'), updateService);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteService);

module.exports = router;
