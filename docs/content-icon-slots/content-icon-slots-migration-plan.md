# Content Icon Slots Migration Plan

## Strategy

Add icon slots as a narrow enhancement to existing content components.

The implementation should keep the current component protocol intact:

- `ContentItem` and `ContentSet` remain semantic content components.
- Icons are decorative scan aids, not semantic data.
- Layout stays component-owned.
- External icon libraries remain user-controlled and optional.

## Phase 1: Protocol and Scope

### Goal

Document the icon-slot decision before changing component behavior.

### Suggested Content

- Define `icon?: ReactNode` as a decorative slot.
- Decide that `iconLabel` is out of scope for the first version.
- Decide that icon placement is fixed by each component.
- Decide that Lucide is not a core dependency.
- Define the minimum test layer for later implementation.

### Acceptance Criteria

- The overview document exists.
- The migration plan exists.
- The Phase 1 execution plan exists.
- `docs/component-protocol.md` points to the icon-slot policy.
- No runtime dependency or component behavior changes are introduced in Phase 1.

### Suggested Files

- `docs/content-icon-slots/README.md`
- `docs/content-icon-slots/content-icon-slots-migration-plan.md`
- `docs/content-icon-slots/phase-1-content-icon-slots-execution-plan.md`
- `docs/component-protocol.md`

### Boundary Reminder

Do not implement `icon` props in Phase 1 unless the execution plan is explicitly updated first.

## Phase 2: Component API, Rendering, and Metadata

### Goal

Add `icon?: ReactNode` to `ContentItem`, `ContentSet`, and `ContentSet.Item` as one public contract change.

### Suggested Content

- Add `icon?: ReactNode` to the relevant prop types.
- Render `ContentItem` icons in the component-owned title area.
- Render `ContentSet` icons beside the set title.
- Add stable CSS classes for icon wrappers.
- Keep icon layout fixed.
- Add `icon` prop metadata to `ContentItem`, `ContentSet`, and `ContentSet.Item`.
- Update registry examples to use emoji as the default authoring path.
- Add Storybook examples for no icon, emoji icon, and React element icon.

### Acceptance Criteria

- Existing `ContentItem` and `ContentSet` usage remains valid.
- Emoji icons render in server-side component tests.
- React element icons render in server-side component tests.
- Missing icons do not change current text output.
- `artifact-kit components ContentItem` explains the icon slot.
- `artifact-kit components ContentSet` explains the icon slot.
- Storybook has focused icon examples.
- No `lucide-react` dependency is added.

### Suggested Files

- `src/react/composites/content-set/ContentItem.tsx`
- `src/react/composites/content-set/content-item.test.tsx`
- `src/react/styles.css`
- `src/react/registry.ts`
- `src/react/registry.test.ts`
- `src/react/composites/content-set/ContentItem.stories.tsx`

### Boundary Reminder

Do not add `iconPosition`, `iconLabel`, or icon inheritance in this phase.

## Phase 3: MDX Examples and Workflow Polish

### Goal

Decide whether published MDX examples should demonstrate content icon slots.

### Suggested Content

- Update an MDX example only if it improves the artifact workflow.
- Keep examples sparse if icons add noise.

### Acceptance Criteria

- At least one MDX example demonstrates the default emoji path if the workflow benefits from it.
- Existing examples remain readable if no MDX icon example is added.

### Suggested Files

- `artifact-docs/examples/*.mdx`

### Boundary Reminder

Do not turn icon examples into a general visual design system.

## Phase 4: Validation and Release Readiness

### Goal

Verify that icon slots work without changing the package dependency boundary.

### Suggested Content

- Run the light local check.
- Run targeted component tests.
- Confirm package dependencies did not gain `lucide-react`.
- Confirm generated component metadata remains concise.

### Acceptance Criteria

- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm artifact:validate` passes.
- `package.json` has no new icon-library dependency.

### Suggested Files

- No required source files.
- Update this plan if validation finds a contract gap.

### Boundary Reminder

Avoid `pnpm build` for routine validation. Use the repository's lighter type, test, and validation commands unless package release work requires heavier checks.

## Default Checkpoints

- After Phase 1, the policy is clear enough to review without reading source code.
- After Phase 2, the runtime API works and agents can discover the icon slot through normal component lookup.
- After Phase 3, published MDX examples either demonstrate icons intentionally or intentionally stay text-first.
- After Phase 4, the change is ready for package-level review.

## Risks and Controls

| Risk | Control |
|---|---|
| Icon props become layout props | Keep only `icon?: ReactNode` in the first version. |
| Users think Lucide is required | Document emoji as the default path and external icon libraries as optional. |
| Icons carry hidden semantics | Document icons as decorative and require semantic meaning in text and tone props. |
| Content components become generic cards | Keep icon placement component-owned and avoid `iconPosition`. |
