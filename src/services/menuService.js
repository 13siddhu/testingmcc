const catalogService = require("./catalogService");
const soldoutService = require("./soldoutService");
const { buildMenu } = require("../mappers/menuMappers");

/**
 * Returns the full menu for a given branch and channel.
 * - catalog comes from /catalog/enterprise (business-wide)
 * - soldout comes from /items/soldout?branch=XX (branch-specific)
 * - channel filters which price to show per item
 *
 * @param {string} branch  - branch code e.g. "HO"
 * @param {string} channel - channel name e.g. "Dine In", "Takeaway", "Delivery"
 */
exports.getMenu = async (branch, channel) => {

    if (!branch)  throw new Error("branch is required");
    if (!channel) throw new Error("channel is required");

    const [catalog, soldOut] = await Promise.all([
        catalogService.getCatalog(),
        soldoutService.getSoldOut(branch)
    ]);

    return buildMenu(catalog, soldOut, channel);

};
