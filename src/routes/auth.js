const express    = require("express");
const router     = express.Router();
const otpService = require("../services/otpService");

/**
 * POST /auth/send-otp
 * Body: { phone }  — 10-digit Indian mobile number
 */
router.post("/send-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, error: "phone is required" });
        }

        // Strip country code if present
        const cleanPhone = phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);

        if (cleanPhone.length !== 10) {
            return res.status(400).json({ success: false, error: "Invalid phone number — must be 10 digits" });
        }

        const result = await otpService.sendOtp(cleanPhone);
        res.json(result);

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /auth/verify-otp
 * Body: { phone, otp }
 */
router.post("/verify-otp", (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, error: "phone and otp are required" });
        }

        const cleanPhone = phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
        const result     = otpService.verifyOtp(cleanPhone, otp);

        if (!result.valid) {
            return res.status(401).json({ success: false, error: result.error });
        }

        res.json({ success: true, phone: cleanPhone });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
