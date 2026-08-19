const ristaClient = require("../clients/ristaClient");
const referralStore = require("../models/referralModel");

const {
    mapShopifyOrderToRista
} = require("../mappers/orderMapper");

/**
 * Look up a customer in Rista by phone number.
 * Returns the Rista customer ID string, or "" if not found / no phone on order.
 * Never throws — a missing customer should not block the order.
 */
async function resolveRistaCustomerId(shopifyOrder) {
    try {
        // customer.phone is null for New Customer Accounts (email login).
        // Fall back to shipping_address.phone which is filled at checkout.
        const rawPhone =
            shopifyOrder.customer?.phone ||
            shopifyOrder.shipping_address?.phone ||
            shopifyOrder.billing_address?.phone ||
            "";

        if (!rawPhone) return "";

        // Rista expects 10-digit local number — strip country code and + prefix
        const cleanPhone = rawPhone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
        if (cleanPhone.length !== 10) return "";

        const customer = await ristaClient.get(
            `/customer?phoneNumber=${encodeURIComponent(cleanPhone)}`
        );

        const ristaId = customer?.id || "";
        console.log(`[orderService] Resolved Rista customer ID: "${ristaId}" for phone ${cleanPhone}`);
        return ristaId;

    } catch (err) {
        // Customer not found in Rista, or lookup failed — do not block the order
        console.warn(`[orderService] Could not resolve Rista customer ID: ${err.message}`);
        return "";
    }
}

/**
 * Create a new sale in Rista from a Shopify order webhook.
 * Called from POST /orders/create
 */
exports.createOrder = async (shopifyOrder) => {

    // Resolve the Rista customer ID by phone before building the payload.
    // This populates customer.id in the sale so Rista can link the order
    // to the customer record and calculate loyalty points automatically.
    const ristaCustomerId = await resolveRistaCustomerId(shopifyOrder);

    const payload = mapShopifyOrderToRista(shopifyOrder, ristaCustomerId);

    const orderId = shopifyOrder.id || shopifyOrder.order_number || Date.now();
    const uniqueId = `sale_${orderId}`;

    console.log(`Sending to Rista POST /sale (uniqueId: ${uniqueId})`);
    console.log("Full Rista Payload:", JSON.stringify(payload, null, 2));

    const result = await ristaClient.post(
        "/sale",
        payload,
        uniqueId
    );

    // Track order with referral if code is valid
    const referralCode = (shopifyOrder.note_attributes || [])
        .find(attr => attr.name === 'referral_code')?.value;

    if (referralCode && referralStore.isValidReferral(referralCode)) {
        try {
            const trackingData = {
                orderId: shopifyOrder.id,
                invoiceNumber: result.invoiceNumber,
                shopifyOrderNumber: shopifyOrder.order_number || shopifyOrder.name,
                amount: parseFloat(shopifyOrder.total_price) || 0,
                customerEmail: shopifyOrder.customer?.email || shopifyOrder.email,
                customerPhone: shopifyOrder.customer?.phone || shopifyOrder.billing_address?.phone,
                branch: payload.branchCode,
                channel: payload.channel
            };

            const tracked = referralStore.trackOrder(referralCode, trackingData);
            console.log(`[orderService] Order tracked to referral ${referralCode}. Commission: ₹${tracked.commission}`);
            
            // Add referral info to result
            result.referral = {
                code: referralCode,
                commission: tracked.commission
            };
        } catch (refErr) {
            console.error(`[orderService] Failed to track referral: ${refErr.message}`);
            // Don't fail the order if referral tracking fails
        }
    }

    return result;

};

/**
 * Fetch a sale from Rista by its invoice number.
 * Called from GET /orders/:saleId
 * Rista uses "invoice" as the query param, not "id".
 */
exports.getOrder = async (saleId) => {

    if (!saleId) throw new Error("saleId is required");

    return await ristaClient.get(`/sale?invoice=${encodeURIComponent(saleId)}`);

};

/**
 * Push a status update for a sale to Rista.
 * Called from POST /orders/status
 * Body: { saleId, status, ... }
 */
exports.updateStatus = async (statusData) => {

    if (!statusData.saleId) throw new Error("saleId is required");

    return await ristaClient.post(
        "/sale/status",
        statusData,
        `status_${statusData.saleId}`
    );

};
