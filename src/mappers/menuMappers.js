/**
 * buildMenu
 *
 * Transforms the Rista enterprise catalog + sold-out list
 * into a clean menu structure for the website.
 *
 * Rista catalog item types:
 * - "Group"  — a parent item with size/variant children (e.g. Cappuccino)
 *              has variantAttributes: [{ name: "Size", values: [...] }]
 *              children reference it via groupItemId
 * - "Simple" — standalone item OR a variant child of a Group
 *
 * Output: Group items carry a `variants` array of their child items
 * (each with skuCode, label, price, tax, available).
 * Simple items with no groupItemId are rendered as standalone cards.
 */
exports.buildMenu = (catalog, soldOut, channel) => {

    // Build a set of sold-out SKU codes for fast lookup
    const soldOutSkus = new Set(
        (soldOut?.data || []).map(item => item.skuCode)
    );

    // Categories to hide from the online ordering menu
    // Add category names here (case-insensitive) to exclude them
    const HIDDEN_CATEGORIES = [
        "coffee beans",
        "instant coffee",
        "drip bags"
    ];

    // Build a category map for fast lookup
    const categoryMap = {};
    for (const cat of (catalog.categories || [])) {
        const isHidden = HIDDEN_CATEGORIES.some(
            h => cat.name.toLowerCase().includes(h.toLowerCase())
        );
        if (isHidden) continue;
        categoryMap[cat.categoryId] = {
            categoryId: cat.categoryId,
            name: cat.name,
            items: []
        };
    }

    // Index ALL items by itemId for group → children lookup
    const itemById = {};
    for (const item of (catalog.items || [])) {
        itemById[item.itemId] = item;
    }

    // Separate Group parents from variant children and standalones
    const groupParents  = {};   // itemId → group item
    const childrenByParent = {}; // parentItemId → [child items]
    const standalones   = [];

    for (const item of (catalog.items || [])) {
        if (item.status !== "Active") continue;
        if (item.type === "Group") {
            groupParents[item.itemId] = item;
        } else if (item.groupItemId) {
            if (!childrenByParent[item.groupItemId]) childrenByParent[item.groupItemId] = [];
            childrenByParent[item.groupItemId].push(item);
        } else {
            standalones.push(item);
        }
    }

    // Helper: build a priced item object
    function buildItem(item, overrideName) {
        const priceEntry = (item.prices || []).find(p => p.channel === channel);
        if (!priceEntry) return null;
        const basePrice    = Number(priceEntry.price) || 0;
        const displayPrice = Math.round(basePrice);
        const taxAmount    = Math.round(basePrice * 0.05);
        const sku          = item.skuCode || item.itemId;
        return {
            itemId:    item.itemId,
            skuCode:   sku,
            name:      overrideName || item.itemName,
            price:     displayPrice,
            tax:       taxAmount,
            available: !soldOutSkus.has(sku),
            priceBook: priceEntry.priceBook
        };
    }

    // Process Group parents — attach their variant children as size options
    for (const [parentItemId, parent] of Object.entries(groupParents)) {
        const cat = categoryMap[parent.categoryId];
        if (!cat) continue;

        const children = (childrenByParent[parentItemId] || [])
            .filter(c => c.status === "Active");

        // Extract size labels from parent's variantAttributes
        // Rista stores: variantAttributes: [{ name: "Size", values: ["Regular","Large","Extra Large"] }]
        const sizeLabels = [];
        if (parent.variantAttributes && Array.isArray(parent.variantAttributes)) {
            for (const attr of parent.variantAttributes) {
                if (attr.name === "Size" && Array.isArray(attr.values)) {
                    sizeLabels.push(...attr.values);
                }
            }
        }

        // Build variant size options from children
        // Map children to parent's size labels by position (sorted by price ascending)
        const sortedChildren = children.sort((a, b) => {
            const priceA = (a.prices || []).find(p => p.channel === channel)?.price || 0;
            const priceB = (b.prices || []).find(p => p.channel === channel)?.price || 0;
            return Number(priceA) - Number(priceB);
        });

        const variantOptions = sortedChildren
            .map((child, index) => {
                // Use size label from parent's variantAttributes array by position
                // Fall back to stripping parent name if no labels array
                let label = sizeLabels[index] || '';

                // FALLBACK: If no size labels from parent, use default size names by position
                if (!label && sortedChildren.length > 0) {
                    const defaultSizes = ['Regular', 'Large', 'Extra Large', 'Jumbo', 'Party Size'];
                    label = defaultSizes[index] || `Option ${index + 1}`;
                }

                if (!label) {
                    // Fallback: strip parent name from child name
                    label = child.itemName
                        .replace(new RegExp(parent.itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
                        .replace(/^[\s\-\(\)\:\,\/]+|[\s\-\(\)\:\,\/]+$/g, '')
                        .trim();
                }

                // If still empty, try variantAttributes on the child itself
                if (!label) {
                    const attrs = child.variantAttributes || [];
                    for (const attr of attrs) {
                        const val = typeof attr === 'string' ? attr : (attr.value || attr.attributeValue || '');
                        if (val && !/^(true|false|active)$/i.test(val)) { label = val; break; }
                    }
                }

                // Last resort — use full child itemName
                if (!label) label = child.itemName;

                const built = buildItem(child, label);
                if (!built) return null;
                return { ...built, label };
            })
            .filter(Boolean);

        // Use lowest variant price as the "from" price on the card
        const fromPrice = variantOptions.length
            ? Math.min(...variantOptions.map(v => v.price))
            : 0;
        const fromTax = variantOptions.length
            ? Math.min(...variantOptions.map(v => v.tax))
            : 0;

        // Skip if no variants are available on this channel
        if (variantOptions.length === 0) continue;

        const parentSku = parent.skuCode || parent.itemId || (`group-${parent.itemId}`);

        cat.items.push({
            itemId:      parent.itemId,
            groupItemId: null,
            type:        "Group",
            skuCode:     parentSku,
            name:        parent.itemName,
            image:       parent.imageURL || null,
            variants:    variantOptions,   // array of { skuCode, label, price, tax, available }
            price:       fromPrice,        // lowest variant price shown on card
            tax:         fromTax,
            available:   variantOptions.some(v => v.available),
            itemNature:  parent.itemNature || "Goods",
            tags:        parent.itemTagIds || []
        });
    }

    // Process standalone Simple items (no groupItemId)
    for (const item of standalones) {
        const cat = categoryMap[item.categoryId];
        if (!cat) continue;
        const priceEntry = (item.prices || []).find(p => p.channel === channel);
        if (!priceEntry) continue;
        const basePrice    = Number(priceEntry.price) || 0;
        const displayPrice = Math.round(basePrice);
        const taxAmount    = Math.round(basePrice * 0.05);
        const itemSku      = item.skuCode || item.itemId;

        cat.items.push({
            itemId:      item.itemId,
            groupItemId: null,
            type:        "Simple",
            skuCode:     itemSku,
            name:        item.itemName,
            image:       item.imageURL || null,
            variants:    [],
            price:       displayPrice,
            tax:         taxAmount,
            available:   !soldOutSkus.has(itemSku),
            itemNature:  item.itemNature || "Goods",
            tags:        item.itemTagIds || []
        });
    }

    // Return only categories that have items on this channel
    const categories = Object.values(categoryMap).filter(
        cat => cat.items.length > 0
    );

    return {
        branch:     undefined,  // filled in by controller
        channel,
        categories
    };

};
