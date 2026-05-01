const path = require("path");

/** Directory for JSON data storage. */
const DATA_DIR = path.join(__dirname, "..", "..", "data");
/** Absolute path to the todo JSON file. */
const TODO_FILE = path.join(DATA_DIR, "todos.json");

module.exports = { DATA_DIR, TODO_FILE };
