/**
 * Referral Controller
 * 
 * Handles all referral/affiliate management endpoints
 */

const referralStore = require('../models/referralModel');

/**
 * Create a new referral code
 * POST /api/referrals
 */
exports.createReferral = async (req, res) => {
    try {
        const { code, name, email, type, commission } = req.body;

        // Validation
        if (!name || !email || !type || commission === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, type, commission'
            });
        }

        // Generate code if not provided
        const referralCode = code || referralStore.generateCode(type.substring(0, 3).toUpperCase());

        // Check if code already exists
        if (referralStore.getReferral(referralCode)) {
            return res.status(409).json({
                success: false,
                message: 'Referral code already exists'
            });
        }

        const referral = referralStore.createReferral({
            code: referralCode,
            name,
            email,
            type,
            commission,
            active: true
        });

        res.status(201).json({
            success: true,
            referral: {
                code: referral.code,
                name: referral.name,
                email: referral.email,
                type: referral.type,
                commission: referral.commission,
                active: referral.active,
                createdAt: referral.createdAt,
                referralLink: `${req.protocol}://${req.get('host')}/pages/menu?ref=${referral.code}`
            }
        });

    } catch (err) {
        console.error('[createReferral] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Get all referral codes
 * GET /api/referrals
 */
exports.getAllReferrals = async (req, res) => {
    try {
        const referrals = referralStore.getAllReferrals();

        const referralList = referrals.map(r => ({
            code: r.code,
            name: r.name,
            email: r.email,
            type: r.type,
            commission: r.commission,
            active: r.active,
            totalOrders: r.totalOrders,
            totalRevenue: r.totalRevenue,
            createdAt: r.createdAt,
            referralLink: `${req.protocol}://${req.get('host')}/pages/menu?ref=${r.code}`
        }));

        res.json({
            success: true,
            count: referralList.length,
            referrals: referralList
        });

    } catch (err) {
        console.error('[getAllReferrals] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Get referral details and stats
 * GET /api/referrals/:code
 */
exports.getReferralStats = async (req, res) => {
    try {
        const { code } = req.params;

        const stats = referralStore.getStats(code);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Referral code not found'
            });
        }

        res.json({
            success: true,
            stats: {
                ...stats,
                referralLink: `${req.protocol}://${req.get('host')}/pages/menu?ref=${code}`
            }
        });

    } catch (err) {
        console.error('[getReferralStats] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Update referral
 * PUT /api/referrals/:code
 */
exports.updateReferral = async (req, res) => {
    try {
        const { code } = req.params;
        const updates = req.body;

        // Don't allow changing the code itself
        delete updates.code;

        const referral = referralStore.updateReferral(code, updates);

        if (!referral) {
            return res.status(404).json({
                success: false,
                message: 'Referral code not found'
            });
        }

        res.json({
            success: true,
            referral: {
                code: referral.code,
                name: referral.name,
                email: referral.email,
                type: referral.type,
                commission: referral.commission,
                active: referral.active
            }
        });

    } catch (err) {
        console.error('[updateReferral] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Delete referral
 * DELETE /api/referrals/:code
 */
exports.deleteReferral = async (req, res) => {
    try {
        const { code } = req.params;

        const deleted = referralStore.deleteReferral(code);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Referral code not found'
            });
        }

        res.json({
            success: true,
            message: 'Referral deleted successfully'
        });

    } catch (err) {
        console.error('[deleteReferral] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Validate referral code
 * GET /api/referrals/validate/:code
 */
exports.validateReferral = async (req, res) => {
    try {
        const { code } = req.params;

        const isValid = referralStore.isValidReferral(code);

        if (!isValid) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'Invalid or inactive referral code'
            });
        }

        const referral = referralStore.getReferral(code);

        res.json({
            success: true,
            valid: true,
            referral: {
                code: referral.code,
                name: referral.name,
                type: referral.type
            }
        });

    } catch (err) {
        console.error('[validateReferral] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/**
 * Export referral report as CSV
 * GET /api/referrals/:code/export
 */
exports.exportReferralReport = async (req, res) => {
    try {
        const { code } = req.params;

        const stats = referralStore.getStats(code);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Referral code not found'
            });
        }

        // Generate CSV
        let csv = 'Invoice Number,Amount,Commission,Customer Email,Customer Phone,Timestamp\n';
        
        for (const order of stats.orders) {
            csv += `${order.invoiceNumber},${order.amount},${order.commission},"${order.customerEmail || ''}","${order.customerPhone || ''}",${order.timestamp}\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="referral-${code}-${Date.now()}.csv"`);
        res.send(csv);

    } catch (err) {
        console.error('[exportReferralReport] Error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
