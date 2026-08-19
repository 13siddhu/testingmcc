/**
 * csvExportService.js
 *
 * Generates a Shopify product import CSV from the Rista enterprise catalog.
 * Import the downloaded CSV at: Shopify admin → Products → Import
 *
 * Shopify CSV format spec:
 * https://help.shopify.com/en/manual/products/import-export/using-csv
 */

const { ristaGet } = require("../helpers/rista");

// Shopify CSV column headers (exact order matters)
const CSV_HEADERS = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Option2 Name",
    "Option2 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Google Shopping / Google Product Category",
    "Google Shopping / Gender",
    "Google Shopping / Age Group",
    "Google Shopping / MPN",
    "Google Shopping / Condition",
    "Google Shopping / Custom Product",
    "Google Shopping / Custom Label 0",
    "Google Shopping / Custom Label 1",
    "Google Shopping / Custom Label 2",
    "Google Shopping / Custom Label 3",
    "Google Shopping / Custom Label 4",
    "Variant Image",
    "Variant Weight Unit",
    "Variant Tax Code",
    "Cost per item",
    "Included / India",
    "Price / India",
    "Compare At Price / India",
    "Status"
];

/**
 * Converts a string to a URL-safe Shopify handle.
 * e.g. "Hot Coffee - Cappuccino" → "hot-coffee-cappuccino"
 */
function toHandle(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Escapes a CSV field value.
 */
function csvField(val) {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converts an array of field values to a CSV row.
 */
function csvRow(fields) {
    return fields.map(csvField).join(",");
}

/**
 * Main export function.
 * Returns the full CSV string.
 */
exports.generateShopifyCsv = async () => {

    // Fetch full Rista catalog
    const catalog    = await ristaGet("/catalog/enterprise");
    const items      = catalog.items     || [];
    const categories = catalog.categories || [];

    if (items.length === 0) {
        throw new Error("No items found in Rista catalog");
    }

    // Build category map for lookup
    const categoryMap = {};
    for (const cat of categories) {
        categoryMap[cat.categoryId] = cat.name;
    }

    const vendor = process.env.COMPANY_NAME || "My Coffee Co";

    // Group items by groupItemId (variants belong to same product)
    const groups = new Map();
    for (const item of items) {
        if (item.status !== "Active") continue;
        const groupId = item.groupItemId || item.itemId;
        if (!groups.has(groupId)) groups.set(groupId, []);
        groups.get(groupId).push(item);
    }

    const rows = [csvRow(CSV_HEADERS)];

    for (const [, groupItems] of groups) {
        const first       = groupItems[0];
        const categoryName = categoryMap[first.categoryId] || "Coffee";
        const isMultiVariant = groupItems.length > 1;

        // Deduplicate item name for the handle
        const handle = toHandle(`${categoryName}-${first.itemName}`);

        groupItems.forEach((item, index) => {
            const isFirstRow = index === 0;

            // Get best available price — prefer "Takeaway" or "Dine In", fallback to first
            const priceEntry =
                (item.prices || []).find(p => p.channel === "Takeaway") ||
                (item.prices || []).find(p => p.channel === "Dine In")  ||
                (item.prices || [])[0];

            const price = priceEntry ? priceEntry.price : 0;

            // Option value — size variant or "Default"
            const optionValue = isMultiVariant && item.variantValues && item.variantValues.length > 0
                ? item.variantValues.map(v => v.value).join(" / ")
                : "Default";

            const row = [
                handle,                              // Handle
                isFirstRow ? item.itemName : "",     // Title (only on first row)
                isFirstRow ? "" : "",                // Body (HTML)
                isFirstRow ? vendor : "",            // Vendor
                isFirstRow ? "Food & Drink" : "",   // Product Category
                isFirstRow ? categoryName : "",      // Type
                isFirstRow ? categoryName : "",      // Tags
                isFirstRow ? "TRUE" : "",            // Published
                isFirstRow ? (isMultiVariant ? "Size" : "Title") : "", // Option1 Name
                optionValue,                         // Option1 Value
                "",                                  // Option2 Name
                "",                                  // Option2 Value
                item.skuCode,                        // Variant SKU ← key field
                "0",                                 // Variant Grams
                "shopify",                           // Variant Inventory Tracker
                "100",                               // Variant Inventory Qty
                "deny",                              // Variant Inventory Policy
                "manual",                            // Variant Fulfillment Service
                price,                               // Variant Price
                "",                                  // Variant Compare At Price
                "FALSE",                             // Variant Requires Shipping
                "TRUE",                              // Variant Taxable
                "",                                  // Variant Barcode
                "",                                  // Image Src
                isFirstRow ? "1" : "",               // Image Position
                "",                                  // Image Alt Text
                "FALSE",                             // Gift Card
                isFirstRow ? item.itemName : "",     // SEO Title
                "",                                  // SEO Description
                "", "", "", "", "", "", "", "", "", "", // Google Shopping fields
                "",                                  // Variant Image
                "g",                                 // Variant Weight Unit
                "",                                  // Variant Tax Code
                "",                                  // Cost per item
                "TRUE",                              // Included / India
                price,                               // Price / India
                "",                                  // Compare At Price / India
                isFirstRow ? "active" : ""           // Status
            ];

            rows.push(csvRow(row));
        });
    }

    return rows.join("\n");
};
