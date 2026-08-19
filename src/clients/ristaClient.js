const {
    ristaGet,
    ristaPost
} = require("../helpers/rista");

class RistaClient {

    async get(path) {
        return await ristaGet(path);
    }

    async post(path, body, uniqueId) {
        return await ristaPost(path, body, uniqueId);
    }

}

module.exports = new RistaClient();