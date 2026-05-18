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
3. `pnpm mdx-artifacts:validate`

Current test coverage:

- registry metadata contract
- controlled text rendering for `InlineText` and `MarkdownBody`
- CLI component lookup output
- MDX validation rules

Current test files:

- `src/react/registry.test.ts`
- `src/react/primitives/markdown-body/text-components.test.tsx`
- `src/cli/components.test.ts`
- `src/cli/commands/validate.test.ts`

## Release Check

Run the release check before publishing or after changes to package metadata, public docs, agent guidance, examples, or release scripts:

```bash
pnpm release:check
```

The release check is a lightweight static gate. It does not build the package and does not publish to npm.

It verifies:

- `package.json` `files` matches the intended publish allowlist
- package file candidates do not include forbidden paths such as `src/`, `docs/local/`, `.state.json`, `.local.*`, logs, tarballs, sourcemaps, Storybook output, or generated artifacts
- public English/code files do not contain Han characters
- public files do not contain legacy package naming

## Package Smoke Test

Run the package smoke test before publishing or after changes to package metadata, CLI output, config loading, generated scaffold files, dependency boundaries, or build output:

```bash
pnpm pack:smoke
```

The smoke test creates an npm tarball, installs it into a temporary project, and verifies:

- `import("mdx-artifacts/react")`
- `mdx-artifacts components`
- `mdx-artifacts init`
- `mdx-artifacts validate artifact-docs/examples/hello.mdx`
- `mdx-artifacts build artifact-docs/examples/hello.mdx`
- `mdx-artifacts dev artifact-docs/examples/hello.mdx`
- `mdx-artifacts review validate`
- `mdx-artifacts review add`
- `mdx-artifacts review reply`

It also checks that:

- the tarball does not include `src/`, `docs/local/`, `.state.json`, or `.local.*` files
- the temporary project can install only the `mdx-artifacts` tarball without explicitly adding `react` or `react-dom`
- dev server MDX imports and the generated artifact shell resolve `mdx-artifacts/react` to the same package entry, so comment context is not split by dependency prebundling

This smoke test proves that the published package can be installed, imported, initialized, validated, built, served in dev mode, and used with review-state commands. It does not yet cover a real browser click-through of the review UI or multi-artifact workspaces.

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
- Complex object props have matching registry `types` metadata.

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
- `mdx-artifacts:build`
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
