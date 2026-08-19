const { ristaGet } = require("../helpers/rista");

/**
 * Fetches the full enterprise catalog from Rista.
 * Uses /catalog/enterprise which is accessible without branch-level permission.
 * Returns: { categories, items, optionSets, taxTypes, taxAreas, ... }
 */
exports.getCatalog = async () => {
    return await ristaGet("/catalog/enterprise");
};
