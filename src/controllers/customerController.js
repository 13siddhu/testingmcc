const customerService = require("../services/customerService");

exports.test = (req, res) => {
    res.json({
        success: true,
        message: "Customer Module Working"
    });
};

exports.syncCustomer = async (req, res) => {
    try {
        const result = await customerService.syncCustomer(req.body);
        res.json(result);
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getCustomer = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await customerService.getCustomer(phone);
        res.json(customer);
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.saveAvatar = async (req, res) => {
    try {
        const { phone, avatarBase64 } = req.body;
        const result = await customerService.saveCustomerAvatar(phone, avatarBase64);
        res.json({ success: result });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.webhookCreate = async (req, res) => {
    res.sendStatus(200);

    const shopifyCustomer = req.body;
    console.log(`[webhook] customers/create — Shopify ID: ${shopifyCustomer.id}, phone: ${shopifyCustomer.phone}`);

    try {
        if (!shopifyCustomer.phone) {
            console.warn(`[webhook] customers/create — skipping, no phone number on customer ${shopifyCustomer.id}`);
            return;
        }
        const result = await customerService.syncCustomer(shopifyCustomer);
        console.log(`[webhook] customers/create — synced to Rista:`, JSON.stringify(result).slice(0, 200));
    } catch (err) {
        console.error(`[webhook] customers/create — sync failed: ${err.message}`);
    }
};

exports.webhookUpdate = async (req, res) => {
    res.sendStatus(200);

    const shopifyCustomer = req.body;
    console.log(`[webhook] customers/update — Shopify ID: ${shopifyCustomer.id}, phone: ${shopifyCustomer.phone}`);

    try {
        if (!shopifyCustomer.phone) {
            console.warn(`[webhook] customers/update — skipping, no phone number on customer ${shopifyCustomer.id}`);
            return;
        }
        const result = await customerService.syncCustomer(shopifyCustomer);
        console.log(`[webhook] customers/update — re-synced to Rista:`, JSON.stringify(result).slice(0, 200));
    } catch (err) {
        console.error(`[webhook] customers/update — sync failed: ${err.message}`);
    }
};