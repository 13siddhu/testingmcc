const fs = require("fs");
const path = require("path");
const {
    mapShopifyToRista,
    mapRistaToFrontend
} = require("../mappers/customerMapper");

const ristaClient = require("../clients/ristaClient");

const AVATAR_TMP_FILE = "/tmp/user_avatars.json";
const AVATAR_SEED_FILE = path.join(__dirname, "../../data/user_avatars.json");

if (!global._userAvatarsStore) {
    global._userAvatarsStore = {};
    try {
        if (fs.existsSync(AVATAR_TMP_FILE)) {
            global._userAvatarsStore = JSON.parse(fs.readFileSync(AVATAR_TMP_FILE, "utf8"));
        } else if (fs.existsSync(AVATAR_SEED_FILE)) {
            global._userAvatarsStore = JSON.parse(fs.readFileSync(AVATAR_SEED_FILE, "utf8"));
        }
    } catch (e) {
        console.warn("[customerService] Avatar store load warning:", e.message);
    }
}

function saveAvatarStore() {
    try {
        fs.writeFileSync(AVATAR_TMP_FILE, JSON.stringify(global._userAvatarsStore, null, 2), "utf8");
    } catch (e) {
        console.warn("[customerService] Failed to save avatar /tmp:", e.message);
    }
}

/**
 * Save customer real photo as Base64 string in middleware
 */
exports.saveCustomerAvatar = async (phone, avatarBase64) => {
    const cleanPhone = (phone || "").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
    if (!cleanPhone || !avatarBase64) return false;
    global._userAvatarsStore[cleanPhone] = avatarBase64;
    saveAvatarStore();
    return true;
};

/**
 * Get customer avatar Base64 string by phone
 */
exports.getCustomerAvatar = (phone) => {
    const cleanPhone = (phone || "").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);
    return global._userAvatarsStore[cleanPhone] || null;
};

/**
 * Sync a customer into Rista POS.
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
 * Fetch a customer from Rista by phone number & merge with avatar.
 * Called from GET /customers/:phone
 */
exports.getCustomer = async (phone) => {
    if (!phone) throw new Error("phone is required");

    const cleanPhone = phone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);

    let mappedCustomer = {};
    try {
        const customer = await ristaClient.get(
            `/customer?phoneNumber=${encodeURIComponent(cleanPhone)}`
        );
        mappedCustomer = mapRistaToFrontend(customer) || {};
    } catch (e) {
        console.warn("[customerService] Rista fetch error:", e.message);
    }

    const avatarBase64 = global._userAvatarsStore[cleanPhone] || null;

    return {
        success: true,
        customer: {
            ...mappedCustomer,
            avatarBase64,
        }
    };
};
