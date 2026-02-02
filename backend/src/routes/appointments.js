const express = require('express');
const {
    getAppointments,
    createAppointment,
    getAvailability,
    completeAppointment
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(tenantIsolation);

// Availability is public (for booking)
router.get('/availability', getAvailability);

// Create appointment (public booking)
router.post('/', createAppointment);

// List appointments (Protected)
router.get('/', protect, authorize('owner', 'admin', 'employee'), getAppointments);
// Complete appointment (Protected)
router.patch('/:id/complete', protect, authorize('owner', 'admin', 'employee'), completeAppointment);

module.exports = router;
