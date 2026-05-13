# AGENTS.md

This repository is being prepared as an open-source npm package.

## Language Policy

- Use English for code, type names, runtime UI, CLI output, errors, warnings, generated examples, and component metadata.
- Use English for agent-facing instructions, including this file and `agents/AGENTS.snippet.md`.
- `README.md` and `docs/design.md` are English-first.
- Chinese documentation may exist only in explicit localized files such as `README.zh-CN.md` and `docs/design.zh-CN.md`.
- Do not add Chinese strings to `src/`, `artifact-docs/`, or `agents/`.

## Project Goal

MDX Artifacts helps agents write structured MDX with reusable React components, then compile that MDX into standalone HTML artifacts.

The core idea is:

```text
MDX source + high-level React components
  -> CLI build
  -> standalone HTML artifact
```

Do not frame the project as a raw HTML generator or an Astro docs site. Astro may become a later adapter, but it is not the core abstraction.

## Development Workflow

Use these commands for local verification:

```bash
pnpm typecheck
pnpm test
pnpm check
pnpm build:cli
pnpm artifact:validate
pnpm artifact:build
```

Use Storybook only for isolated component development:

```bash
pnpm storybook
```

Storybook is not the artifact build path. The final artifact loop is still verified through `artifact-kit validate/build`.

## Component Protocol

Components should be workflow-level and self-describing.

Public component rules live in:

- `docs/naming.md`
- `docs/component-protocol.md`
- `docs/testing.md`
- `ROADMAP.md`

Local phase execution notes belong in `docs/local/*.local.md`. They are ignored by Git and must not be committed as public docs.

Good names:

- `DecisionMatrix`
- `OptionGrid`
- `ExportPanel`

Avoid primitive or vague names:

- `Panel`
- `CardList`
- `Box`

When adding or changing a component:

1. Update the React component.
2. Update `src/react/registry.ts`.
3. Add or update Storybook stories.
4. Add or update an MDX example if it changes the artifact workflow.
5. Run `pnpm artifact components <ComponentName>` to confirm the CLI metadata is useful.
6. Follow `docs/testing.md` for the minimum required test layer.

The component registry is the source of truth for CLI lookup, agent usage, and future generated docs.

## Styling Policy

Artifact Kit provides default CSS, but users can inject custom styles through `artifact-kit.config.ts`.

Default behavior:

```ts
const config = {
  includeDefaultStyles: true,
  styles: []
};
```

Rules:

- Keep default styles scoped with the `ak-*` prefix.
- Prefer CSS variables for brand customization.
- Do not introduce shadcn/ui or daisyUI as core dependencies.
- Tailwind is an internal styling build tool.
- Radix primitives are allowed only when a component needs accessible headless interaction.

## CLI Policy

CLI output must be concise and English.

The CLI should help agents reduce prompt instructions:

```bash
artifact-kit components
artifact-kit components ExportPanel
artifact-kit components --json
```

Prefer making information queryable through the CLI instead of duplicating long component docs in agent instructions.

## Open Source Baseline

Before the first public commit or npm publish:

1. Run a sensitive-content scan.
2. Run `rg "[\u4e00-\u9fff]" src artifact-docs agents README.md docs/design.md package.json LICENSE`.
3. Run `pnpm typecheck`.
4. Run `pnpm test`.
5. Run `pnpm build:cli`.
6. Run `pnpm artifact:validate`.
7. Run `pnpm artifact:build`.
8. Run `npm pack --dry-run --cache /private/tmp/mdx-artifacts-npm-cache`.
9. Confirm `npm pack` does not include `src/`, `.storybook/`, stories, sourcemaps, `node_modules/`, or `dist/artifacts`.

Do not commit generated `dist/artifacts` output.

## Commit Policy

Use English commit messages for this open-source repository.

Commit titles should be concise and describe the public change. Commit bodies may use bullet points for the main changes.

Do not use local-language commit messages in public history. Local working notes can stay in ignored `docs/local/*.local.md` files.

## Editing Rules

- Keep changes surgical and tied to the requested goal.
- Do not introduce a new framework adapter unless the current task explicitly needs it.
- Do not add abstractions for hypothetical components.
- Do not change package publishing metadata with fake repository URLs.
- If a GitHub repository URL is not known yet, leave `repository`, `homepage`, and `bugs` unset.
