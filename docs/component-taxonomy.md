# Component Taxonomy

This document maps recurring HTML artifact use cases into reusable component candidates.

The source inspiration is the public `html-effectiveness` example set. The goal is not to copy those HTML files. The goal is to extract repeatable structures, interaction patterns, and export loops that can become stable MDX component APIs.

## Source Use Case Groups

The example set groups twenty HTML artifacts into:

- Exploration and planning
- Code review and understanding
- Design
- Prototyping
- Diagrams
- Decks
- Research and learning
- Reports
- Custom editing interfaces

These groups suggest three broad layers for MDX Artifacts:

1. Foundation components
2. Workflow components
3. Templates or future adapters

## Abstraction Layers

The original HTML examples are free-form LLM output. They can produce endless visual variants. MDX Artifacts should not copy those variants one by one. It should extract stable abstractions from the information structure, user task, and export loop.

Use these layers when deciding whether a candidate belongs in the public registry.

| Layer | Public by Default | Purpose | Examples |
|---|---:|---|---|
| Layout primitives | No | Arrange content without owning meaning. These may include default spacing/border styles, but they should not own workflow semantics. | `Stack`, `Columns`, `Grid`, `MosaicGrid`, `SplitPane`, `Frame` |
| Content rendering primitives | Sometimes | Render controlled content formats. | `InlineText`, `MarkdownBody`, future `CodeBlock`, `MathBlock`, `MermaidBlock` |
| Semantic primitives | Yes | Express a reusable concept with a stable schema. | `Callout`, `SeverityBadge`, `AnnotatedCode`, `Timeline` |
| Workflow recipes | Not by default | Guide an agent to assemble an artifact-level job from semantic primitives. Promote to code only when the structure is stable. | `DiffExplainer`, `FeatureExplainer`, `StatusReport` |
| Editor components | Yes | Let users manipulate local state and export the result. | `PriorityBoard`, `PromptWorkbench`, `FeatureFlagEditor` |
| Output capabilities | Not always UI | Convert artifact state into handoff formats. | `FlagDiffExport`, `PromptTemplateExport`, `ActionItemsExport` |
| Templates or adapters | No | Package domain-specific or visually heavy artifact formats. | `DesignSystemSheet`, `ConceptExplainer`, `SlideDeck` |

Layout primitives should stay internal first. They should describe arrangement patterns, not domain-specific panels. Prefer names such as `Stack`, `Columns`, `Grid`, `MosaicGrid`, `SplitPane`, and `Frame` over names such as `ReportHeader`, `MetricBand`, or `EditorSplitLayout`.

If layout primitives are exposed later, they may accept content rendering primitives and semantic primitives as children. For example, a `Columns` layout could contain `MarkdownBody`, `Callout`, `AnnotatedCode`, or `Timeline`. This should remain an advanced composition path, not the default way for agents to build common artifacts.

The common risk is exposing too many `Card`, `Panel`, or ad hoc `Grid` shapes. That pushes agents toward assembling UI instead of calling semantic components or following workflow recipes.

Semantic examples matter. A code diff is not just a container with monospace text. It has files, hunks, line ranges, annotations, severity, findings, and review handoff. That is why `AnnotatedCode` belongs in the semantic layer, and why `DiffExplainer` should start as a workflow recipe before becoming a large code component.

## Content Component Slot Model

Use the shared display slot model for readable content components that render repeated cards, items, options, findings, risks, or sections.

Default slots:

- `title`: the primary visible label.
- `badge`: an optional short status or category label beside the title.
- `summary`: an optional one-line explanation below the title.
- `children`: Markdown-rich body content for paragraphs, local headings, lists, quotes, risks, pros, cons, and rationale.

This slot model applies to `ContentItem` and `ContentSet.Item`. It should also be the default for future components such as `FindingCard`, `RiskList.Item`, `StatusReport.Section`, or `ImplementationPlan.Step`.

Do not apply the slot model blindly to every complex component:

