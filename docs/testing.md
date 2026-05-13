# Testing

The current test baseline protects the component protocol. It does not try to prove every browser behavior or release boundary yet.

## Current Baseline

Run the default local check:

```bash
pnpm check
```

This runs:

1. `pnpm typecheck`
2. `pnpm test`
3. `pnpm artifact:validate`

Current test coverage:

- registry metadata contract
- controlled text rendering for `InlineText` and `MarkdownBody`
- CLI component lookup output
- MDX validation rules

Current test files:

- `src/react/registry.test.ts`
- `src/react/components/text-components.test.tsx`
- `src/cli/components.test.ts`
- `src/cli/validate.test.ts`

## When Adding a Component

Add tests at the same layer as the new behavior.

Required:

- Add or update `src/react/registry.test.ts` if registry metadata shape changes.
- Add a component render test when the component owns rendering rules.
- Add a Storybook story for visual development states.
- Add or update an MDX example if the component changes the artifact workflow.
- Run `pnpm check`.

Recommended assertions:

- Important text renders.
- Optional fields can be omitted.
- Empty lists or missing optional data do not break layout.
- Controlled Markdown fields respect their documented content type.
- The component is registered with a clear example.

Do not add browser E2E just because a component was added. Add browser tests only when the behavior depends on real browser APIs, focus, layout, clipboard, drag-and-drop, or navigation.

## When Adding CLI Behavior

Required:

- Add or update a focused `src/cli/*.test.ts` file.
- Test command formatting through exported command functions when possible.
- Test errors and warnings as data before testing process exit behavior.
- Run `pnpm check`.

For CLI behavior that writes files or builds artifacts, prefer small integration tests with temporary directories.

Do not make the first assertion depend on full HTML build output unless the feature specifically changes build output.

## When Adding Validation Rules

Required:

- Add a positive case.
- Add a negative case.
- Keep error and warning messages stable enough for agents to understand.
- Run `pnpm check`.

Validation rules should protect the artifact protocol, not personal style preferences.

## When Adding Export Behavior

Required:

- Test serialization output as plain strings or structured data.
- Test the component wiring separately only if rendering logic changes.

Future export formats should have focused tests before being added to `ExportPanel`.

## Heavier Checks

These checks are not part of the current default baseline:

- browser E2E
- visual regression
- Storybook test runner
- Astro adapter tests
- package tarball installation smoke tests
- `artifact:build`
- `npm pack --dry-run`

Use them before npm publishing or when the changed behavior touches packaging, standalone HTML output, browser-only APIs, or future docs-site adapters.

## Rule of Thumb

Use the lightest test that can fail for the bug you are trying to prevent.

For Phase 1, prefer:

```text
typecheck + unit tests + validate
```

over:

```text
browser E2E + full build + package smoke test
```

unless the change specifically needs the heavier layer.
