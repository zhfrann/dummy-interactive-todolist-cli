const crypto = require("crypto");

const DEFAULT_ID_LENGTH = 8;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a short alphanumeric id.
 * @param {number} [length]
 * @returns {string}
 */
function generateShortId(length = DEFAULT_ID_LENGTH) {
    const size = Number(length);
    if (!Number.isInteger(size) || size <= 0) {
        throw new Error("Invalid id length");
    }

    const bytes = crypto.randomBytes(size);
    let id = "";
    for (let i = 0; i < size; i += 1) {
        id += ALPHABET[bytes[i] % ALPHABET.length];
    }

    return id;
}

module.exports = { generateShortId, DEFAULT_ID_LENGTH, ALPHABET };