- Structured renderers such as `CodeBlock`, `DiffBlock`, and `AnnotatedCode` should keep their domain schemas.
- Layout primitives such as `Stack`, `Columns`, `Grid`, `SplitPane`, and `Frame` should keep layout props and children.
- Export or editor components such as `ExportPanel` should keep state and handoff props.
- Document boundaries such as `Section` should stay focused on stable review anchors and native MDX children.

The test is whether the component is primarily a readable content block. If yes, use `title`, `badge`, `summary`, and `children`. If the component primarily renders structured data, controls layout, or exports state, keep its domain-specific schema.

## Authoring Metadata

The registry records the same distinction through `authoring.kind`. This makes the taxonomy queryable from the CLI instead of leaving it only in prose docs.

| Authoring Kind | Current Components | Guidance |
|---|---|---|
| `content-block` | `InlineText`, `MarkdownBody`, `ContentItem`, `ContentSet`, `SeverityBadge`, `Callout`, `ComparisonSet` | Use short display props plus Markdown-rich children for readable body content. |
| `structured-renderer` | `CodeBlock`, `DiffBlock`, `AnnotatedCode` | Keep code, diff rows, and annotations in structured props. |
| `layout-primitive` | `Stack`, `Columns`, `Grid`, `SplitPane`, `Frame` | Arrange content without owning workflow meaning. |
| `export-editor` | `ExportPanel`, `CommentExport` | Keep handoff data structured and copy/export behavior explicit. |
| `review-boundary` | `CommentLayer`, `Section`, `CommentableBlock`, `CommentTarget` | Provide stable anchors around meaningful review targets. |

## Extension Lifecycle

Component candidates do not all need to enter the core package. Use the lifecycle below to keep the core package small while still giving agents room to handle new artifact shapes.

| Level | Best For | Default Treatment |
|---|---|---|
| Inline MDX component | Tiny one-off display helpers used by one artifact. | Allow as an escape hatch; validate and report them. |
| Project local component | Reusable project-specific extensions, such as repo risk maps or internal release widgets. | Register in project config; make them queryable through the CLI. |
| Workflow recipe | Artifact-level jobs that still need flexible section composition. | Document as agent guidance or MDX templates first. |
| Built-in component | General, stable, reusable protocol primitives. | Add schema, registry metadata, examples, and tests. |
| NPM plugin | Cross-project extensions that should not live in the core package. | Future ecosystem layer. |

This lifecycle is meant to prevent two failure modes:

- overloading the core package with every visual variant found in LLM-generated HTML
- forcing users back to raw HTML or ad hoc React when they need a small extension

Inline MDX components should stay small. If an inline component needs browser state, effects, complex interaction, export logic, or repeated use, it should move into a project local component.

Project local components should be treated as build-time extensions. The CLI can bundle them into standalone HTML, validate their registration metadata, and list them together with built-in components. They should not require a runtime plugin system in the first implementation.

## Extraction Outputs

When reviewing an HTML artifact, extract three kinds of reusable assets.

Layout:

- Non-functional arrangement such as single column, equal columns, ratio columns, grids, preview frames, and split panes.
- Layout assets are usually internal primitives first.
- They should not become agent-facing registry components unless users need to compose layouts directly in MDX.

Component:

- Semantic or workflow-level pieces such as callouts, badges, annotated code, timelines, decision matrices, and diff explainers.
- Components can become agent-facing when their name, props, and use case are clear.

Output capability:

- Interaction or export behavior that returns user choices, annotations, sort order, prompt edits, config changes, or decisions back to the workflow.
- Output capability can be part of a component, or it can reuse `ExportPanel`.
- Early output capabilities should prefer copy/export over persistence or backend sync.

Early implementation should favor assets that are general, simple, and easy to test.

## Foundation Components

Foundation components are small protocol primitives. They are not a general UI kit, but they are reused by workflow components.

Already available:

- `InlineText`: controlled inline Markdown for short text.
- `MarkdownBody`: controlled block Markdown for component-local body copy.
- `CodeBlock`: controlled code rendering with filename, language label, line numbers, and highlighted lines.
- `DiffBlock`: structured diff rendering with add, remove, context rows, and compact effective line numbers.
- `Callout`: semantic note, warning, recommendation, or risk block with controlled Markdown body copy.
- `SeverityBadge`: compact severity, confidence, status, or risk label.
- `AnnotatedCode`: code block with line-level annotations and severity labels.
- `ExportPanel`: structured Markdown or JSON handoff.

