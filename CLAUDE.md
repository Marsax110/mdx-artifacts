# CLAUDE.md

Follow the same repository rules as `AGENTS.md`.

## Product Philosophy

MDX Artifacts is a Markdown-native artifact system, not a raw HTML generator and not a React app DSL.

The source should read like a document. The output can behave like an interactive HTML artifact. Components should be semantic islands inside the document, not the whole authoring model.

When creating or changing artifacts and components:

- Use native Markdown or MDX children for narrative content, explanations, long descriptions, lists, and reviewable prose.
- Use semantic components for structured workflow regions such as decisions, comparisons, code review, export handoff, and interactive state.
- Use props for stable ids, short labels, variants, layout controls, machine-readable values, and genuinely structured data.
- Do not invent an implicit Markdown parser where headings, lists, or tables secretly become component data. Component-owned slots must be explicit in the MDX.
- Do not make normal artifact sources look like React applications. If arbitrary stateful UI or custom app-level interaction is needed, use a project local component or a dedicated web artifact builder.

## Default Behavior

When asked to create or modify an artifact:

1. Prefer creating or editing `.mdx` files under `artifact-docs/`.
2. Keep the MDX source Markdown-native: prose in Markdown, semantic islands in components.
3. Prefer existing high-level components from `src/react`.
4. Run `pnpm artifact components <ComponentName>` when component props are unclear.
5. Run `pnpm artifact:validate` before building.
6. Run `pnpm artifact:build` to verify standalone HTML output.

For complex props such as `CodeAnnotation[]` or `DiffLine[]`, use the CLI metadata instead of guessing object fields. The component registry should expose nested type fields in the `types` metadata.

For new public component APIs, prefer children-first or slot-first design for human-readable body content. Keep props for ids, titles, enum-like settings, layout controls, code strings, export values, and structured data. Existing props-first APIs may remain compatible, but new examples should prefer the Markdown-native form when available.

Readable content block components should default to `title`, `badge`, `summary`, and `children`. Use `children` for Markdown-rich body content such as paragraphs, local headings, lists, pros, cons, risks, tradeoffs, and rationale. Do not apply this slot model to structured renderers, layout primitives, or export/editor components.

Do not generate raw HTML unless explicitly requested.

Layout primitives such as `Stack`, `Columns`, `Grid`, `SplitPane`, and `Frame` are advanced composition tools. Prefer semantic or workflow components first, and use layout primitives only when a custom arrangement is needed.

Use these public docs for project conventions:

- `ROADMAP.md`
- `docs/naming.md`
- `docs/component-protocol.md`
- `docs/component-taxonomy.md`
- `docs/testing.md`

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
pnpm test
pnpm check
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
