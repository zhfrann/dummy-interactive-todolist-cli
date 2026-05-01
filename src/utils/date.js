/** Return the current timestamp in ISO 8601 format. */
function nowISO() {
    return new Date().toISOString();
}

/**
 * Format a timestamp into a human-friendly string.
 * @param {string} value
 * @returns {string}
 */
function formatHumanDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

module.exports = { nowISO, formatHumanDate };
