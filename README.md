# Todolist CLI

Node.js-based todolist CLI with layered architecture. Data is stored in a local JSON file.

## Features

- Create, update, delete, and find by id
- Search by title, description, or timestamp (createdAt/updatedAt)
- Show all data when search runs without filters
- JSON file storage under the data folder
- Full interactive menu with `--interactive`
- Table output format (default in interactive mode)
- Short 8-character alphanumeric id for easier tracking

## Folder Structure

```
.
├── data
│   └── todos.json
├── package.json
├── README.md
└── src
    ├── application
    │   └── TodoService.js
    ├── config
    │   └── paths.js
    ├── domain
    │   ├── Todo.js
    │   └── todoStatus.js
    ├── infrastructure
    │   └── FileTodoRepository.js
    ├── presentation
    │   └── cli.js
    └── utils
        ├── argParser.js
        ├── date.js
        ├── id.js
        ├── prompt.js
        └── table.js

    9 directories, 14 files
```

## Requirements

- Node.js >= 16

## Running

Run directly with Node:

```
node src/presentation/cli.js <command> [options]
```

Or via npm script:

```
npm run start -- <command> [options]
```

## Commands and Options

### Create

```
node src/presentation/cli.js create --title "Study" --desc "Module 10" --status pending
```

### Update

```
node src/presentation/cli.js update --id <id> --title "Study PPL" --status in-progress
```

### Delete

```
node src/presentation/cli.js delete --id <id>
```

### Find by id

```
node src/presentation/cli.js find --id <id>
```

### Search

```
node src/presentation/cli.js search --title "study"
node src/presentation/cli.js search --desc "lab"
node src/presentation/cli.js search --timestamp "2024-05-02"
```

### Interactive Menu

```
node src/presentation/cli.js --interactive
```

Choose a menu option and keep interacting until you select Exit.

### Output Format

```
node src/presentation/cli.js search --format table
node src/presentation/cli.js search --format json
```

Notes:

- `search` without filters will show all data.
- `--id` can also be provided as the first argument after the command.
- Valid status values: `pending`, `in-progress`, `done`.
- `--format` accepts `json` or `table`. Interactive mode defaults to table output.
- New todos use short 8-character alphanumeric ids (for example: `k4m2x9p1`). Existing ids remain valid.

## Data

The data file lives at `data/todos.json`. If the file does not exist, the app will create it automatically.
