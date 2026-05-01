#!/usr/bin/env node
const { FileTodoRepository } = require("../infrastructure/FileTodoRepository");
const { TodoService } = require("../application/TodoService");
const { parseArgs } = require("../utils/argParser");
const { createPrompter } = require("../utils/prompt");
const { formatTodosTable } = require("../utils/table");
const { formatHumanDate } = require("../utils/date");
const { STATUSES, ALL_STATUSES } = require("../domain/todoStatus");
const { TODO_FILE } = require("../config/paths");

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const COLORS = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m"
};
const PROMPT_PREFIX = ">";

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

function colorize(text, color) {
    if (!USE_COLOR) {
        return text;
    }

    return `${color}${text}${COLORS.reset}`;
}

function separator() {
    return colorize("-".repeat(52), COLORS.dim);
}

function logSuccess(message) {
    console.log(colorize(message, COLORS.green));
}

function logWarning(message) {
    console.log(colorize(message, COLORS.yellow));
}

function logInfo(message) {
    console.log(colorize(message, COLORS.cyan));
}

function logError(message) {
    console.error(colorize(message, COLORS.red));
}

/** Print a single todo as JSON or table. */
function printTodo(todo, format) {
    const displayTodo = formatTodoForDisplay(todo);
    if (format === "table") {
        console.log(formatTodosTable([displayTodo]));
        return;
    }

    console.log(JSON.stringify(displayTodo, null, 2));
}

