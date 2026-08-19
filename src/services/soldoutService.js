const { ristaGet } = require("../helpers/rista");

exports.getSoldOut = async (branch) => {
    return await ristaGet(
        `/items/soldout?branch=${branch}`
    );
};