#!/usr/bin/env node
const { FileTodoRepository } = require("../infrastructure/FileTodoRepository");
const { TodoService } = require("../application/TodoService");
const { parseArgs } = require("../utils/argParser");
const { createPrompter } = require("../utils/prompt");
const { formatTodosTable } = require("../utils/table");
const { STATUSES, ALL_STATUSES } = require("../domain/todoStatus");
const { TODO_FILE } = require("../config/paths");

const USAGE = `
Todolist CLI

Usage:
  node src/presentation/cli.js <command> [options]
    node src/presentation/cli.js --interactive

Commands:
  create --title "..." [--desc "..."] [--status pending|in-progress|done]
  update --id <id> [--title "..."] [--desc "..."] [--status pending|in-progress|done]
  delete --id <id>
  find --id <id>
  search [--title "..."] [--desc "..."] [--timestamp "..."]
  help

Options:
    --interactive         Run the interactive menu.
    --format <json|table> Output format. Defaults to table in interactive mode.

Notes:
    - --id can also be provided as the first argument after the command.
    - search without filters shows all data.

Examples:
    node src/presentation/cli.js create --title "Study" --desc "Module 10"
    node src/presentation/cli.js --interactive
    node src/presentation/cli.js update --id <id> --status done
    node src/presentation/cli.js search --timestamp "2024-05-02"
`;

const repository = new FileTodoRepository(TODO_FILE);
const service = new TodoService(repository);

/** Print a single todo as JSON or table. */
function printTodo(todo, format) {
    if (format === "table") {
        console.log(formatTodosTable([todo]));
        return;
    }

    console.log(JSON.stringify(todo, null, 2));
}

