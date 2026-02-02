const express = require('express');
const {
    getBusinesses,
    getBusiness,
    createBusiness,
    updateBusiness,
    deleteBusiness
} = require('../controllers/businessController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here should be protected and only for Super Admin
// For now, we'll just use protect. In real super-admin context, we might check a specific role or token.

router.route('/')
    .get(protect, getBusinesses)
    .post(protect, createBusiness); // Or public for onboarding wizard?

router.route('/:id')
    .get(protect, getBusiness)
    .patch(protect, updateBusiness)
    .delete(protect, deleteBusiness);

module.exports = router;
