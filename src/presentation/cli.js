#!/usr/bin/env node
const { FileTodoRepository } = require("../infrastructure/FileTodoRepository");
const { TodoService } = require("../application/TodoService");
const { parseArgs } = require("../utils/argParser");
const { TODO_FILE } = require("../config/paths");

const USAGE = `
Todolist CLI

Usage:
  node src/presentation/cli.js <command> [options]

Commands:
  create --title "..." [--desc "..."] [--status pending|in-progress|done]
  update --id <id> [--title "..."] [--desc "..."] [--status pending|in-progress|done]
  delete --id <id>
  find --id <id>
  search [--title "..."] [--desc "..."] [--timestamp "..."]
  help

Notes:
    - --id can also be provided as the first argument after the command.
    - search without filters shows all data.

Examples:
    node src/presentation/cli.js create --title "Study" --desc "Module 10"
  node src/presentation/cli.js update --id <id> --status done
  node src/presentation/cli.js search --timestamp "2024-05-02"
`;

const repository = new FileTodoRepository(TODO_FILE);
const service = new TodoService(repository);

/** Print a single todo as formatted JSON. */
function printTodo(todo) {
    console.log(JSON.stringify(todo, null, 2));
}

/** Print a list of todos as formatted JSON. */
function printTodos(todos) {
    console.log(JSON.stringify(todos, null, 2));
}

/** Resolve the todo id from options or positionals. */
function getId(options, positionals) {
    return options.id || positionals[0];
}

/** Normalize description from supported flags. */
function getDescription(options) {
    if (options.desc !== undefined) {
        return options.desc;
    }

    if (options.description !== undefined) {
        return options.description;
    }

    return undefined;
}

/** Main CLI entry point. */
async function main() {
    const { command, options, positionals } = parseArgs(process.argv.slice(2));

    if (!command || command === "help" || options.help) {
        console.log(USAGE.trim());
        return;
    }

    switch (command) {
        case "create": {
            const title = options.title;
            if (!title) {
                throw new Error("Title is required");
            }

            const description = getDescription(options);
            const status = options.status;
            const todo = await service.createTodo({ title, description, status });
            printTodo(todo);
            return;
        }

        case "update": {
            const id = getId(options, positionals);
            if (!id) {
                throw new Error("Id is required");
            }

            const updates = {
                title: options.title,
                description: getDescription(options),
                status: options.status
            };

            if (
                updates.title === undefined &&
                updates.description === undefined &&
                updates.status === undefined
            ) {
                throw new Error("At least one field must be provided for update");
            }

            const updated = await service.updateTodo(id, updates);
            if (!updated) {
                console.log("Todo not found");
                return;
            }

            printTodo(updated);
            return;
        }

        case "delete": {
            const id = getId(options, positionals);
            if (!id) {
                throw new Error("Id is required");
            }

            const deleted = await service.deleteTodo(id);
            console.log(deleted ? "Todo deleted" : "Todo not found");
            return;
        }

        case "find": {
            const id = getId(options, positionals);
            if (!id) {
                throw new Error("Id is required");
            }

            const todo = await service.findById(id);
            if (!todo) {
                console.log("Todo not found");
                return;
            }

            printTodo(todo);
            return;
        }

        case "search":
        case "list": {
            const description = getDescription(options);
            const todos = await service.searchTodos({
                title: options.title,
                description,
                timestamp: options.timestamp
            });

            printTodos(todos);
            return;
        }

        default:
            console.log("Unknown command");
            console.log(USAGE.trim());
    }
}

main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
