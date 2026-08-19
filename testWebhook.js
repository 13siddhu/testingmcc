/**
 * testWebhook.js
 *
 * Simulates a Shopify orders/create webhook with a valid HMAC signature.
 * Run with: node testWebhook.js
 *
 * Uses SHOPIFY_WEBHOOK_SECRET from .env to sign the payload,
 * exactly as Shopify does in production.
 */

require("dotenv").config();

const crypto = require("crypto");
const https  = require("https");
const http   = require("http");

// ── CONFIG ────────────────────────────────────────────────────────────────────

const MIDDLEWARE_URL = process.env.TEST_MIDDLEWARE_URL
    || "https://mycoffeeco-middleware-original.onrender.com/orders/create";

// The order payload — edit branch, SKUs, phone, amounts to match a real test
const ORDER_PAYLOAD = {
    id: Date.now(),                        // unique ID each run to avoid 409 idempotency
    name: `#TEST-${Date.now()}`,
    created_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
    financial_status: "paid",
    fulfillment_status: null,
    gateway: "razorpay",
    total_price: "149.00",
    subtotal_price: "149.00",
    total_tax: "0.00",
    total_discounts: "0.00",

    note_attributes: [
        { name: "rista_branch",  value: "DB1"      },  // change to your branch code
        { name: "rista_channel", value: "Takeaway" }
    ],

    customer: {
        id: 706405506930370000,
        first_name: "Test",
        last_name:  "User",
        email:      "test@mycoffeeco.com",
        phone:      "+919876543210"         // use a real phone that exists in Rista
    },

    // No shipping_address = Pickup order (no delivery address sent to Rista)
    // Add shipping_address block below to test a Delivery order

    line_items: [
        {
            sku:           "CAP001",        // must match a SKU in Rista catalog
            title:         "Cappuccino",
            variant_title: "Hot",
            quantity:      1,
            price:         "149.00",
            discount_allocations: []
        }
    ],

    shipping_lines:  [],
    tax_lines:       [],
    discount_applications: [],
    tags: "",
    note: "Test order from testWebhook.js"
};

// ── SIGN & SEND ───────────────────────────────────────────────────────────────

const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
if (!secret || secret === "YOUR_SHOPIFY_WEBHOOK_SECRET") {
    console.error("❌  SHOPIFY_WEBHOOK_SECRET is not set in .env");
    console.error("    Set it to your Shopify webhook signing secret and retry.");
    process.exit(1);
}

const body   = JSON.stringify(ORDER_PAYLOAD);
const hmac   = crypto.createHmac("sha256", secret).update(body).digest("base64");

const url    = new URL(MIDDLEWARE_URL);
const isHttps = url.protocol === "https:";
const lib    = isHttps ? https : http;

const options = {
    hostname: url.hostname,
    port:     url.port || (isHttps ? 443 : 80),
    path:     url.pathname,
    method:   "POST",
    headers: {
        "Content-Type":             "application/json",
        "Content-Length":           Buffer.byteLength(body),
        "X-Shopify-Topic":          "orders/create",
        "X-Shopify-Shop-Domain":    "mycoffeeco.myshopify.com",
        "X-Shopify-Hmac-Sha256":    hmac,
        "X-Shopify-Api-Version":    "2024-01"
    }
};

console.log("🚀  Sending test webhook to:", MIDDLEWARE_URL);
console.log("📦  Order ID:", ORDER_PAYLOAD.id);
console.log("📦  Order name:", ORDER_PAYLOAD.name);
console.log("🔑  HMAC:", hmac);
console.log("");

const req = lib.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
        console.log("📬  Status:", res.statusCode);
        try {
            const parsed = JSON.parse(data);
            console.log("📬  Response:", JSON.stringify(parsed, null, 2));
        } catch {
            console.log("📬  Response:", data);
        }
    });
});

req.on("error", (err) => {
    console.error("❌  Request failed:", err.message);
});

req.write(body);
req.end();
