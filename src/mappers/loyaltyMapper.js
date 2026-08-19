exports.mapLoyalty = (customer) => {

    return {

        points: customer.loyaltyInfo?.points || 0,

        reservedPoints: customer.loyaltyInfo?.reservedPoints || 0,

        pointsEndingThisMonth:
            customer.loyaltyInfo?.pointsEndingThisMonth || 0,

        pointsEndingNextMonth:
            customer.loyaltyInfo?.pointsEndingNextMonth || 0,

        membership: customer.membership?.name || null

    };

};

/**
 * Builds the Rista payload for POST /customer/loyalty/points.
 * Schema: CustomerLoyaltyLot (from Rista swagger)
 * Required: id (Rista customer ID), points, expiryDate, remarks
 *
 * - Positive points = Credit
 * - Negative points = Debit
 * - expiryDate must be end of current month (YYYY-MM-DD), cannot be in the past
 * - id is the Rista customer ID returned when customer was created/fetched
 */
exports.mapLoyaltyPayload = (data, type) => {

    // expiryDate = last day of current month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const expiryDate = endOfMonth.toISOString().split("T")[0];

    // Debit = negative, Credit = positive
    const points = type === "Debit"
        ? -Math.abs(data.points)
        : Math.abs(data.points);

    return {
        id: data.ristaCustomerId,     // Rista customer ID (e.g. "DAWL8UCW"), not phone
        points,
        expiryDate,
        remarks: data.note
            || (type === "Credit" ? "Shopify order reward" : "Shopify order redemption")
    };

};
