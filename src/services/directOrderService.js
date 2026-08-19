/**
 * directOrderService.js
 *
 * Creates an order directly in Rista — bypassing Shopify entirely.
 * Called after OTP verification and payment.
 *
 * Flow:
 * 1. Look up or create customer in Rista
 * 2. Create the sale in Rista with payment reference
 * 3. Return the Rista order details
 */

const ristaClient = require("../clients/ristaClient");

/**
 * Place a direct order in Rista.
 *
 * @param {Object} params
 * @param {string} params.phone          - 10-digit phone number
 * @param {string} params.name           - Customer name
 * @param {string} params.email          - Customer email (optional)
 * @param {Array}  params.items          - Array of { skuCode, name, variant, price, qty }
 * @param {string} params.branch         - Rista branch code e.g. "HO"
 * @param {string} params.channel        - e.g. "Takeaway", "Delivery"
 * @param {string} params.paymentRef     - Payment reference (Razorpay order ID or "MOCK")
 * @param {string} params.paymentMode    - e.g. "Online", "UPI", "Card"
 * @param {number} params.totalAmount    - Total amount paid
 */
exports.placeOrder = async (params) => {
    const {
        phone,
        name,
        email = "",
        items,
        branch,
        channel,
        paymentRef,
        paymentMode = "Online",
        totalAmount
    } = params;

    if (!phone)         throw new Error("phone is required");
    if (!items?.length) throw new Error("items are required");
    if (!branch)        throw new Error("branch is required");
    if (!totalAmount)   throw new Error("totalAmount is required");

    // Build the Rista sale payload
    const invoiceNumber = `WEB-${Date.now()}`;
    const jti           = `sale_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const salePayload = {
        branchCode: branch,
        status:     "Open",
        channel:    channel || "Takeaway",

        sourceInfo: {
            source:             "Shopify",
            companyName:        process.env.COMPANY_NAME || "My Coffee Co",
            invoiceNumber,
            orderTransactionId: paymentRef || invoiceNumber,
            isEcomOrder:        true,
            isEditable:         false,
            verifyCoupons:      false
        },

        customer: {
            name:        name  || "Guest",
            phoneNumber: phone,
            email:       email || ""
        },

        delivery: {
            mode:        channel === "Delivery" ? "Delivery" : "Pickup",
            name:        name  || "Guest",
            phoneNumber: phone,
            email:       email || ""
        },

        items: items.map(item => ({
            skuCode:         item.skuCode,
            shortName:       item.name,
            longName:        item.name,
            variants:        item.variant || "",
            quantity:        Number(item.qty),
            unitPrice:       Number(item.price),
            itemAmount:      Number(item.price) * Number(item.qty),
            itemTotalAmount: Number(item.price) * Number(item.qty),
            itemNature:      "Service"
        })),

        itemTotalAmount: Number(totalAmount),
        billAmount:      Number(totalAmount),
        billRoundedAmount: Number(totalAmount),
        totalAmount:     Number(totalAmount),

        payments: [{
            mode:        paymentMode,
            amount:      Number(totalAmount),
            reference:   paymentRef || invoiceNumber,
            postedDate:  new Date().toISOString()
        }]
    };

    const result = await ristaClient.post("/sale", salePayload, jti);

    return {
        success:       true,
        invoiceNumber: result.invoiceNumber || invoiceNumber,
        orderNumber:   result.label         || result.invoiceNumber,
        status:        result.status,
        orderUrl:      result.url           || null,
        rista:         result
    };
};
