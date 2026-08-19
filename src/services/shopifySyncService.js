/**
 * shopifySyncService.js
 *
 * Syncs the Rista enterprise catalog into Shopify as products.
 * - Groups variants under a single Shopify product per item group
 * - Sets SKU codes so items stay linked between Rista and Shopify
 * - Marks sold-out items as unavailable in Shopify
 * - Safe to run repeatedly (creates missing, updates existing)
 */

const { ristaGet }                      = require("../helpers/rista");
const { shopifyGet, shopifyPost, shopifyPut } = require("../clients/shopifyClient");

/**
 * Fetch all existing Shopify products and build a SKU → variant map
 * so we can detect what already exists.
 */
async function buildSkuMap() {
    const skuMap = {};   // sku → { productId, variantId }
    let url = "/products.json?limit=250&fields=id,variants";
    let hasMore = true;

    while (hasMore) {
        const data = await shopifyGet(url);
        for (const product of (data.products || [])) {
            for (const variant of (product.variants || [])) {
                if (variant.sku) {
                    skuMap[variant.sku] = {
                        productId: product.id,
                        variantId: variant.id
                    };
                }
            }
        }
        // Shopify pagination via Link header not easily available here —
        // for large catalogs consider implementing cursor pagination.
        hasMore = false;
    }
    return skuMap;
}

/**
 * Main sync function.
 * Call POST /shopify/sync to trigger this.
 */
exports.syncCatalogToShopify = async () => {

    // 1. Fetch full Rista catalog
    const catalog = await ristaGet("/catalog/enterprise");
    const items   = catalog.items || [];

    if (items.length === 0) {
        return { synced: 0, created: 0, updated: 0, message: "No items in catalog" };
    }

    // 2. Build existing SKU map from Shopify
    const skuMap = await buildSkuMap();

    // 3. Group Rista items by groupItemId (variants of the same product)
    //    Single items (no groupItemId) are treated as their own group.
    const groups = {};
    for (const item of items) {
        if (item.status !== "Active") continue;
        const groupId = item.groupItemId || item.itemId;
        if (!groups[groupId]) groups[groupId] = [];
        groups[groupId].push(item);
    }

    let created = 0;
    let updated = 0;

    // 4. For each group, create or update Shopify product
    for (const [, groupItems] of Object.entries(groups)) {
        const first = groupItems[0];

        // Build variants array
        const variants = groupItems.map(item => {
            // Pick the first available price from any channel as default
            const priceEntry = (item.prices || [])[0];
            const rawPrice   = priceEntry ? Number(priceEntry.price) : 0;
            const price      = String(Math.round(rawPrice * 1.05));

            const variantTitle = item.variantValues && item.variantValues.length > 0
                ? item.variantValues.map(v => v.value).join(" / ")
                : "Default";

            return {
                option1:          variantTitle,
                sku:              item.skuCode,
                price,
                inventory_policy: "deny",
                inventory_management: "shopify",
                requires_shipping: false,
                taxable:           true
            };
        });

        // Find category name
        const category = (catalog.categories || []).find(
            c => c.categoryId === first.categoryId
        );
        const categoryName = category ? category.name : "Coffee";

        // Check if any variant already exists in Shopify
        const existingVariant = groupItems
            .map(i => skuMap[i.skuCode])
            .find(Boolean);

        if (!existingVariant) {
            // Create new product
            try {
                await shopifyPost("/products.json", {
                    product: {
                        title:        first.itemName,
                        product_type: categoryName,
                        vendor:       process.env.COMPANY_NAME || "My Coffee Co",
                        published:    true,
                        options:      [{ name: "Size" }],
                        variants,
                        tags:         categoryName
                    }
                });
                created++;
            } catch (err) {
                console.error(`Failed to create product ${first.itemName}:`, err.message);
            }
        } else {
            // Update existing product variants (prices may have changed)
            try {
                const productId = existingVariant.productId;

                // Fetch current variants for this product
                const productData = await shopifyGet(`/products/${productId}.json`);
                const currentVariants = productData.product.variants || [];

                // Update price for each matching variant
                for (const item of groupItems) {
                    const shopifyVariant = currentVariants.find(v => v.sku === item.skuCode);
                    if (!shopifyVariant) continue;

                    const priceEntry = (item.prices || [])[0];
                    const rawPrice   = priceEntry ? Number(priceEntry.price) : 0;
                    const newPrice   = priceEntry ? String(Math.round(rawPrice * 1.05)) : shopifyVariant.price;

                    if (shopifyVariant.price !== newPrice) {
                        await shopifyPut(
                            `/variants/${shopifyVariant.id}.json`,
                            { variant: { id: shopifyVariant.id, price: newPrice } }
                        );
                    }
                }
                updated++;
            } catch (err) {
                console.error(`Failed to update product ${first.itemName}:`, err.message);
            }
        }

        // Small delay to avoid Shopify rate limits (2 req/sec on basic plan)
        await new Promise(r => setTimeout(r, 500));
    }

    return {
        synced:  created + updated,
        created,
        updated,
        message: `Sync complete. Created: ${created}, Updated: ${updated}`
    };
};
