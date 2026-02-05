
const { sendJson, handleError, verifyToken } = require('../../api/_lib/utils');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
    }

    try {
        const user = await verifyToken(req);

        return sendJson(res, 200, {
            success: true,
            data: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                business_id: user.business_id
            }
        });

    } catch (err) {
        return handleError(res, err);
    }
};
