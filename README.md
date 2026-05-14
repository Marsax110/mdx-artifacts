# MDX Artifacts

Interactive MDX artifacts for agents.

MDX Artifacts lets an agent write structured MDX with reusable React components, then compile it into a standalone HTML artifact that can be opened locally in a browser.

The goal is not to make agents generate raw HTML from scratch. The goal is to make agents call stable, high-level components:

```mdx
import { DecisionMatrix, ExportPanel } from "mdx-artifacts/react";

<DecisionMatrix
  question="Should stage one focus on a Vite single HTML artifact?"
  options={[
    {
      name: "Vite single HTML artifact",
      pros: ["Short feedback loop", "Fits one-off tool artifacts"],
      cons: ["No docs-site navigation yet"],
      verdict: "Recommended for stage one"
    }
  ]}
/>

<ExportPanel
  title="Export decision"
  formats={["markdown", "json"]}
  value={{ recommendation: "Start with a single HTML artifact." }}
/>
```

The CLI turns that MDX file into a self-contained HTML file.

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
pnpm add mdx-artifacts react react-dom
```

Initialize a workspace:

```bash
pnpm exec artifact-kit init
```

This creates:

```text
artifact-kit.config.mjs
artifact-docs/examples/hello.mdx
agents/AGENTS.snippet.md
```

Build the initialized example:

```bash
pnpm exec artifact-kit validate artifact-docs/examples/hello.mdx
pnpm exec artifact-kit build artifact-docs/examples/hello.mdx
```

Default output:

```text
dist/artifacts/examples/hello.html
```

## CLI

Inspect available components:

```bash
pnpm exec artifact-kit components
pnpm exec artifact-kit components ExportPanel
pnpm exec artifact-kit components --json
```

Build one MDX file:

```bash
pnpm exec artifact-kit build artifact-docs/examples/hello.mdx
```

Add and reply to local review threads:

```bash
pnpm exec artifact-kit review add artifact-docs/examples/hello.mdx \
  --anchor decision.stage-one \
  --body "Clarify this decision."

pnpm exec artifact-kit review reply artifact-docs/examples/hello.mdx \
  --thread thr_decision_stage_one \
  --body "Updated the decision copy." \
  --status resolved
```

Review commands read and write the sibling `.state.json` file for the source MDX. They do not edit the MDX source.

## Repository Development

Install dependencies:

```bash
pnpm install
```

Validate and build the repository example artifact:

```bash
pnpm check
pnpm artifact:validate
pnpm artifact:build
```

Develop components in Storybook:

```bash
pnpm storybook
```

Storybook is only for component development. The artifact workflow is still verified through `artifact-kit validate/build`.

Run the test baseline:

```bash
pnpm test
pnpm typecheck
pnpm artifact:validate
```

Run the package smoke test before publishing:

```bash
pnpm pack:smoke
```

## Style Injection

Artifact Kit injects default styles by default. Users can add brand styles through `artifact-kit.config.ts`:

```ts
import type { ArtifactKitConfig } from "mdx-artifacts";

const config: ArtifactKitConfig = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: ["artifact-theme.css"]
};

export default config;
```

Custom styles are imported after the default styles, so they can override CSS variables or `ak-*` classes. Set `includeDefaultStyles: false` to fully own the styling.

## Design Principles

- Source files are MDX, not raw HTML.
- Component APIs should be semantic and self-describing.
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
- [Testing](docs/testing.md)
- [Chinese README](README.zh-CN.md)
