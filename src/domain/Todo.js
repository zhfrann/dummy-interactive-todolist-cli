const crypto = require("crypto");
const { STATUSES, isValidStatus } = require("./todoStatus");
const { nowISO } = require("../utils/date");

/** Domain entity that represents a todo item. */
class Todo {
    constructor({ id, title, description, createdAt, updatedAt, status }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.status = status;
    }

    /**
     * Create a new todo instance with generated id and timestamps.
     * @param {{title: string, description?: string, status?: string}} data
     * @returns {Todo}
     */
    static createNew({ title, description, status }) {
        const cleanTitle = String(title || "").trim();
        if (!cleanTitle) {
            throw new Error("Title is required");
        }

        const cleanDescription = description ? String(description).trim() : "";
        const cleanStatus = status ? String(status).trim() : STATUSES.PENDING;
        if (!isValidStatus(cleanStatus)) {
            throw new Error("Invalid status");
        }

        const now = nowISO();
        return new Todo({
            id: crypto.randomUUID(),
            title: cleanTitle,
            description: cleanDescription,
            createdAt: now,
            updatedAt: now,
            status: cleanStatus
        });
    }

    /**
     * Rehydrate a todo from plain JSON data.
     * @param {object} plain
     * @returns {Todo}
     */
    static fromPlain(plain) {
        if (!plain || typeof plain !== "object") {
            throw new Error("Invalid todo data");
        }

        const id = String(plain.id || "").trim();
        if (!id) {
            throw new Error("Invalid todo id");
        }

        const title = String(plain.title || "").trim();
        if (!title) {
            throw new Error("Invalid todo title");
        }

        const description = plain.description ? String(plain.description) : "";
        const status = plain.status ? String(plain.status) : STATUSES.PENDING;
        if (!isValidStatus(status)) {
            throw new Error("Invalid status");
        }

        return new Todo({
            id,
            title,
            description,
            createdAt: plain.createdAt || "",
            updatedAt: plain.updatedAt || "",
            status
        });
    }

    /**
     * Return an updated copy of the todo with refreshed timestamp.
     * @param {{title?: string, description?: string, status?: string}} updates
     * @returns {Todo}
     */
    update({ title, description, status }) {
        const nextTitle =
            title !== undefined ? String(title).trim() : String(this.title).trim();
        if (!nextTitle) {
            throw new Error("Title is required");
        }

        const nextDescription =
            description !== undefined
                ? String(description).trim()
                : String(this.description || "");

        const nextStatus =
            status !== undefined ? String(status).trim() : String(this.status).trim();
        if (!isValidStatus(nextStatus)) {
            throw new Error("Invalid status");
        }

        return new Todo({
            id: this.id,
            title: nextTitle,
            description: nextDescription,
            createdAt: this.createdAt,
            updatedAt: nowISO(),
            status: nextStatus
        });
    }

    /** Convert the todo entity to a JSON-friendly object. */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            status: this.status
        };
    }
}

module.exports = { Todo };
