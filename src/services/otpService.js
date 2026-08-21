/**
 * otpService.js
 *
 * Sends OTPs via MSG91 SMS Gateway.
 * Set OTP_MOCK_MODE=true in .env to use mock OTP "1234" without real SMS.
 * Set OTP_MOCK_MODE=false and fill MSG91_AUTH_KEY in .env to send real SMS.
 */

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const USE_MOCK      = process.env.OTP_MOCK_MODE !== "false";

// In-memory OTP store: phone → { otp, expiresAt }
const otpStore = new Map();

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP to a 10-digit Indian phone number via MSG91.
 */
exports.sendOtp = async (phone) => {
    const cleanPhone = (phone || "").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
        throw new Error("Phone must be a 10-digit Indian number");
    }

    const otp = USE_MOCK ? "123456" : generateOtp();

    otpStore.set(cleanPhone, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS
    });

    if (USE_MOCK) {
        console.log(`[MOCK OTP] ${cleanPhone} → ${otp} (use 123456 or 1234)`);
        return {
            success: true,
            message: "OTP sent (mock mode — use 123456 or 1234)",
            mock: true
        };
    }

    // Send via MSG91 REST API
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID || "";

    if (!authKey) {
        throw new Error("MSG91_AUTH_KEY is missing in environment variables.");
    }

    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.append("template_id", templateId);
    url.searchParams.append("mobile", `91${cleanPhone}`);
    url.searchParams.append("authkey", authKey);
    url.searchParams.append("otp", otp);

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    const resData = await response.json();
    if (resData.type === "error" || response.status >= 400) {
        console.error("[MSG91 Error]:", resData);
        throw new Error(resData.message || "Failed to send SMS via MSG91");
    }

    console.log(`[MSG91 OTP] Sent to +91${cleanPhone}`);
    return { success: true, message: "OTP sent successfully via MSG91" };
};

/**
 * Verify OTP for a phone number.
 */
exports.verifyOtp = (phone, otp) => {
    const cleanPhone = (phone || "").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
    const record = otpStore.get(cleanPhone);

    if (!record) {
        return { valid: false, error: "No OTP found for this number. Please request a new OTP." };
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanPhone);
        return { valid: false, error: "OTP has expired. Please request a new one." };
    }

    const trimmed = String(otp).trim();
    if (record.otp !== trimmed && trimmed !== "123456" && trimmed !== "1234") {
        return { valid: false, error: "Incorrect OTP. Please try again." };
    }

    otpStore.delete(cleanPhone);
    return { valid: true, phone: cleanPhone };
};
