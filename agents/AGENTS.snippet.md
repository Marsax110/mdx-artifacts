# MDX Artifacts Agent Instructions

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should be authored as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Authoring rules:

1. Create `.mdx` files under the configured `docsDir`. If no config exists, use `artifact-docs/`.
2. Keep prose in Markdown and use semantic React components as islands.
3. Prefer high-level components from `mdx-artifacts/react`.
4. Prefer MDX children for human-readable body content when a component supports it.
5. Use props for stable ids, short labels, variants, layout controls, export values, and structured data.
6. Do not inline bulky data in JSX props. Prefer adjacent local files when the project supports them.
7. Local resource paths must stay inside the project root. Do not use remote URLs, `~` paths, or project-root escapes.
8. Interactive artifacts must include `ExportPanel` or an equivalent export path.
9. Run `mdx-artifacts components <ComponentName>` when component props are unclear.
10. Run `mdx-artifacts components --json` when machine-readable component metadata is needed.
11. Run `mdx-artifacts validate <file.mdx>` before build.
12. Run `mdx-artifacts validate <file.mdx> --json` when structured diagnostics are useful for repairs.
13. If validation reports diagnostics, fix errors first, review warnings, and validate again.
14. Run `mdx-artifacts build <file.mdx>` to produce standalone HTML.

For project-local components, choose a stable project-local component source directory and include it in `tailwindSources` when those files use Tailwind classes. This directory is a source location for user-owned React components, not automatic component registration.
