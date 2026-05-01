/** Supported todo statuses. */
const STATUSES = {
    PENDING: "pending",
    IN_PROGRESS: "in-progress",
    DONE: "done"
};

/** Lookup set for status validation. */
const ALL_STATUSES = new Set(Object.values(STATUSES));

/** Check whether a status value is valid. */
function isValidStatus(status) {
    return ALL_STATUSES.has(status);
}

module.exports = { STATUSES, ALL_STATUSES, isValidStatus };
