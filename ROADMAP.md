# Roadmap

MDX Artifacts is in the component protocol foundation stage.

The public roadmap tracks stable project direction. Local execution notes belong in `docs/local/*.local.md` and are intentionally not committed.

## Phase 1: Component Protocol Foundation

Goal:

- Make the MDX-to-standalone-HTML loop reliable.
- Establish self-describing component names and prop conventions.
- Make component metadata queryable through the CLI.
- Add controlled text primitives for inline and body copy.

In scope:

- `DecisionMatrix`
- `OptionGrid`
- `ExportPanel`
- `InlineText`
- `MarkdownBody`
- Component registry metadata
- CLI component lookup
- Storybook component previews
- Single artifact validation and build loop
- Documented extension lifecycle for inline, project local, plugin, and built-in components

Out of scope:

- Astro docs-site adapter
- shadcn/ui or daisyUI templates
- Full prose rendering
- Math rendering
- Markdown tables
- Drag-and-drop tools
- Multi-file artifact data loaders
- Runtime plugin system

Completion criteria:

- Example MDX validates.
- Example MDX can build into standalone HTML.
- CLI can list and inspect all first-stage components.
- Text fields declare their content type.
- Public docs explain naming and component protocol rules.
- Public docs explain when to use inline MDX components, project local components, future plugins, and built-in components.
- Basic tests protect registry metadata, text rendering, CLI component lookup, and MDX validation.

## Phase 2: Component Expansion

Goal:

- Add higher-value primitives and components for agent-generated artifacts.
- Use `docs/component-taxonomy.md` to prioritize candidates from recurring artifact use cases.

## Phase 2.1: Theme and Advanced Layout Primitives

Goal:

- Establish the light/dark theme variable foundation before adding more components.
- Add a minimal set of advanced layout primitives for composition tests and Storybook previews.
- Keep layout primitives separate from semantic components.

Candidate components:

- `Stack`
- `Columns`
- `Grid`
- `SplitPane`
- `Frame`

Expected improvements:

- Components share the same `--ak-*` color, spacing, border, and surface variables.
- Default theme follows `prefers-color-scheme`.
- Users can override the theme with `data-theme="light"` or `data-theme="dark"`.
- Storybook can preview layout primitives and composed artifacts in light and dark modes.

Non-goals:

- No general UI kit.
- No `Card`, `Panel`, or button system.
- No shadcn/ui or daisyUI dependency.
- No layout-first guidance for agents.

## Phase 2.2: Code Rendering and Explanation Components

Candidate components:

- `CodeBlock`
- `DiffBlock`
- `Callout`
- `SeverityBadge`
- `AnnotatedCode`
- `DiffExplainer`

Expected improvements:

- Stable code and compact diff rendering primitives before larger explanation components.
- Small semantic primitives for notes, risks, severities, and line-level explanations.
- More consistent code review and explanation artifacts.
- Better reuse across PR review, implementation plans, research notes, and incident reports.
- Reduced repeated MDX composition for common explanation patterns.

## Phase 2.3: Interactive Tool Components

Candidate components:

- `PriorityBoard`
- `PromptWorkbench`
- `ParameterTuner`
- `FeatureFlagEditor`

Expected improvements:

- Structured export formats.
- Better state handoff back to agents.
- More focused examples for PR review, planning, and prompt tuning.
- CLI support for querying configured project local components.
- Validator reporting for inline MDX components and project local component metadata.

## Phase 2.4: Comment and Review Layer

Goal:

- Add a client-side review loop for standalone artifacts.
- Let authors mark stable component regions as commentable targets.
- Keep review UI outside the main content flow on wide screens.
- Preserve a usable fallback on narrow screens without compressing the document.

Implemented components:

- `CommentLayer`
- `CommentableBlock`
- `CommentTarget`
- `CommentExport`

Current direction:

- Use explicit `CommentableBlock` and `CommentTarget` boundaries first.
- Allow one comment per commentable target in the first review model.
- Show a side review rail on wide screens and click-open popovers on narrow screens.
- Share the same comment item rendering between rails and popovers so editing behavior stays consistent.
- Keep comment state local to the current page; no server persistence or collaboration layer yet.

Next validation step:

- Wrap several large native MDX prose sections in `docs/local/streamlit-style-mixed.zh-CN.local.mdx` with explicit `CommentableBlock`.
- Verify that explicit prose comments preserve the linear MDX writing experience.
- Decide whether implicit native Markdown block comments are worth adding after the explicit-block flow stabilizes.

Deferred:

- Automatic wrapping of every native Markdown block.
- Text selection comments.
- Multi-comment threads per target.
- Server-side persistence.
- Realtime collaboration.

## Phase 3: Docs Site Adapter

Goal:

- Turn an `artifact-docs/` tree into a structured static documentation site.

Candidate direction:

- Astro adapter or template.
- Shared source files between single artifacts and docs site output.
- Navigation and archive experience for long-lived artifacts.

Non-goal:

- The core package should not become an Astro-only framework.
