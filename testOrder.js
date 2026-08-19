/**
 * Creates a test sale in Rista and prints the payment URL.
 * Run: node testOrder.js
 * Delete after testing.
 */

require("dotenv").config();
const jwt = require("jsonwebtoken");

const apiKey    = process.env.RISTA_API_KEY;
const secretKey = process.env.RISTA_SECRET_KEY;
const BASE_URL  = process.env.RISTA_BASE_URL;
const BRANCH    = process.env.RISTA_BRANCH_CODE || "HO";

const jti = `sale_url_test_${Date.now()}`;

const token = jwt.sign(
    { iss: apiKey, iat: Math.floor(Date.now() / 1000), jti },
    secretKey
);

const payload = {
    branchCode: BRANCH,
    status: "Open",
    channel: "Takeaway",
    sourceInfo: {
        source: "Shopify",
        invoiceNumber: `URL-TEST-${Date.now()}`,
        orderTransactionId: `TXN-URL-${Date.now()}`,
        isEcomOrder: true,
        isEditable: false,
        verifyCoupons: false,
        companyName: process.env.COMPANY_NAME || "My Coffee Co"
    },
    customer: {
        name: "Test User",
        phoneNumber: "9876543210",
        email: "test@mycoffeeco.com"
    },
    delivery: {
        mode: "Pickup",
        name: "Test User",
        phoneNumber: "9876543210",
        email: "test@mycoffeeco.com"
    },
    items: [{
        skuCode: "225",
        shortName: "Espresso",
        longName: "Espresso",
        quantity: 1,
        unitPrice: 99,
        itemAmount: 99,
        itemTotalAmount: 99,
        itemNature: "Service"
    }],
    itemTotalAmount: 99,
    billAmount: 99,
    billRoundedAmount: 99,
    totalAmount: 99
    // No payments array — let Rista handle payment collection
};

fetch(`${BASE_URL}/sale`, {
    method: "POST",
    headers: {
        "x-api-key": apiKey,
        "x-api-token": token,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => {
    if (data.url) {
        console.log("\n✅ Sale created successfully!\n");
        console.log("Invoice:", data.invoiceNumber);
        console.log("Status:", data.status);
        console.log("\n🔗 Payment/Order URL:");
        console.log(data.url);
        console.log("\nOpen the URL above in your browser to see if it shows a payment option.");
    } else {
        console.log("\n❌ No URL in response. Full response:");
        console.log(JSON.stringify(data, null, 2));
    }
})
.catch(err => console.error("Error:", err.message));
