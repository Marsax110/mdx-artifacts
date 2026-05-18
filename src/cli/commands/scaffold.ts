import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import { createInterface } from "node:readline/promises";

export type InitAgent = "generic" | "codex" | "claude-code" | "cursor" | "all";

export type InitProjectOptions = {
  agent?: InitAgent;
  docsDir?: string;
  componentsDir?: string;
  yes?: boolean;
};

type InitPromptIo = {
  input: NodeJS.ReadStream;
  output: NodeJS.WriteStream;
};

const defaultDocsDir = "artifact-docs";
const defaultComponentsDir = "artifact-components";

function agentSnippetContent(options: Required<Pick<InitProjectOptions, "docsDir">> & Pick<InitProjectOptions, "componentsDir">) {
  return `# MDX Artifacts Agent Instructions

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should be authored as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Authoring rules:

1. Create .mdx files under ${options.docsDir}/.
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

${projectLocalComponentGuidance(options)}
`;
}

function skillMarkdownContent(options: Required<Pick<InitProjectOptions, "docsDir">> & Pick<InitProjectOptions, "componentsDir">) {
  return `---
name: mdx-artifacts
description: Create, validate, and build Markdown-native MDX artifacts with MDX Artifacts semantic React components, structured diagnostics, and standalone HTML output.
license: MIT
---

# MDX Artifacts Skill

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should remain readable as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Authoring workflow:

1. Create .mdx files under ${options.docsDir}/.
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

Project-local components:

${projectLocalComponentGuidance(options)}
`;
}

function cursorRuleContent(options: Required<Pick<InitProjectOptions, "docsDir">> & Pick<InitProjectOptions, "componentsDir">) {
  return `---
description: Use MDX Artifacts to create Markdown-native MDX artifacts with semantic React components and validation.
alwaysApply: false
---

# MDX Artifacts Rule

Use MDX Artifacts when the user asks for an interactive report, option comparison, review handoff, temporary tool, or visual explanation page that should be authored as Markdown-native MDX.

Do not use MDX Artifacts for ordinary README files, simple notes, raw HTML pages, full web apps, or cases where the user explicitly asks for plain Markdown.

Workflow:

1. Create .mdx files under ${options.docsDir}/.
2. Keep prose in Markdown and use semantic React components as islands.
3. Query component metadata with mdx-artifacts components <ComponentName> instead of guessing props.
4. Use mdx-artifacts components --json when machine-readable metadata is needed.
5. Run mdx-artifacts validate <file.mdx> before build.
6. Use mdx-artifacts validate <file.mdx> --json for structured repair diagnostics.
7. Fix validation errors, review warnings, and validate again.
8. Run mdx-artifacts build <file.mdx> only after validation has been reviewed.

Local resource paths must stay inside the project root. Do not use remote URLs, ~ paths, or project-root escapes for local resources.

${projectLocalComponentGuidance(options)}
`;
}

