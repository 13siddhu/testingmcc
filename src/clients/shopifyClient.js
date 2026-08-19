/**
 * shopifyClient.js
 * Wrapper for Shopify Admin REST API calls.
 * Uses SHOPIFY_STORE and SHOPIFY_ACCESS_TOKEN from .env
 */

const SHOPIFY_STORE  = process.env.SHOPIFY_STORE;
const ACCESS_TOKEN   = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION    = "2026-07";

function shopifyUrl(path) {
    return `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}${path}`;
}

function shopifyHeaders() {
    return {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
        "Content-Type": "application/json"
    };
}

async function shopifyGet(path) {
    const res = await fetch(shopifyUrl(path), {
        method: "GET",
        headers: shopifyHeaders()
    });
    if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`Shopify GET ${path} failed: ${res.status} — ${err}`);
    }
    return res.json();
}

async function shopifyPost(path, body) {
    const res = await fetch(shopifyUrl(path), {
        method: "POST",
        headers: shopifyHeaders(),
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`Shopify POST ${path} failed: ${res.status} — ${err}`);
    }
    return res.json();
}

async function shopifyPut(path, body) {
    const res = await fetch(shopifyUrl(path), {
        method: "PUT",
        headers: shopifyHeaders(),
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`Shopify PUT ${path} failed: ${res.status} — ${err}`);
    }
    return res.json();
}

module.exports = { shopifyGet, shopifyPost, shopifyPut };
