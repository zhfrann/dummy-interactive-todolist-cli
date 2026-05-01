# Contributing

Thank you for considering a contribution to this project.

## Getting Started

- Ensure Node.js >= 16 is installed.
- Run the CLI with:

```
node src/presentation/cli.js help
```

## Development Notes

- This project uses a layered architecture (domain, application, infrastructure, presentation).
- Keep modules small and focused on one responsibility.
- Use CommonJS modules for consistency.

## Changes and Tests

- For CLI changes, update README usage examples when needed.
- Run a quick smoke check:

```
node src/presentation/cli.js help
```

## Pull Requests

- Create a feature branch from `main`.
- Keep commits small and descriptive.
- Describe what changed, why, and how to verify it.
