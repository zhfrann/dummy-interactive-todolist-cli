const { Todo } = require("../domain/Todo");

/** Application service orchestrating todo operations. */
class TodoService {
    constructor(todoRepository) {
        this.todoRepository = todoRepository;
    }

    /** Create a new todo. */
    async createTodo({ title, description, status }) {
        const todo = Todo.createNew({ title, description, status });
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
