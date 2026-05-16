# CLI Structure

This document describes how the CLI source tree is organized and where new code should go.

The CLI entry remains `src/cli/index.ts`. It wires the command parser and delegates to command modules. Most implementation code should live below one of the focused subdirectories instead of growing inside the entry file.

## Directory Map

```text
src/cli/
  index.ts
  commands/
  config/
  dev-server/
  mdx/
  services/
  state/
```

| Directory | Responsibility | Examples |
|---|---|---|
| `commands/` | Command-level orchestration for each public CLI command. | `build`, `components`, `dev`, `interactions`, `review`, `scaffold`, `validate` |
| `config/` | Shared CLI config loading and public config types. | `loadArtifactKitConfig`, `ArtifactKitConfig` |
| `dev-server/` | Vite dev server integration and browser-facing dev endpoints. | artifact dev server middleware |
| `mdx/` | MDX source updates, parsing helpers, and document mutation helpers. | `sortable-list` source patching |
| `services/` | Reusable CLI workflows that sit below commands but above low-level helpers. | interaction and review operation handling |
| `state/` | Artifact state file IO and state-shape helpers. | artifact state snapshots |

## Boundaries

Command modules should stay thin. They may parse arguments, call shared services, print concise CLI output, and return an exit code. They should not accumulate reusable state, MDX mutation, or dev server internals.

Service modules can own workflow behavior that is shared by commands, the dev server, or future automation entry points. A service should not print CLI output directly unless the output is part of its public contract.

MDX modules should keep document-level mutations close to the syntax they operate on. When a behavior changes persisted artifact source, prefer placing that logic under `mdx/` and calling it from a command or service.

Current examples:

- `commands/interactions.ts` parses interaction CLI arguments and formats CLI output.
- `services/interaction-service.ts` owns SortableList runtime overlay writes and source promotion.
- `mdx/sortable-list.ts` owns SortableList-specific MDX source inspection and patching.
- `commands/review.ts` parses review CLI arguments, formats review output, and owns validate exit-code behavior.
- `services/review.ts` owns review thread add, reply, validation, state writes, and anchor discovery.

State modules should own local state file formats and persistence helpers. They should not know about command names, terminal output, or Vite middleware.

Dev server modules should own runtime endpoints, Vite configuration, and browser integration. They may call services or state helpers, but should not become the source of truth for persisted document changes.

Config modules should remain small and stable. Runtime UI components may import config types, but should not import command or service modules.

## Import Direction

Prefer this dependency direction:

```text
index.ts
  -> commands/
    -> services/
    -> config/
    -> state/
    -> mdx/
    -> dev-server/

dev-server/
  -> services/
  -> state/
  -> config/

services/
  -> state/
  -> mdx/
  -> config/
```

Avoid importing from `commands/` into lower-level modules. If logic is needed outside a command, move it into `services/`, `mdx/`, `state/`, or `config/` first.

## Tests

Keep tests next to the module they cover. For example:

```text
src/cli/commands/components.test.ts
src/cli/state/artifact-state.test.ts
src/cli/dev-server/vite-artifact.test.ts
```

Use focused CLI tests for command behavior and lower-level tests for state, MDX, and server helpers. Avoid testing the same behavior only through the CLI entry point when a narrower module test can cover it directly.

## Future Split Points

The current structure is only a directory boundary. It does not require every large module to be split immediately.

Good next split candidates:

- Keep interaction ordering and item mutation logic inside `services/` or `mdx/`, with commands and dev server endpoints calling that shared layer.
- Keep dev server HTTP endpoint code inside `dev-server/`, but move reusable artifact operations out when they become useful from CLI commands.
- Consider a dedicated interaction domain directory only after another interaction type, such as a board component, proves that `services/` plus focused `mdx/` modules are no longer enough.

The goal is to keep the CLI queryable and agent-friendly without turning it into a framework. Add a new directory only when an existing boundary is no longer enough.
