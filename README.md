# MDX Artifacts

Interactive MDX artifacts for agents.

MDX Artifacts lets an agent write structured MDX with reusable React components, then compile it into a standalone HTML artifact that can be opened locally in a browser.

The goal is not to make agents generate raw HTML from scratch or write a React app DSL inside MDX. The goal is to keep the source Markdown-native while using stable, high-level components as semantic islands:

```mdx
import { ContentSet, ExportPanel } from "mdx-artifacts/react";

<ContentSet
  id="set.stage-one"
  title="Should stage one focus on a Vite single HTML artifact?"
  columns={3}
>
  <ContentSet.Item
    id="vite"
    title="Vite single HTML artifact"
    badge="Recommended"
    tone="positive"
    emphasis="primary"
    summary="Validate the shortest Markdown-native source to interactive HTML loop first."
  >
    ### Tradeoffs

    - Short feedback loop
    - Fits one-off tool artifacts
    - No docs-site navigation yet
  </ContentSet.Item>
</ContentSet>

<ExportPanel
  title="Export decision"
  formats={["markdown", "json"]}
  value={{ recommendation: "Start with a single HTML artifact." }}
/>
```

The CLI turns that MDX file into a self-contained HTML file.

## Authoring Philosophy

MDX Artifacts is a Markdown-native artifact system.

Source files should read like documents. Output files should behave like interactive HTML artifacts. Components should mark semantic islands inside the document, not replace the document with a large JSX configuration object.

Use this product boundary when making component and authoring decisions:

- Prefer native Markdown or MDX children for narrative content, explanations, long descriptions, lists, and reviewable prose.
- Prefer semantic components for structured workflow regions such as decisions, comparisons, code review, export handoff, and interactive state.
- Prefer props for stable ids, short labels, enum-like settings, layout controls, machine-readable values, and genuinely structured data.
- Do not move all semantics into an implicit Markdown parser. Headings, lists, and tables should not secretly become component data unless a component explicitly owns that slot.
- Do not turn artifact sources into React application code. If an artifact needs arbitrary stateful UI, project-specific CSS, or app-level interaction, use a dedicated web artifact builder or a project local component.

This means new component APIs should usually be children-first for human-readable content and props-first for machine-readable configuration.

## 0.2.0 Breaking Changes

`DecisionMatrix` and `OptionGrid` have been removed from the public API. Use `ContentSet` for grouped content cards and `ContentItem` for standalone content cards.

This release makes the content authoring model more consistent: readable explanation, rationale, pros, cons, risks, and tradeoffs should live in MDX children instead of object-array props.

Use:

```mdx
<ContentSet id="set.path" title="Choose the implementation path" columns={3}>
  <ContentSet.Item
    id="path-a"
    title="Path A"
    badge="Recommended"
    tone="positive"
    emphasis="primary"
    summary="Best first step."
  >
    ### Tradeoffs

    - Keeps the MDX source readable
    - Lets long rationale stay in Markdown
  </ContentSet.Item>
</ContentSet>
```

Do not use `DecisionMatrix`, `DecisionMatrix.Option`, `OptionGrid`, `OptionGrid.Item`, or `options={[...]}`. The `validate` command warns when removed components or older props such as `question`, `name`, `intent`, `pros`, `cons`, `risks`, `confidence`, `verdict`, or `tradeoffs` are found.

## Current Scope

The first stage focuses on the smallest useful loop:

1. `artifact-docs/**/*.mdx` is the source format.
2. `src/react` provides high-level artifact components.
3. `src/cli` provides `init`, `components`, `validate`, `dev`, `build`, and narrow review-state commands.
4. `components` exposes component props and examples for agents.
5. `build` outputs a standalone HTML artifact.

Astro is intentionally not part of the core yet. It can become a later adapter for long-lived docs sites.

## Install

Install in a project that should build local artifacts:

```bash
pnpm add -D mdx-artifacts
```

In a pnpm workspace root, make the workspace-root install explicit:

```bash
pnpm add -Dw mdx-artifacts
```

React and React DOM are peer dependencies. Modern package managers usually install them automatically for this dev-tool workflow. If peer dependency auto-install is disabled in your project, install them explicitly:

```bash
pnpm add -D mdx-artifacts react react-dom
```

Initialize a workspace:

```bash
pnpm exec mdx-artifacts init
```

For non-interactive setup, pass the project structure explicitly:

```bash
pnpm exec mdx-artifacts init --yes --docs-dir docs/artifacts --components-dir artifact-components --agent codex
```

This creates:

```text
mdx-artifacts.config.mjs
<docsDir>/examples/hello.mdx
agents/AGENTS.snippet.md
```

`components-dir` is a project-local component source directory. It is added to `tailwindSources` for Tailwind class discovery, but it does not automatically register components.

Build the initialized example:

```bash
pnpm exec mdx-artifacts validate artifact-docs/examples/hello.mdx
pnpm exec mdx-artifacts build artifact-docs/examples/hello.mdx
```

