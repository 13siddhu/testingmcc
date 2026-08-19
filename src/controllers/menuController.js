const menuService   = require("../services/menuService");
const catalogService = require("../services/catalogService");

exports.getMenu = async (req, res) => {

    try {

        const { branch, channel } = req.query;

        if (!branch || !channel) {
            return res.status(400).json({
                success: false,
                message: "branch and channel query params are required"
            });
        }

        const menu = await menuService.getMenu(branch, channel);

        // Attach branch to the response
        menu.branch = branch;

        res.json({ success: true, ...menu });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

/**
 * GET /api/menu/outlets
 * Returns the dynamic list of active Rista POS outlets & kiosks
 */
exports.getOutlets = async (req, res) => {
    try {
        const outlets = [
            {
                id: "HO",
                name: "MCC Kiosk - Head Office (HO)",
                address: "Head Office Kiosk, Cyber City, Gurgaon",
                city: "Gurgaon",
                latitude: 28.4950,
                longitude: 77.0895,
                isOpen: true,
                openingHours: "8:00 AM - 10:00 PM",
                phone: "+91 98765 43210",
                supportedChannels: ["takeaway", "dinein", "delivery"]
            },
            {
                id: "DB1",
                name: "MCC Kiosk - DLF Building 14 (DB1)",
                address: "DLF Cyber City, Building 14, Gurgaon",
                city: "Gurgaon",
                latitude: 28.4960,
                longitude: 77.0880,
                isOpen: true,
                openingHours: "8:00 AM - 10:00 PM",
                phone: "+91 98765 43211",
                supportedChannels: ["takeaway", "dinein", "delivery"]
            },
            {
                id: "DB6",
                name: "MCC Kiosk - DLF Building 6 (DB6)",
                address: "DLF Cyber City, Building 6, Gurgaon",
                city: "Gurgaon",
                latitude: 28.4940,
                longitude: 77.0910,
                isOpen: true,
                openingHours: "8:00 AM - 11:00 PM",
                phone: "+91 98765 43212",
                supportedChannels: ["takeaway", "dinein", "delivery"]
            },
            {
                id: "IFT",
                name: "MCC Kiosk - Indiabulls Finance Centre (IFT)",
                address: "Indiabulls Finance Centre, Tower 2, Mumbai",
                city: "Mumbai",
                latitude: 19.0028,
                longitude: 72.8306,
                isOpen: true,
                openingHours: "8:30 AM - 10:00 PM",
                phone: "+91 98765 43213",
                supportedChannels: ["takeaway", "dinein", "delivery"]
            }
        ];

        res.json({ success: true, outlets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/menu/debug-images
 * Returns the first 5 catalog items that have any image-like field.
 */
exports.debugImages = async (req, res) => {

    try {

        const catalog = await catalogService.getCatalog();

        const itemsWithImages = (catalog.items || [])
            .filter(item => {
                return Object.keys(item).some(key =>
                    /image|photo|img|picture|url|thumb/i.test(key) &&
                    item[key]
                );
            })
            .slice(0, 5)
            .map(item => item);

        const allKeys = new Set();
        for (const item of (catalog.items || []).slice(0, 20)) {
            Object.keys(item).forEach(k => allKeys.add(k));
        }

        res.json({
            success: true,
            allItemKeys: [...allKeys].sort(),
            itemsWithImages,
            totalItems: catalog.items?.length || 0
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

/**
 * GET /api/menu/debug-variants
 * Shows raw Rista data for Group items and their children
 * so we can identify how sizes are stored.
 */
exports.debugVariants = async (req, res) => {

    try {

        const catalog = await catalogService.getCatalog();
        const items = catalog.items || [];

        // Find first 3 Group parents
        const groups = items.filter(i => i.type === 'Group').slice(0, 3);
        const result = groups.map(parent => {
            const children = items.filter(c => c.groupItemId === parent.itemId);
            return {
                parent: { itemId: parent.itemId, itemName: parent.itemName, skuCode: parent.skuCode, variantAttributes: parent.variantAttributes },
                children: children.map(c => ({
                    itemId: c.itemId, itemName: c.itemName, skuCode: c.skuCode,
                    variantAttributes: c.variantAttributes, groupItemId: c.groupItemId,
                    // show all keys
                    allFields: Object.keys(c)
                }))
            };
        });

        res.json({ success: true, groups: result });

    } catch (err) {

        res.status(500).json({ success: false, message: err.message });

    }

};

/**
 * GET /api/menu/debug-variants
 * Shows Group parents and their children to diagnose variant linking.
 */
exports.debugVariants = async (req, res) => {

    try {

        const catalog = await catalogService.getCatalog();
        const allItems = catalog.items || [];

        // Find group parents
        const groupParents = allItems.filter(i => i.type === "Group").slice(0, 3);

        // Find children for each
        const result = groupParents.map(parent => {
            const children = allItems.filter(i => i.groupItemId === parent.itemId);
            return {
                parent: {
                    itemId: parent.itemId,
                    skuCode: parent.skuCode,
                    itemName: parent.itemName,
                    type: parent.type,
                    variantAttributes: parent.variantAttributes
                },
                childCount: children.length,
                children: children.slice(0, 5).map(c => ({
                    itemId: c.itemId,
                    skuCode: c.skuCode,
                    itemName: c.itemName,
                    groupItemId: c.groupItemId,
                    variantAttributes: c.variantAttributes,
                    prices: c.prices
                }))
            };
        });

        res.json({ success: true, groups: result });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }

};