Candidate foundation components:

| Component | Purpose | Priority | Notes |
|---|---|---:|---|
| `Callout` | Highlight warnings, assumptions, gotchas, or decisions. | Shipped | Useful across reports, code review, research, and plans. |
| `SeverityBadge` | Show severity, confidence, status, or risk. | Shipped | Small but widely reused by review/report components. |
| `AnnotatedCode` | Render code with line notes and severity markers. | Shipped | First version uses a code block plus annotation list. |
| `CodeBlock` | Render code with language, filename, line numbers, and highlighted lines. | Shipped | Syntax highlighting and copy affordance remain future enhancements. |
| `DiffBlock` | Render structured diff rows with compact effective line numbers. | Shipped | Accepts structured lines first; raw unified diff parsing can be a later helper. |
| `Timeline` | Show ordered events, milestones, incidents, or plans. | P2 | Reusable for status reports, incidents, and implementation plans. |
| `MetricCard` | Show compact numeric status with label and trend. | P2 | Useful for status reports and dashboards. |
| `DataTable` | Show simple structured rows such as shipped PRs, impact metrics, or comparisons. | P2/P3 | Keep narrow; do not turn the core package into a table framework. |
| `ActionItemList` | Show follow-up items with owner, due date, and status. | P2 | Useful for reports, incidents, implementation plans, and handoffs. |
| `DisclosureSteps` | Show expandable step-by-step explanations. | P2 | Useful for feature explainers and process walkthroughs. |
| `TabsPanel` | Switch between related examples, snippets, or outputs. | P2 | Useful, but should be added only when repeated. |
| `GlossaryPanel` | Show terminology with optional term highlighting from body copy. | P2/P3 | Useful for research, learning, and terminology-heavy reports. |

## Workflow Recipes

Workflow recipes represent artifact-level jobs. They are usually better expressed first as prompt guidance, CLI recipes, or MDX templates that tell an agent which semantic primitives to combine.

Already available:

- `ContentSet`: group same-kind content items in a grid or list.
- `ContentItem`: render a standalone readable content card.

Candidate workflow recipes:

| Recipe | Use Case | Priority | Depends On |
|---|---|---:|---|
| `DiffExplainer` | PR review with files, diff hunks, annotations, and findings. | P1 | `AnnotatedCode`, `SeverityBadge`, `Callout` |
| `PRWriteup` | Reviewer-facing PR explanation with motivation, file tour, and review focus. | P2 | `Callout`, `AnnotatedCode` |
| `ModuleMap` | Explain a package or module through nodes, edges, entry points, and hot paths. | P2 | Future diagram primitives |
| `ImplementationPlan` | Show milestones, risks, data flow, and handoff tasks. | P2 | `Timeline`, `Callout`, `ContentSet` |
| `FeatureExplainer` | Explain how a repo feature works with TL;DR, files read, steps, code tabs, gotchas, and FAQ. | P2 | `DisclosureSteps`, `TabsPanel`, `AnnotatedCode`, `Callout` |
| `StatusReport` | Weekly or project status summary with shipped/slipped/risks. | P3 | `MetricCard`, `Timeline`, `Callout` |
| `IncidentReport` | Post-mortem with TL;DR, severity, timeline, root cause, impact, and action items. | P3 | `Timeline`, `AnnotatedCode`, `DataTable`, `ActionItemList`, `Callout` |

A workflow recipe should become a code component only when:

- its section structure is stable
- its schema is stable
- direct composition creates repeated MDX noise
- code encapsulation reduces agent errors
- users can still hide, add, or replace sections when needed

## Custom Editing Components

Custom editors are where HTML artifacts become directly operable. They should run locally, keep state in the browser, show validation feedback, and always include a clear export path back to an agent, issue, PR, config file, or prompt.

