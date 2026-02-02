const express = require('express');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployeeSchedule
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

router.use(tenantIsolation);

router.get('/', getEmployees);
router.get('/:id', getEmployee);

router.post('/', protect, authorize('owner', 'admin'), createEmployee);
router.put('/:id/schedule', protect, authorize('owner', 'admin'), updateEmployeeSchedule);

module.exports = router;