export async function initProject(projectRoot: string, options: InitProjectOptions = {}) {
  const agent = options.agent ?? "generic";
  const docsDir = validateProjectRelativePath(projectRoot, options.docsDir ?? defaultDocsDir, "docsDir");
  const componentsDir = options.componentsDir
    ? validateProjectRelativePath(projectRoot, options.componentsDir, "componentsDir")
    : undefined;
  const docsExamplesDir = path.join(projectRoot, docsDir, "examples");
  const agentsDir = path.join(projectRoot, "agents");
  const scaffoldOptions = { docsDir, componentsDir };

  await mkdir(docsExamplesDir, { recursive: true });
  await mkdir(agentsDir, { recursive: true });
  if (componentsDir) {
    await mkdir(path.join(projectRoot, componentsDir), { recursive: true });
  }

  await writeFile(
    path.join(projectRoot, "mdx-artifacts.config.mjs"),
    `/** @type {import("mdx-artifacts").MdxArtifactsConfig} */
const config = {
  docsDir: ${JSON.stringify(docsDir)},
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: [],
  tailwindSources: ${formatTailwindSources(componentsDir)}
};

export default config;
`,
    { flag: "wx" }
  ).catch(ignoreExisting);

  await writeFile(
    path.join(agentsDir, "AGENTS.snippet.md"),
    agentSnippetContent(scaffoldOptions),
    { flag: "wx" }
  ).catch(ignoreExisting);

  await writeFile(
    path.join(docsExamplesDir, "hello.mdx"),
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

  await installAgentGuidance(projectRoot, agent, scaffoldOptions);

  console.log("MDX Artifacts initialized.");
}

export async function parseInitOptions(args: string[], io: InitPromptIo = { input: defaultInput, output: defaultOutput }): Promise<InitProjectOptions> {
  const yes = args.includes("--yes");
  const agentValue = readFlagValue(args, "--agent");
  const options: InitProjectOptions = {
    yes,
    agent: agentValue ? parseInitAgent(agentValue) : undefined,
    docsDir: readFlagValue(args, "--docs-dir"),
    componentsDir: readFlagValue(args, "--components-dir")
  };

  if (shouldPromptInitOptions(options, io)) {
    return promptInitOptions(options, io);
  }

  return options;
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

async function installAgentGuidance(
  projectRoot: string,
  agent: InitAgent,
  options: Required<Pick<InitProjectOptions, "docsDir">> & Pick<InitProjectOptions, "componentsDir">
) {
  const targets = agentGuidanceTargets(projectRoot, agent, options);

  for (const target of targets) {
    await mkdir(path.dirname(target.path), { recursive: true });
    await writeFile(target.path, target.content, { flag: "wx" }).catch(ignoreExisting);
  }
}

function agentGuidanceTargets(
  projectRoot: string,
  agent: InitAgent,
  options: Required<Pick<InitProjectOptions, "docsDir">> & Pick<InitProjectOptions, "componentsDir">
) {
  const targets: Array<{ path: string; content: string }> = [];

  if (agent === "codex" || agent === "all") {
    targets.push({
      path: path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"),
      content: skillMarkdownContent(options)
    });
  }

  if (agent === "claude-code" || agent === "all") {
    targets.push({
      path: path.join(projectRoot, ".claude", "skills", "mdx-artifacts", "SKILL.md"),
      content: skillMarkdownContent(options)
    });
  }

  if (agent === "cursor" || agent === "all") {
    targets.push({
      path: path.join(projectRoot, ".cursor", "rules", "mdx-artifacts.mdc"),
      content: cursorRuleContent(options)
    });
  }

  return targets;
}

async function promptInitOptions(options: InitProjectOptions, io: InitPromptIo): Promise<InitProjectOptions> {
  const rl = createInterface({ input: io.input, output: io.output });
  try {
    const docsDir = options.docsDir ?? await askWithDefault(rl, "Docs directory?", defaultDocsDir);
    const useComponents = options.componentsDir ? true : await askYesNo(rl, "Use project-local components?", false);
    const componentsDir = options.componentsDir ?? (useComponents ? await askWithDefault(rl, "Component source directory?", defaultComponentsDir) : undefined);
    const agent = options.agent ?? parseInitAgent(await askWithDefault(rl, "Install agent guidance?", "generic"));
    return { ...options, docsDir, componentsDir, agent };
  } finally {
    rl.close();
  }
}

async function askWithDefault(rl: ReturnType<typeof createInterface>, question: string, defaultValue: string) {
  const answer = (await rl.question(`${question} (${defaultValue}) `)).trim();
  return answer || defaultValue;
}

async function askYesNo(rl: ReturnType<typeof createInterface>, question: string, defaultValue: boolean) {
  const suffix = defaultValue ? "Y/n" : "y/N";
  const answer = (await rl.question(`${question} (${suffix}) `)).trim().toLowerCase();
  if (!answer) {
    return defaultValue;
  }
  return answer === "y" || answer === "yes";
}

function shouldPromptInitOptions(options: InitProjectOptions, io: InitPromptIo) {
  return !options.yes && io.input.isTTY === true && io.output.isTTY === true;
}

function readFlagValue(args: string[], flag: string) {
  const inline = args.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) {
    return inline.slice(flag.length + 1);
  }

  const index = args.indexOf(flag);
  if (index < 0) {
    return undefined;
  }

  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`mdx-artifacts init ${flag} requires a value.`);
  }

  return value;
}

function validateProjectRelativePath(projectRoot: string, value: string, fieldName: string) {
  const normalized = value.trim().replace(/\\/g, "/").replace(/\/+$/g, "");
  if (!normalized) {
    throw new Error(`${fieldName} must not be empty.`);
  }
  if (path.isAbsolute(normalized) || normalized === "~" || normalized.startsWith("~/") || isUrlLike(normalized)) {
    throw new Error(`${fieldName} must be a project-relative path.`);
  }

  const resolved = path.resolve(projectRoot, normalized);
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${fieldName} must stay inside the project root.`);
  }

  return normalized;
}

function isUrlLike(value: string) {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value) || /^(data|blob):/.test(value) || value.startsWith("//");
}

function formatTailwindSources(componentsDir: string | undefined) {
  if (!componentsDir) {
    return "[]";
  }

  return `[\n    ${JSON.stringify(`${componentsDir}/**/*.{ts,tsx}`)}\n  ]`;
}

function projectLocalComponentGuidance(options: Pick<InitProjectOptions, "componentsDir">) {
  if (!options.componentsDir) {
    return "If this project later adds project-local components, choose a stable project-local component source directory and include it in tailwindSources when those files use Tailwind classes.";
  }

  return `Project-local component source may live under ${options.componentsDir}/. This is a source location for user-owned React components, not automatic component registration. If those files use Tailwind classes, keep ${options.componentsDir}/**/*.{ts,tsx} in tailwindSources.`;
}

function ignoreExisting(error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
    throw error;
  }
}