| Component | Use Case | Priority | Export Shape |
|---|---|---:|---|
| `PriorityBoard` | Drag tasks across Now / Next / Later / Cut and export the final plan. | P1 | Markdown and JSON |
| `PromptWorkbench` | Edit a prompt template, validate slots, and preview sample inputs live. | P1 | Prompt text and JSON |
| `FeatureFlagEditor` | Toggle grouped flags, show dependency warnings, and copy changed keys. | P1/P2 | JSON diff and full JSON |
| `ParameterTuner` | Tune values such as duration, easing, color, threshold, or model settings. | P2 | JSON or CSS variables |

Common editor requirements:

- Keep first versions backend-free and resettable.
- Prefer copy/export over persistence.
- Show pending changes or validation warnings before export.
- Export stable Markdown, JSON, diff, prompt text, or CSS variables.

## Design and Prototype Components

These are useful, but they should not dominate the core package too early. Design examples show that HTML is strong for token references, component contact sheets, and variant matrices. Those assets are valuable as templates because they help agents reuse a project's visual language without making MDX Artifacts a general-purpose UI kit.

| Component | Use Case | Priority | Notes |
|---|---|---:|---|
| `DesignSystemSheet` | Show tokens, swatches, type scale, spacing, radius, elevation, and component states. | P3 | Better as an adapter or template that exports prompt context. |
| `ComponentVariantSheet` | Show component variants, live token controls, usage notes, and copyable props. | P3 | Useful after the component library grows. Reuse `ParameterTuner` for controls. |
| `AnimationTuner` | Tune easing, duration, and visual motion. | P3 | Browser interaction heavy. |
| `ClickableFlow` | Link several screens into a prototype. | Later | Better as a template than core protocol. |

## Deferred Template Candidates

These are valuable artifact formats, but they should stay outside the core component protocol for now:

- `SlideDeck`
- `SVGIllustrationSheet`
- complex `ConceptExplainer`
- `InteractiveConceptDemo`
- generic charting beyond small report-specific charts
- full diagram authoring tools
- visual design generators

They are better treated as templates, examples, or future adapters after the core workflow components stabilize.

## Suggested Implementation Order

Phase 2.1: Theme and advanced layout primitives

1. `Stack`
2. `Columns`
3. `Grid`
4. `SplitPane`
5. `Frame`

Phase 2.2: Code and explanation foundation

1. `CodeBlock`
2. `DiffBlock`
3. `Callout`
4. `SeverityBadge`
5. `AnnotatedCode`
6. `DiffExplainer`

Phase 2.3: Operable custom editors

1. `PriorityBoard`
2. `PromptWorkbench`
3. `FeatureFlagEditor`
4. `ParameterTuner`

Phase 2.4: Reports and plans

1. `Timeline`
2. `ImplementationPlan`
3. `MetricCard`
4. `ActionItemList`
5. `StatusReport`
6. `IncidentReport`

## Selection Criteria

Prioritize a component when:

- it appears across multiple artifact categories
- it has a clear data schema
- an agent can choose it from its name and registry metadata
- it reduces repeated HTML or interaction code
- it produces a useful export or handoff
- it does not require the agent to hand-write layout-heavy JSX

Defer a component when:

- it needs complex browser-only behavior
- it is mostly visual polish
- it is better represented as a template
- it would force the core package to become a general UI kit
- it is just a container around arbitrary children
- it has no stable semantics beyond placement or styling

## Promotion Rules

A candidate can move from local analysis into the public registry when:

- the name is self-describing
- the schema is stable enough to document
- the component can be queried through the CLI
- examples can show normal use without raw HTML
- there is a focused test path
- interactive state has a clear export path

Workflow recipes have a higher bar before becoming code components. They can remain documented agent guidance for a long time. That keeps artifacts flexible while the semantic primitives mature.

Keep a candidate internal or template-only when:

- it only arranges content
- it exists only inside one workflow
- it needs complex children to be useful
- it is tightly coupled to a project's brand or domain model
- it would make the package behave like a UI kit, chart library, diagram editor, or docs framework
