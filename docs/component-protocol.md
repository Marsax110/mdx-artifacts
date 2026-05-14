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
- nested object type fields
- examples

The CLI reads the same registry:

```bash
artifact-kit components
artifact-kit components DecisionMatrix
artifact-kit components --json
```

When adding or changing a component, update the registry in the same change.

Complex props must be self-describing through the registry. Do not rely on TypeScript LSP alone for agent usage. If a prop type references a named object or object array, such as `DecisionMatrixOption[]`, `DiffLine[]`, or `CodeAnnotation[]`, add a matching entry to the component's `types` metadata:

```ts
{
  name: "DiffBlock",
  props: [
    {
      name: "lines",
      type: "DiffLine[]",
      contentType: "json",
      required: true,
      description: "Structured diff rows."
    }
  ],
  types: [
    {
      name: "DiffLine",
      description: "One structured row in a rendered diff.",
      fields: [
        {
          name: "type",
          type: "'add' | 'remove' | 'context'",
          required: true,
          description: "Diff row kind."
        }
      ]
    }
  ]
}
```

The CLI must show these nested fields in `artifact-kit components <ComponentName>` and return them in `artifact-kit components <ComponentName> --json`.

## Extension Lifecycle

The protocol should allow agents and users to go beyond the built-in component set, but that freedom needs a lifecycle. Otherwise MDX Artifacts would collapse back into agents hand-writing one-off React or HTML for every artifact.

Use these extension levels:

| Level | Location | Purpose | Registry Status |
|---|---|---|---|
| Built-in component | `mdx-artifacts/react` | Stable protocol components maintained by this package. | Required |
| Project local component | User project component folder, such as `artifact-components/` | Reusable project-specific extension. | Configured in the user project |
| Inline MDX component | Inside a single `.mdx` file | Tiny one-off expression for the current artifact. | Detected, not registered |
| NPM plugin | External package | Future reusable ecosystem extension. | Future plugin registry |

Inline MDX components are allowed as an escape hatch for small, single-use presentation details. They should not contain complex state, effects, drag-and-drop behavior, export logic, or large UI implementations. A strict validation mode may forbid inline components.

Project local components are the preferred path when a user needs a reusable extension that is not general enough for the core package. They should live outside the MDX file and be registered in project configuration with a name, import path, description, prop metadata, and examples. The CLI should be able to query these components alongside built-in components.

Project local components are build-time extensions, not runtime plugins. The artifact renderer can bundle them into the final HTML through the same MDX/Vite pipeline. This keeps the model simple and avoids a dynamic plugin runtime.

Promotion path:

1. Start with an inline MDX component for a tiny one-off need.
2. Move repeated project-specific behavior into a project local component.
3. Publish reusable cross-project behavior as a plugin package later.
4. Promote broadly useful, stable, tested behavior into the built-in registry.

Promotion into the built-in registry requires a stable name, schema, examples, tests, registry metadata, and a clear validation path.

## Abstraction Boundary

The public protocol should favor semantic components over layout containers.

Preferred public code components:

- encode a recognizable artifact task
- have stable props
- reduce repeated HTML or interaction code
- can be explained by their name
- can export decisions, state, or configuration when interactive

Examples:

- `DecisionMatrix`
- `DiffExplainer`
- `PriorityBoard`
- `PromptWorkbench`
- `FeatureFlagEditor`

Workflow-level names such as `DiffExplainer`, `FeatureExplainer`, `StatusReport`, and `IncidentReport` do not need to start as large React components. They can first exist as agent recipes or MDX templates that explain which semantic primitives to combine.

Promote a workflow recipe to a code component only when:

- the section structure is stable
- the schema is stable
- repeated MDX composition creates noise or errors
- the component still lets users hide, add, or replace sections

Layout primitives should usually remain internal:

- `Stack`
- `Columns`
- `Grid`
- `MosaicGrid`
- `SplitPane`
- `Frame`

These are useful arrangement strategies, but exposing too many of them pushes agents back toward hand-building UI. Only expose a layout primitive if users genuinely need to compose that structure directly in MDX.

