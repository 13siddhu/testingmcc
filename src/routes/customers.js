const express = require("express");

const router = express.Router();

const customerController = require("../controllers/customerController");
const verifyShopify      = require("../middleware/verifyShopify");

// Health check
router.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Customer routes are working"
    });
});

// Save customer real photo avatar (Base64)
router.post("/avatar", customerController.saveAvatar);

// Get customer by phone number (includes avatar Base64 if saved)
router.get("/:phone", customerController.getCustomer);

// Manual sync — called directly with a JSON body (no HMAC check needed)
router.post("/sync", customerController.syncCustomer);

// Shopify webhook: customers/create
router.post(
    "/webhook/create",
    express.raw({ type: "application/json" }),
    verifyShopify,
    customerController.webhookCreate
);

// Shopify webhook: customers/update
router.post(
    "/webhook/update",
    express.raw({ type: "application/json" }),
    verifyShopify,
    customerController.webhookUpdate
);

module.exports = router;
