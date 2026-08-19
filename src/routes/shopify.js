const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/shopifySyncController");

// POST /shopify/sync — sync Rista catalog to Shopify products (requires API token)
router.post("/sync", controller.syncProducts);

// GET /shopify/export-csv — download Shopify product import CSV from Rista catalog
router.get("/export-csv", controller.exportCsv);

module.exports = router;
