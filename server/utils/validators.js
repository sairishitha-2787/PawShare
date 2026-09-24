// Mongoose `match` validator for link fields (photos, documents, websites).
const HTTP_URL = [/^https?:\/\/\S+$/i, "must be an http(s) URL"];

module.exports = { HTTP_URL };
