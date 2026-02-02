const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { tenantIsolation } = require('../middleware/tenantIsolation');

const router = express.Router();

// Apply tenant isolation to help context (optional for login/register if passed in body)
router.use(tenantIsolation);

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