/** Print a list of todos as JSON or table. */
function printTodos(todos, format) {
    if (format === "table") {
        if (!todos.length) {
            console.log("No todos found.");
            return;
        }

        console.log(formatTodosTable(todos));
        return;
    }

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

/** Resolve output format based on options and mode. */
function resolveOutputFormat(options, interactive) {
    if (options.format) {
        return String(options.format).trim().toLowerCase();
    }

    return interactive ? "table" : "json";
}

/** Validate supported output formats. */
function assertOutputFormat(format) {
    if (format !== "json" && format !== "table") {
        throw new Error("Invalid format. Use json or table.");
    }
}

/** Print the interactive menu choices. */
function printMenu() {
    console.log(
        [
            "Interactive Menu",
            "1) Create todo",
            "2) Update todo",
            "3) Delete todo",
            "4) Find todo by id",
            "5) Search todos",
            "6) Exit"
        ].join("\n")
    );
}

/** Prompt for a valid menu choice. */
async function promptMenuChoice(prompter) {
    while (true) {
        const raw = await prompter.ask("Select menu (1-6): ");
        const value = String(raw || "").trim().toLowerCase();
        if (value === "6" || value === "exit" || value === "quit" || value === "q") {
            return "exit";
        }

        const number = Number(value);
        if (Number.isInteger(number) && number >= 1 && number <= 5) {
            return number;
        }

        console.log("Invalid selection. Choose 1-6.");
    }
}

/** Prompt until a required value is provided. */
async function promptRequired(prompter, label) {
    while (true) {
        const raw = await prompter.ask(`${label}: `);
        const value = String(raw || "").trim();
        if (value) {
            return value;
        }

        console.log(`${label} is required.`);
    }
}

/** Prompt for an optional value. */
async function promptOptional(prompter, label) {
    const raw = await prompter.ask(`${label}: `);
    return String(raw || "").trim();
}

/** Prompt for an optional update field and keep current on empty input. */
async function promptUpdateField(prompter, label, currentValue) {
    const display = currentValue ? ` [${currentValue}]` : " [empty]";
    const raw = await prompter.ask(`${label}${display} (leave blank to keep): `);
    return String(raw || "").trim();
}

/** Prompt for status with a default value. */
async function promptStatusWithDefault(prompter, defaultStatus) {
    const choices = Object.values(STATUSES).join(", ");

    while (true) {
        const raw = await prompter.ask(`Status [${defaultStatus}] (${choices}): `);
        const value = String(raw || "").trim();
        const nextStatus = value || defaultStatus;
        if (ALL_STATUSES.has(nextStatus)) {
            return nextStatus;
        }

        console.log(`Invalid status. Use: ${choices}`);
    }
}

/** Prompt for status and keep current on empty input. */
async function promptStatusOptional(prompter, currentStatus) {
    const choices = Object.values(STATUSES).join(", ");

    while (true) {
        const raw = await prompter.ask(
            `Status [${currentStatus}] (${choices}, leave blank to keep): `
        );
        const value = String(raw || "").trim();
        if (!value) {
            return undefined;
        }

        if (ALL_STATUSES.has(value)) {
            return value;
        }

        console.log(`Invalid status. Use: ${choices}`);
    }
}

/** Run the full interactive menu loop. */
async function runInteractiveMenu(prompter, outputFormat) {
    while (true) {
        printMenu();
        const choice = await promptMenuChoice(prompter);

        if (choice === "exit") {
            console.log("Goodbye.");
            return;
        }

        try {
            switch (choice) {
                case 1: {
                    const title = await promptRequired(prompter, "Title");
                    const description = await promptOptional(prompter, "Description (optional)");
                    const status = await promptStatusWithDefault(prompter, STATUSES.PENDING);
                    const todo = await service.createTodo({ title, description, status });
                    printTodo(todo, outputFormat);
                    break;
                }

                case 2: {
                    const id = await promptRequired(prompter, "Id");
                    const existing = await service.findById(id);
                    if (!existing) {
                        console.log("Todo not found");
                        break;
                    }

                    const titleInput = await promptUpdateField(
                        prompter,
                        "Title",
                        existing.title
                    );
                    const descriptionInput = await promptUpdateField(
                        prompter,
                        "Description",
                        existing.description || ""
                    );
                    const statusInput = await promptStatusOptional(
                        prompter,
                        existing.status
                    );

                    const updates = {
                        title: titleInput || undefined,
                        description: descriptionInput || undefined,
                        status: statusInput
                    };

                    if (
                        updates.title === undefined &&
                        updates.description === undefined &&
                        updates.status === undefined
                    ) {
                        console.log("No updates provided.");
                        break;
                    }

                    const updated = await service.updateTodo(id, updates);
                    if (!updated) {
                        console.log("Todo not found");
                        break;
                    }

                    printTodo(updated, outputFormat);
                    break;
                }

                case 3: {
                    const id = await promptRequired(prompter, "Id");
                    const existing = await service.findById(id);
                    if (!existing) {
                        console.log("Todo not found");
                        break;
                    }

                    const confirmed = await prompter.confirm(
                        `Delete todo "${existing.title}" (${existing.id})?`,
                        false
                    );
                    if (!confirmed) {
                        console.log("Delete canceled.");
                        break;
                    }

                    const deleted = await service.deleteTodo(id);
                    console.log(deleted ? "Todo deleted" : "Todo not found");
                    break;
                }

                case 4: {
                    const id = await promptRequired(prompter, "Id");
                    const todo = await service.findById(id);
                    if (!todo) {
                        console.log("Todo not found");
                        break;
                    }

                    printTodo(todo, outputFormat);
                    break;
                }

                case 5: {
                    const title = await promptOptional(prompter, "Title filter (optional)");
                    const description = await promptOptional(
                        prompter,
                        "Description filter (optional)"
                    );
                    const timestamp = await promptOptional(
                        prompter,
                        "Timestamp filter (optional)"
                    );

                    const todos = await service.searchTodos({
                        title,
                        description,
                        timestamp
                    });
                    printTodos(todos, outputFormat);
                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }
}

/** Main CLI entry point. */
async function main() {
    const { command, options, positionals } = parseArgs(process.argv.slice(2));

    const interactive = Boolean(options.interactive);

    if ((!command || command === "help" || options.help) && !interactive) {
        console.log(USAGE.trim());
        return;
    }

    const outputFormat = resolveOutputFormat(options, interactive);
    assertOutputFormat(outputFormat);

    const prompter = interactive ? createPrompter() : null;

    try {
        if (interactive) {
            await runInteractiveMenu(prompter, outputFormat);
            return;
        }

        switch (command) {
            case "create": {
                let title = options.title;
                let description = getDescription(options);
                let status = options.status;

                if (interactive) {
                    if (!title) {
                        title = await promptRequired(prompter, "Title");
                    }

                    if (description === undefined) {
                        description = await promptOptional(prompter, "Description (optional)");
                    }

                    if (!status) {
                        status = await promptStatusWithDefault(prompter, STATUSES.PENDING);
                    }
                } else if (!title) {
                    throw new Error("Title is required");
                }

                const todo = await service.createTodo({ title, description, status });
                printTodo(todo, outputFormat);
                return;
            }

            case "update": {
                let id = getId(options, positionals);
                if (interactive && !id) {
                    id = await promptRequired(prompter, "Id");
                }

                if (!id) {
                    throw new Error("Id is required");
                }

                const existing = await service.findById(id);
                if (!existing) {
                    console.log("Todo not found");
                    return;
                }

                let title = options.title;
                let description = getDescription(options);
                let status = options.status;

                if (interactive) {
                    if (title === undefined) {
                        const input = await promptUpdateField(
                            prompter,
                            "Title",
                            existing.title
                        );
                        if (input) {
                            title = input;
                        }
                    }

                    if (description === undefined) {
                        const input = await promptUpdateField(
                            prompter,
                            "Description",
                            existing.description || ""
                        );
                        if (input) {
                            description = input;
                        }
                    }

                    if (status === undefined) {
                        status = await promptStatusOptional(prompter, existing.status);
                    }
                }

                const updates = {
                    title,
                    description,
                    status
                };

                if (
                    updates.title === undefined &&
                    updates.description === undefined &&
                    updates.status === undefined
                ) {
                    if (interactive) {
                        console.log("No updates provided.");
                        return;
                    }

                    throw new Error("At least one field must be provided for update");
                }

                const updated = await service.updateTodo(id, updates);
                if (!updated) {
                    console.log("Todo not found");
                    return;
                }

                printTodo(updated, outputFormat);
                return;
            }

            case "delete": {
                let id = getId(options, positionals);
                if (interactive && !id) {
                    id = await promptRequired(prompter, "Id");
                }

                if (!id) {
                    throw new Error("Id is required");
                }

                if (interactive) {
                    const existing = await service.findById(id);
                    if (!existing) {
                        console.log("Todo not found");
                        return;
                    }

                    const confirmed = await prompter.confirm(
                        `Delete todo "${existing.title}" (${existing.id})?`,
                        false
                    );
                    if (!confirmed) {
                        console.log("Delete canceled.");
                        return;
                    }
                }

                const deleted = await service.deleteTodo(id);
                console.log(deleted ? "Todo deleted" : "Todo not found");
                return;
            }

            case "find": {
                let id = getId(options, positionals);
                if (interactive && !id) {
                    id = await promptRequired(prompter, "Id");
                }

                if (!id) {
                    throw new Error("Id is required");
                }

                const todo = await service.findById(id);
                if (!todo) {
                    console.log("Todo not found");
                    return;
                }

                printTodo(todo, outputFormat);
                return;
            }

            case "search":
            case "list": {
                let title = options.title;
                let description = getDescription(options);
                let timestamp = options.timestamp;

                if (interactive) {
                    if (title === undefined) {
                        title = await promptOptional(prompter, "Title filter (optional)");
                    }

                    if (description === undefined) {
                        description = await promptOptional(
                            prompter,
                            "Description filter (optional)"
                        );
                    }

                    if (timestamp === undefined) {
                        timestamp = await promptOptional(
                            prompter,
                            "Timestamp filter (optional)"
                        );
                    }
                }

                const todos = await service.searchTodos({
                    title,
                    description,
                    timestamp
                });

                printTodos(todos, outputFormat);
                return;
            }

            default:
                console.log("Unknown command");
                console.log(USAGE.trim());
        }
    } finally {
        if (prompter) {
            prompter.close();
        }
    }
}

main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
