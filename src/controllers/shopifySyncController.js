const shopifySyncService = require("../services/shopifySyncService");
const csvExportService   = require("../services/csvExportService");

/**
 * POST /shopify/sync
 * Triggers a full sync of the Rista catalog into Shopify products.
 */
exports.syncProducts = async (req, res) => {
    try {
        console.log("Starting Rista → Shopify product sync...");
        const result = await shopifySyncService.syncCatalogToShopify();
        console.log("Sync complete:", result);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error("Sync failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /shopify/export-csv
 * Downloads a Shopify product import CSV generated from the Rista catalog.
 * Import at: Shopify admin → Products → Import
 */
exports.exportCsv = async (req, res) => {
    try {
        const csv = await csvExportService.generateShopifyCsv();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=rista-products.csv");
        res.send(csv);
    } catch (err) {
        console.error("CSV export failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
