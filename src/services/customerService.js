const {
    mapShopifyToRista,
    mapRistaToFrontend
} = require("../mappers/customerMapper");

const ristaClient = require("../clients/ristaClient");

/**
 * Sync a Shopify customer into Rista.
 * Called from POST /customers/sync
 */
exports.syncCustomer = async (shopifyCustomer) => {

    if (!shopifyCustomer) throw new Error("Customer payload is required");
    if (!shopifyCustomer.phone) throw new Error("Customer phone is required");
    if (!shopifyCustomer.email) throw new Error("Customer email is required");

    const payload = mapShopifyToRista(shopifyCustomer);

    return await ristaClient.post("/customer", payload, `sync_${shopifyCustomer.id || shopifyCustomer.phone}`);

};

/**
 * Fetch a customer from Rista by phone number.
 * Called from GET /customers/:phone
 */
exports.getCustomer = async (phone) => {

    if (!phone) throw new Error("phone is required");

    // Rista expects 10-digit local number — strip country code and + prefix
    const cleanPhone = phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);

    const customer = await ristaClient.get(
        `/customer?phoneNumber=${encodeURIComponent(cleanPhone)}`
    );

    return {
        success: true,
        customer: mapRistaToFrontend(customer)
    };

};
