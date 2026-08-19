/**
 * Referral Routes
 */

const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');

// Create new referral code
router.post('/', referralController.createReferral);

// Get all referral codes
router.get('/', referralController.getAllReferrals);

// IMPORTANT: Specific routes must come BEFORE generic /:code route
// Otherwise Express will match /:code first

// Validate referral code (must be before /:code)
router.get('/validate/:code', referralController.validateReferral);

// Export referral report (must be before /:code)
router.get('/:code/export', referralController.exportReferralReport);

// Get referral stats (generic /:code route comes last)
router.get('/:code', referralController.getReferralStats);

// Update referral
router.put('/:code', referralController.updateReferral);

// Delete referral
router.delete('/:code', referralController.deleteReferral);

module.exports = router;
