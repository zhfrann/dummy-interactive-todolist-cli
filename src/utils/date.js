/** Return the current timestamp in ISO 8601 format. */
function nowISO() {
    return new Date().toISOString();
}

module.exports = { nowISO };
