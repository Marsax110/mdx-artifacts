# Component Protocol

The component protocol is the stable layer between agent-written MDX and generated HTML artifacts.

Agents should write MDX that calls high-level components. They should not generate raw HTML for common artifact workflows.

## Source Shape

Typical source:

```mdx
import { DecisionMatrix, ExportPanel } from "mdx-artifacts/react";

<DecisionMatrix
  question="Should stage one focus on a **single HTML artifact**?"
  options={[
    {
      name: "Vite artifact",
      pros: ["Short feedback loop"],
      cons: ["No docs-site navigation yet"],
      verdict: "Recommended"
    }
  ]}
/>

<ExportPanel
  value={{ recommendation: "Start with the single artifact loop." }}
/>
```

## Registry

`src/react/registry.ts` is the source of truth for:

- component descriptions
- use cases
- prop names
- content types
- examples

The CLI reads the same registry:

```bash
artifact-kit components
artifact-kit components DecisionMatrix
artifact-kit components --json
```

When adding or changing a component, update the registry in the same change.

## First-stage Components

`InlineText`

- Use for short labels, titles, captions, and notes.
- Accepts `inlineMarkdown`.
- Heading semantics are controlled by the `as` prop.

`MarkdownBody`

- Use for component-local body copy.
- Accepts controlled `blockMarkdown`.
- Does not support headings, tables, HTML, math, or code blocks.

`DecisionMatrix`

- Use for tradeoff comparison.
- Text fields should remain short and scannable.

`OptionGrid`

- Use for side-by-side alternatives.
- Each option should focus on intent and tradeoffs.

`ExportPanel`

- Use when the artifact needs to return decisions, state, or configuration to the user or agent.
- Interactive artifacts should include `ExportPanel` or an equivalent export path.

## Styling

Default CSS uses the `ak-*` prefix.

Users can override styles through injected CSS. Component behavior should not depend on a particular brand theme.

## Non-goals

The component protocol is not:

- a raw HTML generator
- a general Markdown renderer
- an Astro-only docs framework
- a replacement for shadcn/ui or daisyUI