If layout primitives are exposed, they should allow content rendering primitives and semantic primitives as children. For example, a `Columns` layout can hold `MarkdownBody`, `Callout`, `AnnotatedCode`, or `Timeline`. The layout controls placement; the child component owns meaning.

Avoid exposing domain-shaped layout names such as `ReportHeader`, `MetricBand`, `EditorSplitLayout`, or `TablePanel` as public protocol components. Those are better treated as internal sections inside recipes, templates, or higher-level components.

Semantic primitives are different from containers. For example, `AnnotatedCode` owns file paths, line ranges, annotations, and severity. A future `DiffExplainer` owns changed files, diff hunks, findings, and review handoff. Those concepts should not be reduced to arbitrary children inside a generic card.

Content rendering primitives may grow beyond text and Markdown. Future candidates include controlled `CodeBlock`, `MathBlock`, and `MermaidBlock` renderers. These should remain narrow format renderers with explicit safety boundaries; they should not become arbitrary HTML or script injection points.

## First-stage Components

`InlineText`

- Use for short labels, titles, captions, and notes.
- Accepts `inlineMarkdown`.
- Heading semantics are controlled by the `as` prop.

`MarkdownBody`

- Use for component-local body copy.
- Accepts controlled `blockMarkdown`.
- Supports local headings, paragraphs, lists, blockquotes, bold, emphasis, strikethrough, inline code, and links.
- Does not support tables, HTML, math, or code blocks.
- Prefer component title props for main artifact structure.

`DecisionMatrix`

- Use for tradeoff comparison.
- Text fields should remain short and scannable.

`OptionGrid`

- Use for side-by-side alternatives.
- Each option should focus on intent and tradeoffs.

`ExportPanel`

- Use when the artifact needs to return decisions, state, or configuration to the user or agent.
- Interactive artifacts should include `ExportPanel` or an equivalent export path.

## Review State Protocol

Reviewable content should use stable anchors:

- Native MDX prose uses `Section id="..."`.
- Structured components use their own `id` prop.
- Component sub-items may derive child anchors from the parent id and item id, such as `decision.stage-one.vite`.

The source MDX remains the content truth. Review state lives in a sibling `.state.json` file and references anchors through `anchorId`.

The first review model is:

- one primary thread per `anchorId`
- multiple messages per thread
- `role: "user"` for reviewer comments
- `role: "assistant"` for agent replies after the MDX has been updated

Example state:

```json
{
  "version": 1,
  "source": "artifact-docs/examples/decision-matrix.mdx",
  "threads": [
    {
      "id": "thr_decision_stage_one",
      "anchorId": "decision.stage-one",
      "status": "open",
      "title": "Text model decision",
      "messages": [
        {
          "id": "msg_user_001",
          "role": "user",
          "body": "Clarify why native MDX remains the default.",
          "createdAt": "2026-05-14T08:00:00.000Z"
        },
        {
          "id": "msg_assistant_001",
          "role": "assistant",
          "body": "Updated the decision copy and kept native MDX as the default path.",
          "createdAt": "2026-05-14T08:10:00.000Z"
        }
      ]
    }
  ],
  "interactions": {}
}
```

Use narrow CLI writes for review state:

```bash
artifact-kit review add artifact-docs/examples/decision-matrix.mdx \
  --anchor decision.stage-one \
  --body "Clarify why native MDX remains the default."

artifact-kit review reply artifact-docs/examples/decision-matrix.mdx \
  --thread thr_decision_stage_one \
  --body "Updated the decision copy." \
  --status resolved
```

`review add` creates one open thread for an existing anchor. `review reply` appends assistant messages to existing threads and may update status. Neither command edits MDX.

Do not introduce multi-thread-per-anchor UI until the single-thread message model is stable. Multiple independent threads for one anchor are a later review-system feature, not the first artifact review protocol.

## Styling

Default CSS uses the `ak-*` prefix.

Users can override styles through injected CSS. Component behavior should not depend on a particular brand theme.

## Non-goals

The component protocol is not:

- a raw HTML generator
- a general Markdown renderer
- an Astro-only docs framework
- a replacement for shadcn/ui or daisyUI
