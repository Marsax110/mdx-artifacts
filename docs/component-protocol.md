# Component Protocol

The component protocol is the stable layer between agent-written MDX and generated HTML artifacts.

Agents should write MDX that calls high-level components. They should not generate raw HTML for common artifact workflows.

## Source Shape

Typical source:

```mdx
import { ContentSet, ExportPanel } from "mdx-artifacts/react";

<ContentSet
  id="set.stage-one"
  title="Should stage one focus on a **single HTML artifact**?"
  columns={3}
>
  <ContentSet.Item
    id="vite"
    title="Vite artifact"
    badge="Recommended"
    tone="positive"
    emphasis="primary"
    summary="Validate the shortest artifact loop first."
  >
    ### Tradeoffs

    - Short feedback loop
    - No docs-site navigation yet
  </ContentSet.Item>
</ContentSet>

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
artifact-kit components ContentSet
artifact-kit components --json
```

When adding or changing a component, update the registry in the same change.

## Content Slots

Content components should use a small display-oriented slot model. Prefer these slots before inventing component-specific text props:

- `title`: required visible heading or item label.
- `badge`: optional short display label shown beside the title.
- `summary`: optional one-line explanation below the title.
- `children`: Markdown-rich body content for paragraphs, local headings, lists, quotes, and rationale.

Use props for short display structure. Use `children` for long explanations, pros and cons, tradeoff lists, risks, and any content that should remain readable in MDX diffs.

Do not parse headings inside `children` as a component protocol. Headings and lists in children are human-readable body structure, not machine-readable slot names.

## Content Items

Use `ContentItem` when one reusable content block needs display slots, tone color, emphasis weight, a stable comment anchor, and Markdown-rich body content.

Use `ContentSet` when multiple same-kind content items should be displayed together:

```mdx
<ContentSet id="set.authoring-paths" title="Authoring paths" layout="grid" columns={3} surface="subtle">
  <ContentSet.Item
    id="component-first"
    title="Component-first"
    badge="Recommended"
    tone="positive"
    emphasis="primary"
    summary="Best for stable interaction and visual structure."
  >
    ### Tradeoffs

    - Clear component boundaries
    - Easy to debug
    - Less natural for long prose
  </ContentSet.Item>
</ContentSet>
```

`tone` and `emphasis` are separate:

- `surface` controls the `ContentSet` container treatment: `plain`, `subtle`, or `outlined`.
- `surface` is not semantic color. Use it to decide whether the group should read as document flow, a soft section, or a bounded section.
- `tone` controls semantic color: `neutral`, `info`, `positive`, `warning`, `danger`, or `accent`.
- `emphasis` controls structural weight: `default`, `primary`, or `subtle`.
- `badge` is visible text only. It does not choose color by itself.
- `emphasis="subtle"` may mute the badge and summary, but body children should remain readable.

`ContentSet` is not a workspace or large layout container. Use it for one group of same-kind items. Use layout primitives such as `SplitPane` or `Columns` for multi-region artifacts.

## Interactive Data Components

Use props-first APIs when a component owns user-controlled state such as sorting, board columns, selected values, or exportable edits.

`SortableList` is the current baseline:

```mdx
<SortableList
  id="list.launch-priority"
  title="Launch priority"
  summary="Drag items or use the controls to change the handoff order."
  items={[
    {
      id: "contentset-api",
      title: "Stabilize ContentSet API",
      summary: "Must land before public examples.",
      badge: "P0",
      tags: ["api", "docs"]
    }
  ]}
/>
```

For interactive data components:

- Use structured props for stable ids, item labels, tags, and initial state.
- Keep item records short. Do not put long prose, Markdown lists, or narrative rationale into item data.
- Persist user-controlled state into artifact interactions when available.
- Treat MDX props as the authored truth and artifact interactions as the runtime overlay.
- Use `artifact-kit interactions inspect <file.mdx> <id>` to read the current truth from MDX plus the state overlay.
- Use `Section` beside the component for long explanation, criteria, or rationale.

`interactions inspect` is read-only. It reports the resolved order, ignores stale state ids that no longer exist in MDX, and appends new MDX item ids that are not yet present in the state overlay.

