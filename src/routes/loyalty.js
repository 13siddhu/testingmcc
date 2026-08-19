const express = require("express");

const router = express.Router();

const loyaltyController = require("../controllers/loyaltyController");

router.get("/:phone", loyaltyController.getLoyalty);

router.post("/credit", loyaltyController.creditPoints);

router.post("/debit", loyaltyController.debitPoints);

module.exports = router;