Default output:

```text
dist/artifacts/examples/hello.html
```

## CLI

Inspect available components:

```bash
pnpm exec mdx-artifacts components
pnpm exec mdx-artifacts components ExportPanel
pnpm exec mdx-artifacts components --json
```

Build one MDX file:

```bash
pnpm exec mdx-artifacts build artifact-docs/examples/hello.mdx
```

## Review State

MDX Artifacts can keep local review threads beside an MDX file while the dev server is running. Review state is stored in a sibling `.state.json` file:

```text
artifact-docs/examples/hello.mdx
artifact-docs/examples/hello.state.json
```

Use stable anchors in MDX so review threads can survive edits:

```mdx
import { ContentSet, Section } from "mdx-artifacts/react";

<Section id="section.context">

## Context

Native MDX prose can be reviewed through the section anchor.

</Section>

<ContentSet
  id="set.stage-one"
  title="Should this artifact use stable anchors?"
  columns={2}
>
  <ContentSet.Item id="yes" title="Use stable anchors" badge="Recommended" tone="positive" emphasis="primary">
    Stable child anchors keep review threads attached across edits.
  </ContentSet.Item>
</ContentSet>
```

Agents can add a user thread, append an assistant reply, and validate that saved threads still point at anchors in the current MDX:

```bash
pnpm exec mdx-artifacts review add artifact-docs/examples/hello.mdx \
  --anchor set.stage-one \
  --body "Clarify this decision."

pnpm exec mdx-artifacts review reply artifact-docs/examples/hello.mdx \
  --thread thr_set_stage_one \
  --body "Updated the decision copy." \
  --status resolved

pnpm exec mdx-artifacts review validate artifact-docs/examples/hello.mdx
```

Review commands read and write the sibling `.state.json` file for the source MDX. They do not edit the MDX source. `review validate` checks whether saved review threads still point at anchors that exist in the current MDX.

When an anchor is removed from MDX, the browser review layer keeps the thread visible as an unplaced comment instead of deleting it. The CLI reports the same problem:

```text
review validate failed
missing: 1
- thread: thr_removed anchorId: comparison.removed status: open title: Removed comparison
```

Resolve missing anchors by restoring the old id, migrating the thread to a new anchor, or marking the thread resolved with an assistant reply that explains the structural change.

## Repository Development

Install dependencies:

```bash
pnpm install
```

Validate and build the repository example artifact:

```bash
pnpm check
pnpm mdx-artifacts:validate
pnpm mdx-artifacts:build
```

Develop components in Storybook:

```bash
pnpm storybook
```

Storybook is only for component development. The artifact workflow is still verified through `mdx-artifacts validate/build`.

Run the test baseline:

```bash
pnpm test
pnpm typecheck
pnpm mdx-artifacts:validate
```

Run the package smoke test before publishing:

```bash
pnpm pack:smoke
```

## Style Injection

MDX Artifacts injects default styles by default. Users can add brand styles through `mdx-artifacts.config.mjs`:

```js
/** @type {import("mdx-artifacts").MdxArtifactsConfig} */
const config = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: ["artifact-theme.css"],
  tailwindSources: ["artifact-components/**/*.{ts,tsx}"]
};

export default config;
```

Custom styles are imported after the default styles, so they can override CSS variables or `ak-*` classes. Set `includeDefaultStyles: false` to disable MDX Artifacts default styles.

The CLI automatically registers the current MDX file as a Tailwind source, so Tailwind utility classes inside local MDX components are generated during artifact builds. Use `tailwindSources` for project-local component files that are imported by MDX and also contain Tailwind classes.

## Design Principles

- Source files are MDX, not raw HTML.
- Source should stay Markdown-native; output can be richer, interactive HTML.
- Components are semantic islands in the document, not the whole authoring model.
- Component APIs should be semantic and self-describing.
- Human-readable body content should prefer MDX children or explicit slots over long string props.
- Props should carry ids, short labels, variants, layout controls, and structured data.
- Interactive artifacts must provide an export path.
- Bulky data should live in adjacent JSON files instead of JSX props.
- Core components stay React/TypeScript and should be reusable from Vite, Astro, or artifact builders.
- Tailwind is an internal styling build tool; the final artifact still inlines CSS.
- Radix primitives are introduced only when complex interactions need them.
- shadcn/ui and daisyUI are not core dependencies; they may become optional templates or registries later.
- Basic tests protect registry metadata, controlled text rendering, CLI component lookup, and MDX validation.

## Documentation

- [Roadmap](ROADMAP.md)
- [Design notes](docs/design.md)
- [Naming conventions](docs/naming.md)
- [Component protocol](docs/component-protocol.md)
- [Component taxonomy](docs/component-taxonomy.md)
- [CLI structure](docs/cli-structure.md)
- [Testing](docs/testing.md)
- [Chinese README](README.zh-CN.md)
