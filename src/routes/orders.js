const express = require("express");

const router = express.Router();

const orderController = require("../controllers/orderController");
const verifyShopify = require("../middleware/verifyShopify");

// Temporary debug middleware — logs every incoming webhook attempt
function debugWebhook(req, res, next) {
    console.log("=== WEBHOOK HIT ===");
    console.log("Time:", new Date().toISOString());
    console.log("Headers:", JSON.stringify({
        "x-shopify-hmac-sha256": req.headers["x-shopify-hmac-sha256"] ? "present" : "MISSING",
        "x-shopify-topic": req.headers["x-shopify-topic"],
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"]
    }));
    console.log("Body type:", Buffer.isBuffer(req.body) ? "Buffer" : typeof req.body);
    console.log("Body size:", req.body ? (Buffer.isBuffer(req.body) ? req.body.length : JSON.stringify(req.body).length) : 0);
    next();
}

// express.raw() captures the raw body buffer needed for HMAC verification
router.post("/create",
    express.raw({ type: "application/json" }),
    debugWebhook,
    verifyShopify,
    orderController.createOrder
);

router.get("/:saleId", orderController.getOrder);

router.post("/status", orderController.updateStatus);

// Rista POS → middleware callback
// Rista calls this when an order status changes (Accepted, Prepared, Dispatched, etc.)
router.post("/callback", orderController.ristaCallback);

module.exports = router;