Use narrow CLI writes for runtime interaction state:

```bash
artifact-kit interactions set-order artifact-docs/examples/decision-matrix.mdx \
  list.next-priorities \
  --ordered-ids example-output validate-build adapter-design

artifact-kit interactions reset artifact-docs/examples/decision-matrix.mdx \
  list.next-priorities

artifact-kit interactions promote artifact-docs/examples/decision-matrix.mdx \
  list.next-priorities
```

`set-order` writes only the runtime overlay and requires the ordered ids to match the current MDX item ids exactly. `reset` removes the runtime overlay for that component and falls back to the MDX default order. Neither command edits MDX.

`promote` is the explicit authored-truth write. It reorders the static MDX `items` array to match the current runtime overlay, then clears that component's overlay. It rejects stale or incomplete runtime ids instead of guessing.

## Authoring Kinds

Every public component should declare an authoring kind in `src/react/registry.ts`. This keeps the component API aligned with the product philosophy and gives `artifact-kit components <ComponentName>` enough guidance for agents.

Use these kinds:

| Kind | Use For | API Shape |
|---|---|---|
| `content-block` | Readable cards, options, findings, risks, callouts, and repeated items. | `title`, optional `badge`, optional `summary`, and Markdown-rich `children`. |
| `structured-renderer` | Code, diffs, line annotations, and other domain-shaped renderers. | Explicit structured props such as `code`, `lines`, or `annotations`. |
| `layout-primitive` | Arrangement-only helpers such as `Stack`, `Columns`, `Grid`, `SplitPane`, and `Frame`. | Layout props plus `children`; no workflow semantics. |
| `interactive-data` | User-controlled structured state such as sortable lists and future boards. | Structured props for initial state plus artifact interactions for user edits. |
| `export-editor` | Export docks, editors, and state handoff controls. | Structured `value`, state, format, or handoff props. |
| `review-boundary` | Comment layers, stable review sections, and fine-grained comment targets. | Stable ids or target ids plus the visible reviewed `children`. |

The kind is not a styling category. It tells an author where meaning belongs:

- `content-block`: keep long human-readable text in MDX children.
- `structured-renderer`: keep machine-shaped data in props.
- `layout-primitive`: do not encode domain meaning.
- `interactive-data`: keep stateful records structured and exportable.
- `export-editor`: keep handoff data structured.
- `review-boundary`: keep anchors durable and review targets meaningful.

Complex props must be self-describing through the registry. Do not rely on TypeScript LSP alone for agent usage. If a prop type references a named object or object array, such as `DiffLine[]` or `CodeAnnotation[]`, add a matching entry to the component's `types` metadata:

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

- `ContentSet`
- `ContentItem`
- `AnnotatedCode`
- `ExportPanel`
- future workflow recipes such as `DiffExplainer`, `PriorityBoard`, `PromptWorkbench`, and `FeatureFlagEditor`

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

`ContentItem`

- Use for standalone readable content cards.
- Use `title`, optional `badge`, optional `summary`, `tone`, `emphasis`, and Markdown-rich children.

`ContentSet`

- Use for a group of same-kind content items.
- Use `ContentSet.Item` children.
- Use `layout="grid" | "stack"` and `columns={2 | 3 | 4 | 5}` for arrangement.
- Use `tone` for semantic color and `emphasis` for structural weight.

`ExportPanel`

- Use when the artifact needs to return decisions, state, or configuration to the user or agent.
- Interactive artifacts should include `ExportPanel` or an equivalent export path.

## Review State Protocol

Reviewable content should use stable anchors:

- Native MDX prose uses `Section id="..."`.
- Structured components use their own `id` prop.
- Component sub-items may derive child anchors from the parent id and item id, such as `set.stage-one.vite`.

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

artifact-kit review validate artifact-docs/examples/decision-matrix.mdx
```

`review add` creates one open thread for an existing anchor. `review reply` appends assistant messages to existing threads and may update status. `review validate` reports state threads whose `anchorId` no longer exists in the current MDX. None of these commands edits MDX.

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
