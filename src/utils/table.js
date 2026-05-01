/** Convert a value to a safe string cell. */
function toCell(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
}

/** Pad a string on the right to a fixed length. */
function padRight(value, width) {
    const raw = toCell(value);
    if (raw.length >= width) {
        return raw;
    }

    return raw + " ".repeat(width - raw.length);
}

/**
 * Build a simple ASCII table.
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 */
function buildTable(headers, rows) {
    const widths = headers.map((header, index) => {
        const headerWidth = toCell(header).length;
        const rowWidths = rows.map((row) => toCell(row[index]).length);
        return Math.max(headerWidth, ...rowWidths, 0);
    });

    const formatRow = (cells) =>
        cells.map((cell, index) => padRight(cell, widths[index])).join(" | ");

    const divider = widths.map((width) => "-".repeat(width)).join("-+-");

    const lines = [formatRow(headers), divider];
    rows.forEach((row) => {
        lines.push(formatRow(row));
    });

    return lines.join("\n");
}

/**
 * Format todos into a table string.
 * @param {Array<{id: string, title: string, description: string, status: string, createdAt: string, updatedAt: string}>} todos
 */
function formatTodosTable(todos) {
    const headers = ["Id", "Title", "Description", "Status", "CreatedAt", "UpdatedAt"];
    const rows = todos.map((todo) => [
        todo.id,
        todo.title,
        todo.description,
        todo.status,
        todo.createdAt,
        todo.updatedAt
    ]);

    return buildTable(headers, rows);
}

module.exports = { buildTable, formatTodosTable };
