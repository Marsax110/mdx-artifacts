import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type InitAgent = "generic" | "codex" | "claude-code" | "cursor" | "all";

export type InitProjectOptions = {
  agent?: InitAgent;
};

const agentSnippet = `# MDX Artifacts Agent Instructions

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should be authored as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Authoring rules:

1. Create .mdx files under artifact-docs/.
2. Keep prose in Markdown and use semantic React components as islands.
3. Prefer high-level components from mdx-artifacts/react.
4. Prefer MDX children for human-readable body content when a component supports it.
5. Use props for stable ids, short labels, variants, layout controls, export values, and structured data.
6. Do not inline bulky data in JSX props. Prefer adjacent local files when the project supports them.
7. Local resource paths must stay inside the project root. Do not use remote URLs, ~ paths, or project-root escapes.
8. Interactive artifacts must include ExportPanel or an equivalent export path.
9. Run mdx-artifacts components <ComponentName> when component props are unclear.
10. Run mdx-artifacts components --json when machine-readable component metadata is needed.
11. Run mdx-artifacts validate <file.mdx> before build.
12. Run mdx-artifacts validate <file.mdx> --json when structured diagnostics are useful for repairs.
13. If validation reports diagnostics, fix errors first, review warnings, and validate again.
14. Run mdx-artifacts build <file.mdx> to produce standalone HTML.
`;

const skillMarkdown = `---
name: mdx-artifacts
description: Create, validate, and build Markdown-native MDX artifacts with MDX Artifacts semantic React components, structured diagnostics, and standalone HTML output.
license: MIT
---

# MDX Artifacts Skill

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should remain readable as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Authoring workflow:

1. Create .mdx files under artifact-docs/.
2. Keep narrative prose in Markdown.
3. Use semantic components from mdx-artifacts/react for workflow UI.
4. Import only the components the artifact uses.
5. Prefer MDX children for readable body content.
6. Use stable id props on reviewable or stateful components.
7. Include ExportPanel or an equivalent export path for interactive artifacts.
8. Keep local resource paths inside the project root.
9. Do not use remote URLs, ~ paths, or project-root escapes for local resources.

Component discovery:

- Run mdx-artifacts components to list available components.
- Run mdx-artifacts components <ComponentName> when props are unclear.
- Run mdx-artifacts components --json when machine-readable metadata is needed.
- Do not copy component metadata into this skill. The CLI registry is the source of truth.

Validation and repair loop:

- Run mdx-artifacts validate <file.mdx> before build.
- Run mdx-artifacts validate <file.mdx> --json when structured diagnostics are useful.
- Use diagnostic code, suggestion, componentName, propName, and example fields to repair the MDX.
- Re-run validation after each repair pass.
- Treat errors as blockers. Review warnings before calling the artifact complete.

Build:

- Run mdx-artifacts build <file.mdx> to produce standalone HTML.
- Do not call build until validation has been reviewed.
`;

const cursorRule = `---
description: Use MDX Artifacts to create Markdown-native MDX artifacts with semantic React components and validation.
alwaysApply: false
---

# MDX Artifacts Rule

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should be authored as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Workflow:

1. Create .mdx files under artifact-docs/.
2. Keep prose in Markdown and use semantic React components as islands.
3. Query component metadata with mdx-artifacts components <ComponentName> instead of guessing props.
4. Use mdx-artifacts components --json when machine-readable metadata is needed.
5. Run mdx-artifacts validate <file.mdx> before build.
6. Use mdx-artifacts validate <file.mdx> --json for structured repair diagnostics.
7. Fix validation errors, review warnings, and validate again.
8. Run mdx-artifacts build <file.mdx> only after validation has been reviewed.

Local resource paths must stay inside the project root. Do not use remote URLs, ~ paths, or project-root escapes for local resources.
`;

export async function initProject(projectRoot: string, options: InitProjectOptions = {}) {
  const agent = options.agent ?? "generic";
  const docsDir = path.join(projectRoot, "artifact-docs", "examples");
  const agentsDir = path.join(projectRoot, "agents");

  await mkdir(docsDir, { recursive: true });
  await mkdir(agentsDir, { recursive: true });

  await writeFile(
    path.join(projectRoot, "mdx-artifacts.config.mjs"),
    `/** @type {import("mdx-artifacts").MdxArtifactsConfig} */
const config = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: [],
  tailwindSources: []
};

export default config;
`,
    { flag: "wx" }
  ).catch(ignoreExisting);

  await writeFile(
    path.join(agentsDir, "AGENTS.snippet.md"),
    agentSnippet,
    { flag: "wx" }
  ).catch(ignoreExisting);

  await writeFile(
    path.join(docsDir, "hello.mdx"),
    `import { ContentSet, ExportPanel } from "mdx-artifacts/react";

# Hello Artifact

<ContentSet
  id="set.initialized"
  title="Has MDX Artifacts been initialized?"
  columns={2}
>
  <ContentSet.Item
    id="initialized"
    title="Initialized"
    badge="Ready"
    tone="positive"
    emphasis="primary"
    summary="Ready to continue generating artifacts."
  >
    - MDX source exists
    - Export panel exists
    - Real content still needs to be added
  </ContentSet.Item>
</ContentSet>

<ExportPanel
  value={{
    recommendation: "Continue generating interactive HTML artifacts with MDX and high-level components"
  }}
/>
`,
    { flag: "wx" }
  ).catch(ignoreExisting);

  await installAgentGuidance(projectRoot, agent);

  console.log("MDX Artifacts initialized.");
}

export function parseInitAgent(value: string | undefined): InitAgent {
  if (!value) {
    return "generic";
  }

  const agent = value.toLowerCase().trim().replace(/[\s_]+/g, "-");
  if (agent === "generic" || agent === "codex" || agent === "claude-code" || agent === "cursor" || agent === "all") {
    return agent;
  }

  throw new Error(`Unsupported init agent: ${value}. Use generic, codex, claude-code, cursor, or all.`);
}

async function installAgentGuidance(projectRoot: string, agent: InitAgent) {
  const targets = agentGuidanceTargets(projectRoot, agent);

  for (const target of targets) {
    await mkdir(path.dirname(target.path), { recursive: true });
    await writeFile(target.path, target.content, { flag: "wx" }).catch(ignoreExisting);
  }
}

function agentGuidanceTargets(projectRoot: string, agent: InitAgent) {
  const targets: Array<{ path: string; content: string }> = [];

  if (agent === "codex" || agent === "all") {
    targets.push({
      path: path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"),
      content: skillMarkdown
    });
  }

  if (agent === "claude-code" || agent === "all") {
    targets.push({
      path: path.join(projectRoot, ".claude", "skills", "mdx-artifacts", "SKILL.md"),
      content: skillMarkdown
    });
  }

  if (agent === "cursor" || agent === "all") {
    targets.push({
      path: path.join(projectRoot, ".cursor", "rules", "mdx-artifacts.mdc"),
      content: cursorRule
    });
  }

  return targets;
}

function ignoreExisting(error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
    throw error;
  }
}
