const { Todo } = require("../domain/Todo");
const { generateShortId } = require("../utils/id");

const MAX_ID_ATTEMPTS = 5;

/** Application service orchestrating todo operations. */
class TodoService {
    constructor(todoRepository) {
        this.todoRepository = todoRepository;
    }

    /** Create a new todo. */
    async createTodo({ title, description, status }) {
        const todos = await this.todoRepository.getAll();
        const existingIds = new Set(todos.map((todo) => todo.id));

        // Avoid collisions with existing ids by retrying a few times.
        let id = generateShortId();
        let attempts = 0;
        while (existingIds.has(id) && attempts < MAX_ID_ATTEMPTS) {
            id = generateShortId();
            attempts += 1;
        }

        if (existingIds.has(id)) {
            throw new Error("Failed to generate a unique id");
        }

        const todo = Todo.createNew({ id, title, description, status });
        return this.todoRepository.create(todo.toJSON());
    }

    /** Update an existing todo by id. */
    async updateTodo(id, updates) {
        if (!id) {
            throw new Error("Id is required");
        }

        const existing = await this.todoRepository.getById(id);
        if (!existing) {
            return null;
        }

        const updated = Todo.fromPlain(existing).update(updates);
        return this.todoRepository.update(updated.toJSON());
    }

    /** Delete a todo by id. */
    async deleteTodo(id) {
        if (!id) {
            throw new Error("Id is required");
        }

        return this.todoRepository.delete(id);
    }

    /** Find a todo by id. */
    async findById(id) {
        if (!id) {
            throw new Error("Id is required");
        }

        return this.todoRepository.getById(id);
    }

    /** Search todos by title, description, or timestamp. */
    async searchTodos(filters = {}) {
        const todos = await this.todoRepository.getAll();

        const title = filters.title ? String(filters.title).toLowerCase() : "";
        const description = filters.description
            ? String(filters.description).toLowerCase()
            : "";
        const timestamp = filters.timestamp ? String(filters.timestamp) : "";

        if (!title && !description && !timestamp) {
            return todos;
        }

        return todos.filter((todo) => {
            let matched = false;

            if (title) {
                const value = String(todo.title || "").toLowerCase();
                matched = matched || value.includes(title);
            }

            if (description) {
                const value = String(todo.description || "").toLowerCase();
                matched = matched || value.includes(description);
            }

            if (timestamp) {
                const createdAt = String(todo.createdAt || "");
                const updatedAt = String(todo.updatedAt || "");
                matched = matched || createdAt.includes(timestamp) || updatedAt.includes(timestamp);
            }

            return matched;
        });
    }
}

module.exports = { TodoService };
