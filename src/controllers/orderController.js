const orderService = require("../services/orderService");

exports.createOrder = async (req, res) => {

    try {
        console.log("createOrder controller hit");
        console.log("Order ID:", req.body?.id);
        console.log("Line items count:", req.body?.line_items?.length);
        console.log("Note attributes:", JSON.stringify(req.body?.note_attributes));

        const result = await orderService.createOrder(req.body);

        console.log("Rista order result:", JSON.stringify(result).slice(0, 200));
        if (result.url) {
            console.log("Rista order URL:", result.url);
        }
        console.log("Rista invoice number:", result.invoiceNumber);
        res.json(result);

    } catch (err) {
        console.error("createOrder error:", err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const orders = await orderService.getUserOrders(req.params.phone);
        res.json({
            success: true,
            phone: req.params.phone,
            count: orders.length,
            orders: orders
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getOrder = async (req, res) => {

    try {

        const result = await orderService.getOrder(req.params.saleId);

        res.json(result);

    } catch (err) {

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

exports.updateStatus = async (req, res) => {

    try {

        const result = await orderService.updateStatus(req.body);

        res.json(result);

    } catch (err) {

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

/**
 * POST /orders/callback
 * Receives order status update callbacks FROM Rista POS.
 * Rista calls this URL (set as callbackURL in the sale payload) when
 * an order status changes (e.g. Accepted, Prepared, Dispatched, Completed).
 *
 * Required header: x-rista-secret: <RISTA_CALLBACK_SECRET from .env>
 */
exports.ristaCallback = async (req, res) => {

    try {

        // Verify the shared secret Rista sends in the header
        const secret = process.env.RISTA_CALLBACK_SECRET;
        if (secret) {
            const incoming = req.headers["x-rista-secret"] || req.headers["x-callback-secret"] || "";
            if (incoming !== secret) {
                console.warn("[rista-callback] Rejected — invalid secret");
                return res.sendStatus(401);
            }
        }

        const body = req.body;
        const invoiceNum = body.invoiceNumber || body.invoice;
        const statusVal = body.status || body.fulfillmentStatus;

        console.log(`[rista-callback] Status update received:`);
        console.log(`  Invoice : ${invoiceNum || "(unknown)"}`);
        console.log(`  Status  : ${statusVal || "(unknown)"}`);
        console.log(`  Raw     : ${JSON.stringify(body).slice(0, 300)}`);

        if (invoiceNum && statusVal) {
            await orderService.updateOrderStatusByInvoice(invoiceNum, statusVal);
        }

        // Always respond 200 quickly so Rista doesn't retry
        res.sendStatus(200);

    } catch (err) {

        console.error("[rista-callback] Error:", err.message);
        res.sendStatus(200); // still 200 — don't cause Rista to retry

    }

};