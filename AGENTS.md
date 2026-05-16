# AGENTS.md

This repository is being prepared as an open-source npm package.

## Language Policy

- Use English for code, type names, runtime UI, CLI output, errors, warnings, generated examples, and component metadata.
- Use English for agent-facing instructions, including this file and `agents/AGENTS.snippet.md`.
- `README.md` and `docs/design.md` are English-first.
- Chinese documentation may exist only in explicit localized files such as `README.zh-CN.md` and `docs/design.zh-CN.md`.
- Do not add Chinese strings to `src/`, `artifact-docs/`, or `agents/`.

## Project Goal

MDX Artifacts helps agents write Markdown-native MDX with reusable React components, then compile that MDX into standalone HTML artifacts.

The core idea is:

```text
Markdown-native MDX source + high-level React components
  -> CLI build
  -> standalone HTML artifact
```

Do not frame the project as a raw HTML generator, a React app DSL, or an Astro docs site. Astro may become a later adapter, but it is not the core abstraction.

## Product Philosophy

MDX Artifacts is a Markdown-native artifact system.

The source should read like a document. The output can behave like an interactive HTML artifact. Components should be semantic islands inside the document, not the whole authoring model.

Use this boundary when adding components, examples, registry metadata, and agent instructions:

- Prefer native Markdown or MDX children for narrative content, explanations, long descriptions, lists, and reviewable prose.
- Prefer semantic components for structured workflow regions such as decisions, comparisons, code review, export handoff, and interactive state.
- Prefer props for stable ids, short labels, variants, layout controls, machine-readable values, and genuinely structured data.
- Do not invent an implicit Markdown parser where headings, lists, or tables secretly become component data. Component-owned slots must be explicit in the MDX.
- Do not make MDX authors write arbitrary React application code for normal artifacts. If an artifact needs app-level state, project-specific CSS, or custom interaction, use a project local component or a dedicated web artifact builder.

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
- `docs/component-taxonomy.md`
- `docs/cli-structure.md`
- `docs/testing.md`
- `ROADMAP.md`

Local phase execution notes belong in `docs/local/*.local.md`. They are ignored by Git and must not be committed as public docs.

Good names:

- `ContentSet`
- `ContentItem`
- `ExportPanel`

Avoid primitive or vague names:

- `Panel`
- `CardList`
- `Box`

When adding or changing a component:

1. Update the React component.
2. Update `src/react/registry.ts`.
3. Add registry `types` metadata for complex object props such as `Foo[]` or `Foo`.
4. Add or update Storybook stories.
5. Add or update an MDX example if it changes the artifact workflow.
6. Run `pnpm artifact components <ComponentName>` to confirm the CLI metadata is useful.
7. Follow `docs/testing.md` for the minimum required test layer.

The component registry is the source of truth for CLI lookup, agent usage, and future generated docs.

CLI source organization lives in `docs/cli-structure.md`. When changing CLI internals, keep command orchestration, services, MDX mutation, state persistence, dev server integration, and config code in their documented directories.

For component API shape:

- Human-readable body content should be children-first or slot-first.
- Readable content block components should default to `title`, `badge`, `summary`, and `children`.
- Use `children` for Markdown-rich body content such as paragraphs, local headings, lists, pros, cons, risks, tradeoffs, and rationale.
- Do not apply this slot model to structured renderers such as `CodeBlock`, `DiffBlock`, or `AnnotatedCode`, layout primitives, or export/editor components.
- Long string props such as `body` or `description` should be avoided for new public APIs unless the value is genuinely data.
- Keep props for ids, titles, enum-like settings, layout controls, export values, code strings, and structured arrays.
- Existing props-first APIs may remain compatible, but new examples should prefer the Markdown-native form when the component supports it.

### Layout Components

Layout primitives such as `Stack`, `Columns`, `Grid`, `SplitPane`, and `Frame` are advanced composition tools.

Use semantic or workflow components first. Use layout primitives only when an artifact needs a custom arrangement that cannot be expressed cleanly with an existing semantic component.

Layout primitives may control spacing, ratios, collapse behavior, and surface treatment. They must not be used to recreate content or handoff structure that belongs in components such as `ContentSet`, `ExportPanel`, or future code review components.

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
