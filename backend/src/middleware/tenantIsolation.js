const db = require('../config/database');

const tenantIsolation = async (req, res, next) => {
    // 1. Check for Super Admin override (optional, if using a specific header or token claim)
    // For now, we enforce tenant context for everyone except specific admin routes

    let tenantIdentifier = null;

    // Strategy A: Subdomain (e.g., barberia.turnopro.com)
    // Host header usually contains the full domain
    const host = req.get('host');
    if (host) {
        const parts = host.split('.');
        // Assuming format: [subdomain].[domain].[tld] or just [subdomain].localhost
        if (parts.length >= 2) {
            // Check if it's the admin domain (admin.turnopro.com)
            // This logic needs env config for base domain
            if (parts[0] !== 'www' && parts[0] !== 'api') {
                tenantIdentifier = parts[0];
            }
        }
    }

    // Strategy B: Custom Header (useful for development/testing/mobile apps)
    if (req.headers['x-business-id']) {
        // If exact ID is passed
        req.businessId = req.headers['x-business-id'];
        return next();
    }

    if (req.headers['x-tenant-subdomain']) {
        tenantIdentifier = req.headers['x-tenant-subdomain'];
    }

    if (!tenantIdentifier) {
        // Fallback or Error? 
        // If it's the main landing page or super-admin login, we might not have a tenant.
        // We'll let it pass but req.businessId will be null.
        // Routes needing isolation must check for req.businessId
        return next();
    }

    try {
        // Resolve tenant
        const result = await db.query(
            'SELECT id, name, plan_type, gamification_enabled, subscription_status FROM businesses WHERE subdomain = $1',
            [tenantIdentifier]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Business not found' });
        }

        const business = result.rows[0];

        if (business.subscription_status !== 'active' && business.subscription_status !== 'trialing') {
            // Handle suspended accounts? For now just warn
        }

        req.businessId = business.id;
        req.business = business;
        next();

    } catch (err) {
        console.error('Tenant Isolation Error:', err);
        res.status(500).json({ success: false, error: 'Tenant resolution failed' });
    }
};

module.exports = { tenantIsolation };
