const ristaClient = require("../clients/ristaClient");

const {
    mapLoyalty,
    mapLoyaltyPayload
} = require("../mappers/loyaltyMapper");

/**
 * Get loyalty details for a customer by phone number.
 * Called from GET /loyalty/:phone
 */
exports.getLoyalty = async (phone) => {

    if (!phone) throw new Error("phone is required");

    // Rista expects 10-digit local number — strip country code and + prefix
    const cleanPhone = phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);

    const customer = await ristaClient.get(
        `/customer?phoneNumber=${encodeURIComponent(cleanPhone)}`
    );

    return {
        success: true,
        loyalty: mapLoyalty(customer)
    };

};

/**
 * Credit loyalty points to a customer.
 * Called from POST /loyalty/credit
 * Body: { ristaCustomerId, orderId, points, note? }
 *
 * ristaCustomerId: the Rista customer ID returned by GET /customer or POST /customer
 * e.g. "DAWL8UCW"
 */
exports.creditPoints = async (data) => {

    if (!data.ristaCustomerId) throw new Error("ristaCustomerId is required");
    if (!data.orderId) throw new Error("orderId is required");
    if (typeof data.points !== "number" || data.points <= 0) {
        throw new Error("points must be a positive number");
    }

    const payload = mapLoyaltyPayload(data, "Credit");

    return await ristaClient.post(
        "/customer/loyalty/points",
        payload,
        `credit_${data.orderId}`
    );

};

/**
 * Debit loyalty points from a customer.
 * Called from POST /loyalty/debit
 * Body: { ristaCustomerId, orderId, points, note? }
 */
exports.debitPoints = async (data) => {

    if (!data.ristaCustomerId) throw new Error("ristaCustomerId is required");
    if (!data.orderId) throw new Error("orderId is required");
    if (typeof data.points !== "number" || data.points <= 0) {
        throw new Error("points must be a positive number");
    }

    const payload = mapLoyaltyPayload(data, "Debit");

    return await ristaClient.post(
        "/customer/loyalty/points",
        payload,
        `debit_${data.orderId}`
    );

};
