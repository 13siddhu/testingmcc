const crypto = require("crypto");

/**
 * Verifies the HMAC signature on incoming Shopify webhook requests.
 * Shopify sends the signature in the X-Shopify-Hmac-SHA256 header,
 * computed as HMAC-SHA256 of the raw request body using your webhook secret.
 *
 * IMPORTANT: This middleware must be applied BEFORE express.json() parses the body,
 * because it needs access to the raw buffer. Apply it per-route, not globally.
 *
 * Usage in a route file:
 *   const verifyShopify = require("../middleware/verifyShopify");
 *   router.post("/create", verifyShopify, orderController.createOrder);
 */
function verifyShopify(req, res, next) {
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];

    if (!hmacHeader) {
        return res.status(401).json({
            success: false,
            error: "Missing Shopify HMAC signature"
        });
    }

    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!secret) {
        console.error("SHOPIFY_WEBHOOK_SECRET is not set in environment");
        return res.status(500).json({
            success: false,
            error: "Webhook secret not configured"
        });
    }

    // req.body must be the raw Buffer — use express.raw() on this route
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
        return res.status(400).json({
            success: false,
            error: "Raw body not available for HMAC verification. Use express.raw() on this route."
        });
    }

    const digest = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("base64");

    const isValid = crypto.timingSafeEqual(
        Buffer.from(digest),
        Buffer.from(hmacHeader)
    );

    if (!isValid) {
        console.error("HMAC verification FAILED");
        console.error("Expected digest:", digest);
        console.error("Received header:", hmacHeader);
        return res.status(401).json({
            success: false,
            error: "Invalid Shopify HMAC signature"
        });
    }

    console.log("HMAC verification PASSED — parsing body...");

    // Parse the JSON body manually since we used express.raw()
    try {
        req.body = JSON.parse(rawBody.toString("utf8"));
        console.log("Body parsed successfully, calling next...");
    } catch {
        console.error("Failed to parse JSON body");
        return res.status(400).json({
            success: false,
            error: "Invalid JSON body"
        });
    }

    next();
}

module.exports = verifyShopify;
