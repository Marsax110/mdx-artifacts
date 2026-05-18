# MDX Artifacts Design Notes

## Language Policy

For open source and npm publishing:

- Code, types, runtime UI, CLI output, and error messages are English-first.
- `componentRegistry` is English because it is consumed by the CLI, agents, and future generated docs.
- `artifact-docs/examples` is English because examples double as public fixtures.
- `agents/AGENTS.snippet.md` is English so it does not impose a local language preference on user projects.
- `README.md` is English-first.
- Chinese notes live in `README.zh-CN.md` and `docs/design.zh-CN.md`.

## Background

The value of an HTML artifact is not that it replaces Markdown. Its value is that comparison, tuning, sorting, exporting, and visual explanation workflows can become directly operable interfaces.

Asking an agent to generate raw HTML for every artifact has recurring problems:

- High token cost.
- Repeated layout and interaction code.
- Inconsistent export behavior.
- Poor diff quality.
- Throwaway pages rarely become reusable workflow assets.

This project keeps MDX as the source format and lets agents call reusable high-level components. The output is a standalone HTML artifact.

## Architecture

### 1. Component Protocol

The core asset is the high-level component protocol, not a specific frontend shell.

First-stage components:

- `InlineText`: short text with controlled inline Markdown.
- `MarkdownBody`: controlled component-local body Markdown.
- `ContentItem`: standalone readable content card.
- `ContentSet`: grouped readable content cards with tone and emphasis.
- `SortableList`: draggable structured priority list with persisted order.
- `ExportPanel`: export Markdown or JSON.

Planned components:

- `KanbanBoard`: column-based card sorting.
- `PromptWorkbench`: prompt variables and sample previews.
- `DiffExplainer`: PR and diff explanation.
- `ParameterTuner`: parameter tuning UI.

### 2. Build Layer

Stage one uses Vite, React, and MDX:

```text
artifact-docs/foo.mdx
  -> Vite bundle
  -> inline JS/CSS/assets
  -> dist/artifacts/foo.html
```

The goal is to validate the single HTML artifact loop before building a docs site.

### 3. Docs Site Layer

Stage two can add an Astro adapter:

```text
artifact-docs/
  decisions/auth.mdx
  pr-reviews/backpressure.mdx

-> Astro adapter

dist/site/
  decisions/auth/index.html
  pr-reviews/backpressure/index.html
```

Astro is a good fit for long-lived documentation, but it should not define the core component API.

## Why Not Bind the Core to Astro

Astro is useful for long-lived MDX documentation:

- MDX files can map naturally to pages.
- Layouts, frontmatter, routing, and static output are built in.
- Documentation archives become easier to maintain.

But it is not the right core abstraction for one-off artifacts:

- It is heavier than needed for temporary interactive tools.
- Agents need to understand Astro-specific `client:*` directives.
- High-level artifact components should remain portable.

Current strategy:

```text
Core asset: React components + exporter protocol
First target: Vite single HTML artifact
Second target: Astro docs site
```

## Styling Protocol

MDX Artifacts provides default CSS, but the default theme is not part of the core artifact contract.

Users can inject brand styles through `mdx-artifacts.config.mjs`:

```js
/** @type {import("mdx-artifacts").MdxArtifactsConfig} */
const config = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: ["artifact-theme.css"],
  tailwindSources: ["artifact-components/**/*.{ts,tsx}"]
};
```

Rules:

- `includeDefaultStyles: true` imports MDX Artifacts default styles first.
- `styles` are imported in array order after the default styles.
- Users can override CSS variables or `ak-*` classes.
- `includeDefaultStyles: false` disables MDX Artifacts default styles.
- The current MDX file is always registered as a Tailwind source for local MDX components.
- `tailwindSources` registers additional project-local component files that use Tailwind classes.
- The final CSS is still inlined into the standalone HTML artifact.

## UI Dependencies

The current route is intentionally light:

- Tailwind is an internal styling build tool.
- Radix primitives are added only for complex headless interactions.
- shadcn/ui is not a runtime dependency; it may become a future registry/template option.
- daisyUI is not a core dependency; it may become a future demo theme/template.

## Component Development

Storybook is a development dependency for isolated component previews.

Storybook is responsible for:

- Showing component states.
- Debugging long text, empty data, and narrow layouts.
- Providing public component examples.

Storybook is not responsible for:

- Compiling MDX artifacts.
- Producing standalone HTML.
- Managing agent workflows.
- Replacing a future Astro docs site.

Current workflow:

```text
Component development: pnpm storybook
Protocol verification: pnpm typecheck / pnpm test / pnpm mdx-artifacts:validate
Artifact verification: pnpm mdx-artifacts:build
```

## Testing Protocol

The first test baseline protects the component protocol rather than browser behavior.

Current coverage:

- registry metadata contract
- `InlineText` and `MarkdownBody` controlled Markdown rendering
- CLI component lookup output
- MDX validation rules

The operational testing path lives in `docs/testing.md`.

Out of scope for the first baseline:

- browser E2E
- visual regression
- Astro adapter tests
- package tarball smoke tests

## Agent Contract

When generating an artifact, agents should:

1. Create `.mdx` files instead of raw HTML.
2. Prefer existing high-level components.
3. Provide an export path for interactive artifacts.
4. Move bulky data into adjacent `.json` files.
5. Run `mdx-artifacts components <ComponentName>` when props are unclear.
6. Run `mdx-artifacts components --json` for machine-readable metadata.
7. Run `mdx-artifacts validate <file.mdx>` before build.
8. Run `mdx-artifacts build <file.mdx>` to produce standalone HTML.

## CLI Component Query

To keep skills and agent instructions short, the CLI exposes component metadata:

```bash
mdx-artifacts components
mdx-artifacts components ExportPanel
mdx-artifacts components --json
mdx-artifacts components ExportPanel --json
```

The data comes from `componentRegistry`. Future docs, Storybook docs, validation rules, and agent skills should derive from the same source.

Component naming rules:

- Names must be self-describing, such as `ContentSet` and `ExportPanel`.
- Avoid generic names such as `Panel` or `CardList`.
- A component should represent an artifact workflow, not a primitive UI element.
- Text rendering is intentionally split into `InlineText`, `MarkdownBody`, and future long-form prose components.

## Public Roadmap and Local Execution Notes

Public project direction lives in:

- `ROADMAP.md`
- `docs/design.md`
- `docs/naming.md`
- `docs/component-protocol.md`
- `docs/component-taxonomy.md`
- `docs/cli-structure.md`
- `docs/testing.md`

Local phase execution notes belong in `docs/local/*.local.md` and are not committed. They can track temporary decisions, verification notes, and agent working state without adding process noise to the public repository.

## Success Criteria

Stage one is complete when:

- Example MDX passes validation.
- Example MDX can be previewed locally.
- Example MDX builds into standalone HTML.
- The HTML opens directly and supports copy/export.

Stage two is complete when:

- The `artifact-docs` tree can generate a static docs site.
- The docs site uses the same high-level components.
- Single artifacts and the docs site share the same source files.
