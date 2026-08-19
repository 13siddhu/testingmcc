const express = require("express");
const router = express.Router();
const payuController = require("../controllers/payuController");

// POST /api/payment/payu-hash — Generate SHA-512 hash and payment params
router.post("/payu-hash", payuController.generateHash);

// POST /api/payment/payu-response — PayU callback redirect receiver
router.post("/payu-response", payuController.verifyResponse);

module.exports = router;
