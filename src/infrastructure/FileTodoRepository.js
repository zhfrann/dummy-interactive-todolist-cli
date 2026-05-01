const fs = require("fs/promises");
const path = require("path");

/** Repository backed by a local JSON file. */
class FileTodoRepository {
    constructor(filePath) {
        this.filePath = filePath;
    }

    /** Ensure the JSON file exists before operations. */
    async ensureFile() {
        const dir = path.dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });

        try {
            await fs.access(this.filePath);
        } catch (error) {
            await fs.writeFile(this.filePath, "[]", "utf8");
        }
    }

    /** Read and parse all todos from disk. */
    async readAll() {
        await this.ensureFile();
        const raw = await fs.readFile(this.filePath, "utf8");
        if (!raw.trim()) {
            return [];
        }

        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            throw new Error("Invalid data file format");
        }

        return data;
    }

    /** Persist a full todo list to disk. */
    async writeAll(todos) {
        await this.ensureFile();
        const payload = JSON.stringify(todos, null, 2);
        await fs.writeFile(this.filePath, payload, "utf8");
    }

    /** Get all todos. */
    async getAll() {
        return this.readAll();
    }

    /** Find a todo by id. */
    async getById(id) {
        const todos = await this.readAll();
        return todos.find((todo) => todo.id === id) || null;
    }

    /** Create and store a new todo. */
    async create(todo) {
        const todos = await this.readAll();
        todos.push(todo);
        await this.writeAll(todos);
        return todo;
    }

    /** Update an existing todo. */
    async update(todo) {
        const todos = await this.readAll();
        const index = todos.findIndex((item) => item.id === todo.id);
        if (index === -1) {
            return null;
        }

        todos[index] = todo;
        await this.writeAll(todos);
        return todo;
    }

    /** Delete a todo by id. */
    async delete(id) {
        const todos = await this.readAll();
        const nextTodos = todos.filter((item) => item.id !== id);
        if (nextTodos.length === todos.length) {
            return false;
        }

        await this.writeAll(nextTodos);
        return true;
    }
}

module.exports = { FileTodoRepository };
