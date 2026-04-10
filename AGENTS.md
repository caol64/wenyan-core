# AGENTS.md

## Project Context
This is a modern frontend project using **Vite** and **TypeScript**. 
This project uses the `pnpm` package manager and `package.json` for dependency management and configuration. The target Node.js version is >= 20. All commands must be run using `pnpm`.

## Agent Instructions
When working on this project, the agent **MUST** adhere to the following rules:

- **ALWAYS** use `pnpm <command>` instead of invoking `npm`, `yarn`, or other tools directly.
- **NEVER** use `npm install` or `yarn install` for installing or managing packages.
- **ALWAYS** run `pnpm install` to install/update dependencies after changes to `package.json`.
- **ALWAYS** run quality checks (`format`, `lint`, `test`) before proposing any changes.
- **MAINTAIN** existing code formatting and style, primarily enforced by `eslint` and `prettier`.

## Useful Commands (for the AI Agent)

- **Install dependencies**: `pnpm install`
- **Run development server**: `pnpm run dev`
- **Build for production**: `pnpm run build`
- **Run tests**: `pnpm run test` (uses Vitest)
- **Run UI/E2E tests**: `pnpm run test:e2e` (uses Playwright, if configured)
- **Run linting**: `pnpm run lint` (uses ESLint)
- **Format code**: `pnpm run format` (uses Prettier)
- **Add a new package**: `pnpm add <package-name>`
- **Add a dev dependency**: `pnpm add -D <package-name>`
- **Remove a package**: `pnpm remove <package-name>`

## Project Structure
- `agents/`: Contains AI agent operational logs, learnings, errors, and task records for self-improvement and context management.
- `src/assets/`: Contains theme css and highlight theme css.
- `src/core/`: Contains isomorphic code that can run in both browsers and Node.js.
- `src/node/`: Contains code dedicated to running in Node.js.
- `tests/`: Contains unit and integration tests (using `vitest`).
- `package.json`: The main configuration and dependency file.
- `vite.config.ts`: Framework and bundler configurations.
- `AGENTS.md`: This file, providing context and instructions.
