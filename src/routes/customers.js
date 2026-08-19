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

// Get customer by phone number
router.get("/:phone", customerController.getCustomer);

// Manual sync — called directly with a JSON body (no HMAC check needed)
router.post("/sync", customerController.syncCustomer);

// Shopify webhook: customers/create
// Fires when a customer registers on the Shopify storefront
router.post(
    "/webhook/create",
    express.raw({ type: "application/json" }),
    verifyShopify,
    customerController.webhookCreate
);

// Shopify webhook: customers/update
// Fires when a customer updates their profile (phone, email, name)
router.post(
    "/webhook/update",
    express.raw({ type: "application/json" }),
    verifyShopify,
    customerController.webhookUpdate
);

module.exports = router;
