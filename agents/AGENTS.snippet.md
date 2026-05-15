# Artifact Kit Agent Instructions

When creating an interactive report, option comparison, temporary tool, or visual explanation page:

1. Do not generate raw HTML unless explicitly requested.
2. Create `.mdx` files under `artifact-docs/`.
3. Keep sources Markdown-native: prose in Markdown, semantic islands in components.
4. Prefer high-level components from `mdx-artifacts/react`.
5. Prefer MDX children for human-readable body content when a component supports it.
6. Use props for stable ids, short labels, variants, layout controls, export values, and structured data.
7. Do not inline bulky data in JSX props. Prefer adjacent `.json` files.
8. Interactive artifacts must include `ExportPanel` or an equivalent export path.
9. Run `artifact-kit components <ComponentName>` when component props are unclear.
10. Run `artifact-kit components --json` when machine-readable component metadata is needed.
11. Run `artifact-kit validate <file.mdx>` before build.
12. Run `artifact-kit build <file.mdx>` to produce standalone HTML.
