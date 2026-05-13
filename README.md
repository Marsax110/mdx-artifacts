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
3. `src/cli` provides `init`, `components`, `validate`, `dev`, and `build`.
4. `components` exposes component props and examples for agents.
5. `build` outputs a standalone HTML artifact.

Astro is intentionally not part of the core yet. It can become a later adapter for long-lived docs sites.

## Commands

Install dependencies:

```bash
pnpm install
```

Validate and build the example artifact:

```bash
pnpm artifact:validate
pnpm artifact:build
```

Inspect available components:

```bash
pnpm artifact components
pnpm artifact components ExportPanel
pnpm artifact components --json
```

Build one MDX file:

```bash
pnpm artifact build artifact-docs/examples/decision-matrix.mdx
```

Default output:

```text
dist/artifacts/examples/decision-matrix.html
```

Develop components in Storybook:

```bash
pnpm storybook
```

Storybook is only for component development. The artifact workflow is still verified through `artifact-kit validate/build`.

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

## Documentation

- [Roadmap](ROADMAP.md)
- [Design notes](docs/design.md)
- [Naming conventions](docs/naming.md)
- [Component protocol](docs/component-protocol.md)
- [Chinese README](README.zh-CN.md)
