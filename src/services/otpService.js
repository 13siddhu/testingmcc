/**
 * otpService.js
 *
 * Sends OTPs via Twilio SMS.
 * Set OTP_MOCK_MODE=true in .env to use mock OTP "1234" without real SMS.
 * Set OTP_MOCK_MODE=false and fill in TWILIO_* vars to send real SMS.
 *
 * OTPs are stored in memory with a 10-minute expiry.
 * For production at scale, replace the in-memory store with Redis.
 */

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const USE_MOCK      = process.env.OTP_MOCK_MODE !== "false"; // true by default

// In-memory OTP store: phone → { otp, expiresAt }
const otpStore = new Map();

// Lazy-load Twilio client only when needed
let twilioClient = null;
function getTwilioClient() {
    if (!twilioClient) {
        const twilio = require("twilio");
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
    return twilioClient;
}

/**
 * Generate a 6-digit OTP.
 */
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP to a 10-digit Indian phone number.
 */
exports.sendOtp = async (phone) => {
    if (!phone || phone.length !== 10) {
        throw new Error("Phone must be a 10-digit Indian number");
    }

    const otp = USE_MOCK ? "1234" : generateOtp();

    // Store in memory
    otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS
    });

    if (USE_MOCK) {
        console.log(`[MOCK OTP] ${phone} → ${otp}`);
        return {
            success: true,
            message: "OTP sent (mock mode — use 1234)",
            mock: true
        };
    }

    // Send via Twilio
    const client = getTwilioClient();
    await client.messages.create({
        body: `Your My Coffee Co verification code is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to:   `+91${phone}`
    });

    console.log(`[OTP] Sent to +91${phone}`);
    return { success: true, message: "OTP sent" };
};

/**
 * Verify OTP for a phone number.
 * Single-use — deletes the OTP after successful verification.
 */
exports.verifyOtp = (phone, otp) => {
    const record = otpStore.get(phone);

    if (!record) {
        return { valid: false, error: "No OTP found for this number. Please request a new OTP." };
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return { valid: false, error: "OTP has expired. Please request a new one." };
    }

    if (record.otp !== String(otp).trim()) {
        return { valid: false, error: "Incorrect OTP. Please try again." };
    }

    otpStore.delete(phone);
    return { valid: true, phone };
};
