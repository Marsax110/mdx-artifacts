# CLAUDE.md

Follow the same repository rules as `AGENTS.md`.

## Default Behavior

When asked to create or modify an artifact:

1. Prefer creating or editing `.mdx` files under `artifact-docs/`.
2. Prefer existing high-level components from `src/react`.
3. Run `pnpm artifact components <ComponentName>` when component props are unclear.
4. Run `pnpm artifact:validate` before building.
5. Run `pnpm artifact:build` to verify standalone HTML output.

Do not generate raw HTML unless explicitly requested.

Use these public docs for project conventions:

- `ROADMAP.md`
- `docs/naming.md`
- `docs/component-protocol.md`

Keep local phase execution notes in `docs/local/*.local.md`. They are ignored by Git and should not be committed.

## Language

Use English in:

- Runtime UI strings.
- CLI output.
- Error messages.
- Component metadata.
- Generated examples.
- Agent-facing instructions.

Chinese text is allowed only in localized documentation files:

- `README.zh-CN.md`
- `docs/design.zh-CN.md`

## Validation Commands

Use these commands before considering work complete:

```bash
pnpm typecheck
pnpm build:cli
pnpm artifact:validate
pnpm artifact:build
```

For package boundary checks:

```bash
npm pack --dry-run --cache /private/tmp/mdx-artifacts-npm-cache
```

## Architecture Boundary

The core package is not an Astro project and not a raw HTML generator.

The core package is:

```text
React high-level components
+ component registry
+ CLI build/validate/query
+ standalone HTML artifact output
```

Astro, shadcn/ui, and daisyUI are future optional adapters/templates, not core dependencies.

## Commits

Use English commit messages for this open-source repository. Keep local execution notes in ignored local files instead of encoding them in public commit history.