/** Print a list of todos as JSON or table. */
function printTodos(todos, format) {
    const displayTodos = formatTodosForDisplay(todos);
    if (format === "table") {
        if (!displayTodos.length) {
            logWarning("No todos found.");
            return;
        }

        console.log(formatTodosTable(displayTodos));
        return;
    }

    console.log(JSON.stringify(displayTodos, null, 2));
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

/** Format a todo for display output. */
function formatTodoForDisplay(todo) {
    if (!todo) {
        return todo;
    }

    return {
        ...todo,
        createdAt: formatHumanDate(todo.createdAt),
        updatedAt: formatHumanDate(todo.updatedAt)
    };
}

/** Format a list of todos for display output. */
function formatTodosForDisplay(todos) {
    return todos.map((todo) => formatTodoForDisplay(todo));
}

/** Print the interactive menu choices. */
function printMenu(summary) {
    if (summary) {
        const summaryLine = [
            `Total: ${colorize(String(summary.total), COLORS.bold)}`,
            `Pending: ${colorize(String(summary.pending), COLORS.yellow)}`,
            `In-progress: ${colorize(String(summary.inProgress), COLORS.cyan)}`,
            `Done: ${colorize(String(summary.done), COLORS.green)}`
        ].join(" | ");
        console.log(summaryLine);
    }

    console.log(separator());
    console.log(
        [
            colorize("Interactive Menu", COLORS.bold),
            "  1) [+] Create todo (create, c)",
            "  2) [~] Update todo (update, u)",
            "  3) [x] Delete todo (delete, d)",
            "  4) [?] Find todo by id (find, f)",
            "  5) [*] Search or list todos (search, s)",
            "  6) [q] Exit (exit, q)",
            colorize("Tip: type a number or keyword.", COLORS.dim)
        ].join("\n")
    );
    console.log(separator());
}

/** Prompt for a valid menu choice. */
async function promptMenuChoice(prompter) {
    while (true) {
        const raw = await prompter.ask(
            `${colorize(PROMPT_PREFIX, COLORS.cyan)} Select menu (1-6 or keyword): `
        );
        const value = String(raw || "").trim().toLowerCase();
        if (!value) {
            logWarning("Please select a menu option.");
            continue;
        }

        if (value === "6" || value === "exit" || value === "quit" || value === "q") {
            return "exit";
        }

        if (value === "1" || value === "create" || value === "c") {
            return "create";
        }

        if (value === "2" || value === "update" || value === "u") {
            return "update";
        }

        if (value === "3" || value === "delete" || value === "d") {
            return "delete";
        }

        if (value === "4" || value === "find" || value === "f") {
            return "find";
        }

        if (value === "5" || value === "search" || value === "s" || value === "list") {
            return "search";
        }

        logWarning("Invalid selection. Choose 1-6 or a keyword.");
    }
}

/** Prompt until a required value is provided. */
async function promptRequired(prompter, label) {
    while (true) {
        const raw = await prompter.ask(
            `${colorize(PROMPT_PREFIX, COLORS.cyan)} ${label}: `
        );
        const value = String(raw || "").trim();
        if (value) {
            return value;
        }

        logWarning(`${label} is required.`);
    }
}

/** Prompt for an optional value. */
async function promptOptional(prompter, label) {
    const raw = await prompter.ask(
        `${colorize(PROMPT_PREFIX, COLORS.cyan)} ${label}: `
    );
    return String(raw || "").trim();
}

/** Prompt for an optional update field and keep current on empty input. */
async function promptUpdateField(prompter, label, currentValue) {
    const display = currentValue ? ` [${currentValue}]` : " [empty]";
    const raw = await prompter.ask(
        `${colorize(PROMPT_PREFIX, COLORS.cyan)} ${label}${display} (leave blank to keep): `
    );
    return String(raw || "").trim();
}

/** Prompt for status with a default value. */
async function promptStatusWithDefault(prompter, defaultStatus) {
    const choices = Object.values(STATUSES).join(", ");

    while (true) {
        const raw = await prompter.ask(
            `${colorize(PROMPT_PREFIX, COLORS.cyan)} Status [${defaultStatus}] (${choices}): `
        );
        const value = String(raw || "").trim();
        const nextStatus = value || defaultStatus;
        if (ALL_STATUSES.has(nextStatus)) {
            return nextStatus;
        }

        logWarning(`Invalid status. Use: ${choices}`);
    }
}

/** Prompt for status and keep current on empty input. */
async function promptStatusOptional(prompter, currentStatus) {
    const choices = Object.values(STATUSES).join(", ");

    while (true) {
        const raw = await prompter.ask(
            `${colorize(PROMPT_PREFIX, COLORS.cyan)} Status [${currentStatus}] (${choices}, leave blank to keep): `
        );
        const value = String(raw || "").trim();
        if (!value) {
            return undefined;
        }

        if (ALL_STATUSES.has(value)) {
            return value;
        }

        logWarning(`Invalid status. Use: ${choices}`);
    }
}

/** Pause so the user can read the output. */
async function pause(prompter) {
    await prompter.ask(
        `${colorize(PROMPT_PREFIX, COLORS.cyan)} Press Enter to return to the menu...`
    );
}

function printSection(title) {
    console.log("");
    console.log(colorize(title, COLORS.bold));
    console.log(separator());
}

/** Build a summary for the interactive menu header. */
async function getTodoSummary() {
    const todos = await service.searchTodos();
    const summary = {
        total: todos.length,
        pending: 0,
        inProgress: 0,
        done: 0
    };

    todos.forEach((todo) => {
        if (todo.status === STATUSES.PENDING) {
            summary.pending += 1;
        } else if (todo.status === STATUSES.IN_PROGRESS) {
            summary.inProgress += 1;
        } else if (todo.status === STATUSES.DONE) {
            summary.done += 1;
        }
    });

    return summary;
}

/** Run the full interactive menu loop. */
async function runInteractiveMenu(prompter, outputFormat) {
    while (true) {
        const summary = await getTodoSummary();
        printMenu(summary);
        const choice = await promptMenuChoice(prompter);

        if (choice === "exit") {
            logInfo("Goodbye.");
            return;
        }

        try {
            switch (choice) {
                case "create": {
                    printSection("Create Todo");
                    const title = await promptRequired(prompter, "Title");
                    const description = await promptOptional(prompter, "Description (optional)");
                    const status = await promptStatusWithDefault(prompter, STATUSES.PENDING);
                    const todo = await service.createTodo({ title, description, status });
                    logSuccess("Todo created.");
                    printTodo(todo, outputFormat);
                    break;
                }

                case "update": {
                    printSection("Update Todo");
                    const id = await promptRequired(prompter, "Id");
                    const existing = await service.findById(id);
                    if (!existing) {
                        logWarning("Todo not found");
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
                        logWarning("No updates provided.");
                        break;
                    }

                    const updated = await service.updateTodo(id, updates);
                    if (!updated) {
                        logWarning("Todo not found");
                        break;
                    }

                    logSuccess("Todo updated.");
                    printTodo(updated, outputFormat);
                    break;
                }

                case "delete": {
                    printSection("Delete Todo");
                    const id = await promptRequired(prompter, "Id");
                    const existing = await service.findById(id);
                    if (!existing) {
                        logWarning("Todo not found");
                        break;
                    }

                    const confirmed = await prompter.confirm(
                        `Delete todo "${existing.title}" (${existing.id})?`,
                        false
                    );
                    if (!confirmed) {
                        logInfo("Delete canceled.");
                        break;
                    }

                    const deleted = await service.deleteTodo(id);
                    if (deleted) {
                        logSuccess("Todo deleted.");
                    } else {
                        logWarning("Todo not found");
                    }
                    break;
                }

                case "find": {
                    printSection("Find Todo");
                    const id = await promptRequired(prompter, "Id");
                    const todo = await service.findById(id);
                    if (!todo) {
                        logWarning("Todo not found");
                        break;
                    }

                    printTodo(todo, outputFormat);
                    break;
                }

                case "search": {
                    printSection("Search Todos");
                    logInfo("Leave filters empty to list all todos.");
                    const title = await promptOptional(prompter, "Title filter (optional)");
                    const description = await promptOptional(
                        prompter,
                        "Description filter (optional)"
                    );
                    const timestamp = await promptOptional(
                        prompter,
                        "Timestamp filter (optional, ISO or display)"
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
            logError(`Error: ${error.message}`);
        }

        await pause(prompter);
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
    logError(`Error: ${error.message}`);
    process.exit(1);
});
