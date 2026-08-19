const express            = require("express");
const router             = express.Router();
const directOrderService = require("../services/directOrderService");
const otpService         = require("../services/otpService");

/**
 * POST /direct-order/place
 * Places an order directly in Rista after OTP verification.
 *
 * Body: {
 *   phone, otp, name, email?,
 *   items: [{ skuCode, name, variant, price, qty }],
 *   branch, channel,
 *   paymentRef, paymentMode, totalAmount
 * }
 */
router.post("/place", async (req, res) => {
    try {
        const {
            phone, otp, name, email,
            items, branch, channel,
            paymentRef, paymentMode, totalAmount
        } = req.body;

        // Verify OTP first
        const cleanPhone = (phone || "").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
        const otpCheck   = otpService.verifyOtp(cleanPhone, otp);

        if (!otpCheck.valid) {
            return res.status(401).json({ success: false, error: otpCheck.error });
        }

        // Place order in Rista
        const result = await directOrderService.placeOrder({
            phone:       cleanPhone,
            name,
            email,
            items,
            branch,
            channel,
            paymentRef,
            paymentMode,
            totalAmount
        });

        res.json(result);

    } catch (err) {
        console.error("Direct order failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
