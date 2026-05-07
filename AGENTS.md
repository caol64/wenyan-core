# Agent Instructions

## Build, test, and lint commands

- Install dependencies: `pnpm install`
- Type-check only: `pnpm run typecheck`
- Build library bundles and declarations: `pnpm run build`
- Run the full test suite: `pnpm run test`
- Run a single test file: `pnpm exec vitest run tests/node/render.test.ts`
- Run a single named test: `pnpm exec vitest run tests/core/index.test.ts -t "should create an instance with default options"`
- Run lint with autofix: `pnpm run lint`
- Run lint without modifying files: `pnpm exec eslint .`

## High-level architecture

This package is a multi-entry library built with Vite SSR mode plus `tsc` declaration output. The published entry points are:

- `@wenyan-md/core` -> isomorphic Markdown-to-HTML rendering and style application from `src/core/index.ts`
- `@wenyan-md/core/publish` -> reusable publish orchestration (`WechatPublisher`) over pluggable HTTP and storage adapters
- `@wenyan-md/core/wrapper` -> Node-oriented convenience APIs that combine rendering and publishing flows
- `@wenyan-md/core/wechat` and `@wenyan-md/core/http` -> lower-level WeChat client and HTTP abstractions

The rendering pipeline is split in two layers:

1. `src/core/` is the engine shared across browser and Node usage. `createWenyanCore()` parses front matter, renders Markdown with `marked`, optionally converts MathJax, then applies theme CSS, highlight CSS, footnotes, macOS code-block styling, pseudo-element handling, and WeChat-specific post-processing.
2. `src/node/` adapts that engine to pure Node.js. `render.ts` uses JSDOM to create the DOM wrapper that core expects, `configStore.ts` loads user-saved theme CSS from the Wenyan config directory, and `publish.ts` / `clientPublish.ts` handle local-file resolution, image upload, cover selection, and either direct WeChat draft publishing or remote server publishing.

WeChat publishing is intentionally layered:

- `src/wechat.ts` is the raw API client factory over a provided `HttpAdapter`
- `src/publish.ts` adds token caching and upload caching via `WechatPublisher`
- `src/node/publish.ts` wires in Node adapters, resolves credentials, uploads local or remote images, rewrites article HTML, and finally publishes the draft

## Key conventions

- Use `pnpm` for every package-management and validation command. This repository targets Node.js 20+.
- The styled article root is expected to be `#wenyan`. Core CSS mutation defaults, theme application, and Node rendering all assume a `<section id="wenyan">...</section>` wrapper.
- Front matter is part of the public data flow, not just parsing sugar. `title`, `cover`, `description`, `author`, and `source_url` are extracted first, then carried through `StyledContent` and the publish wrappers.
- `createWenyanCore()` registers built-in article themes, highlight themes, and mac-style assets during initialization. Tests that need custom fixtures often register themes explicitly before creating or using the core instance.
- Theme resolution is layered: explicit CSS content wins, then Node-side custom theme files/config entries, then built-in theme registries. Missing themes and many other user-facing failures throw Chinese error messages.
- `src/node/render.ts` supports both built-in themes and user-saved custom themes from `configStore`; passing `customTheme` as a file path loads CSS from disk and takes precedence.
- Direct publish and remote publish are different flows. `src/node/publish.ts` talks to WeChat directly, while `src/node/clientPublish.ts` first uploads local assets to a Wenyan server, rewrites them to `asset://fileId`, then asks the server to publish.
- Credential lookup in the direct WeChat publish path is ordered: explicit `appId`/`appSecret`, then matching `WECHAT_APP_ID` / `WECHAT_APP_SECRET`, then persisted credentials from the Node credential store.
- `pnpm run lint` runs ESLint with `--fix`, so it may rewrite files. Use `pnpm exec eslint .` if you only need a read-only lint pass.
