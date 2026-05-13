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

Out of scope:

- Astro docs-site adapter
- shadcn/ui or daisyUI templates
- Full prose rendering
- Math rendering
- Markdown tables
- Drag-and-drop tools
- Multi-file artifact data loaders

Completion criteria:

- Example MDX validates.
- Example MDX can build into standalone HTML.
- CLI can list and inspect all first-stage components.
- Text fields declare their content type.
- Public docs explain naming and component protocol rules.

## Phase 2: Interactive Tool Components

Goal:

- Add higher-value components for temporary agent-generated tools.

Candidate components:

- `PriorityBoard`
- `PromptWorkbench`
- `ParameterTuner`
- `DiffExplainer`

Expected improvements:

- Structured export formats.
- Better state handoff back to agents.
- More focused examples for PR review, planning, and prompt tuning.

## Phase 3: Docs Site Adapter

Goal:

- Turn an `artifact-docs/` tree into a structured static documentation site.

Candidate direction:

- Astro adapter or template.
- Shared source files between single artifacts and docs site output.
- Navigation and archive experience for long-lived artifacts.

Non-goal:

- The core package should not become an Astro-only framework.
