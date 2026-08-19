const jwt = require("jsonwebtoken");

/**
 * Normalizes Rista Base URL to ensure /enterprise path prefix is always included.
 */
function getRistaUrl(path) {
    let baseUrl = (process.env.RISTA_BASE_URL || "https://api.ristaapps.com/v1").replace(/\/+$/, "");
    if (!baseUrl.endsWith("/enterprise")) {
        baseUrl += "/enterprise";
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
}

/**
 * Generate JWT token for Rista API
 */
function generateToken(isWrite = false, uniqueId = null) {
    const now = Math.floor(Date.now() / 1000);

    // Rista spec payload: { iss, iat, jti (required for POST/PUT/DELETE) }
    const payload = {
        iss: process.env.RISTA_API_KEY,
        iat: now
    };

    if (isWrite) {
        // jti is required for all write requests — throw early rather than send a bad token
        if (!uniqueId) throw new Error("uniqueId is required for write requests (used as jti)");
        payload.jti = uniqueId;
    }

    return jwt.sign(payload, process.env.RISTA_SECRET_KEY);
}

/**
 * Common headers for Rista requests
 */
function ristaHeaders(isWrite = false, uniqueId = null) {
    return {
        "x-api-key": process.env.RISTA_API_KEY,
        "x-api-token": generateToken(isWrite, uniqueId),
        "Content-Type": "application/json"
    };
}

/**
 * GET helper
 */
async function ristaGet(path) {
    const url = getRistaUrl(path);
    const response = await fetch(url, {
        method: "GET",
        headers: ristaHeaders()
    });

    if (!response.ok) {
        let errorDetail = "";
        try {
            const errBody = await response.json();
            errorDetail = JSON.stringify(errBody);
        } catch {
            errorDetail = await response.text().catch(() => "");
        }
        throw new Error(`Rista GET failed: ${response.status} — ${errorDetail}`);
    }

    return response.json();
}

/**
 * POST helper
 */
async function ristaPost(path, body, uniqueId) {
    const url = getRistaUrl(path);
    const response = await fetch(url, {
        method: "POST",
        headers: ristaHeaders(true, uniqueId),
        body: JSON.stringify(body)
    });

    // 409 = already processed (idempotent request)
    if (response.status === 409) {
        return {
            alreadyProcessed: true
        };
    }

    if (!response.ok) {
        let errorDetail = "";
        try {
            const errBody = await response.json();
            errorDetail = JSON.stringify(errBody);
        } catch {
            errorDetail = await response.text().catch(() => "");
        }
        throw new Error(`Rista POST failed: ${response.status} — ${errorDetail}`);
    }

    return response.json();
}

module.exports = {
    ristaGet,
    ristaPost,
    ristaHeaders,
    generateToken
};