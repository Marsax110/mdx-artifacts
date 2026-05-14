# Artifact Kit Agent Instructions

When creating an interactive report, option comparison, temporary tool, or visual explanation page:

1. Do not generate raw HTML unless explicitly requested.
2. Create `.mdx` files under `artifact-docs/`.
3. Prefer high-level components from `mdx-artifacts/react`.
4. Interactive artifacts must include `ExportPanel` or an equivalent export path.
5. Do not inline bulky data in JSX props. Prefer adjacent `.json` files.
6. Run `artifact-kit components <ComponentName>` when component props are unclear.
7. Run `artifact-kit components --json` when machine-readable component metadata is needed.
8. Run `artifact-kit validate <file.mdx>` before build.
9. Run `artifact-kit build <file.mdx>` to produce standalone HTML.
