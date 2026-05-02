const path = require("path");

const BASE_DIR = process.pkg
    ? path.dirname(process.execPath)
    : path.join(__dirname, "..", "..");
/** Directory for JSON data storage. */
const DATA_DIR = path.join(BASE_DIR, "data");
/** Absolute path to the todo JSON file. */
const TODO_FILE = path.join(DATA_DIR, "todos.json");

module.exports = { DATA_DIR, TODO_FILE };
