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
  question?: (query: string) => Promise<string>;
};

type PromptQuestion = (query: string) => Promise<string>;

type PromptChoice = {
  value: string;
  label: string;
  aliases?: string[];
  description?: string;
};

type PromptStyle = {
  heading: (value: string) => string;
  muted: (value: string) => string;
  option: (value: string) => string;
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

  console.log(formatInitSummary({ agent, docsDir, componentsDir }));
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
  const rl = io.question ? undefined : createInterface({ input: io.input, output: io.output });
  const question = io.question ?? ((query: string) => rl?.question(query) ?? Promise.resolve(""));
  const style = createPromptStyle(io.output.isTTY === true && !io.question);
  try {
    const docsDir = options.docsDir ?? await askPathChoice(question, {
      title: "Where should MDX artifact source files live?",
      defaultPath: defaultDocsDir,
      customQuestion: "Custom MDX artifact source directory:",
      style
    });
    const useComponents = options.componentsDir
      ? true
      : await askChoice(question, {
        title: "Use project-local React components?",
        description: "Adds a Tailwind source directory; it does not auto-register components.",
        defaultIndex: 0,
        choices: [
          { value: "no", label: "No", aliases: ["n"] },
          { value: "yes", label: "Yes, choose a project-local component source directory", aliases: ["y"] }
        ],
        style
      }) === "yes";
    const componentsDir = options.componentsDir
      ?? (useComponents
        ? await askPathChoice(question, {
          title: "Where should project-local component source files live?",
          defaultPath: defaultComponentsDir,
          customQuestion: "Custom project-local component source directory:",
          style
        })
        : undefined);
    const agent = options.agent
      ?? parseInitAgent(await askChoice(question, {
        title: "Install agent guidance for which tool?",
        defaultIndex: 0,
        choices: [
          { value: "generic", label: "generic" },
          { value: "codex", label: "codex" },
          { value: "claude-code", label: "claude-code", aliases: ["claude_code"] },
          { value: "cursor", label: "cursor" },
          { value: "all", label: "all" }
        ],
        style
      }));
    return { ...options, docsDir, componentsDir, agent };
  } finally {
    rl?.close();
  }
}

async function askPathChoice(
  question: PromptQuestion,
  options: { title: string; defaultPath: string; customQuestion: string; style: PromptStyle }
) {
  const selected = await askChoice(question, {
    title: options.title,
    defaultIndex: 0,
    choices: [
      { value: "default", label: formatPromptPath(options.defaultPath) },
      { value: "custom", label: "Enter a custom directory" }
    ],
    style: options.style
  });

  if (selected === "default") {
    return options.defaultPath;
  }

  return askText(question, options.customQuestion, options.style);
}

async function askChoice(
  question: PromptQuestion,
  options: { title: string; description?: string; defaultIndex: number; choices: PromptChoice[]; style: PromptStyle }
) {
  const prompt = formatChoicePrompt(options);
  const answer = (await question(prompt)).trim();
  if (!answer) {
    return options.choices[options.defaultIndex]?.value ?? "";
  }

  const selectedIndex = Number.parseInt(answer, 10);
  if (Number.isInteger(selectedIndex) && String(selectedIndex) === answer && selectedIndex >= 1 && selectedIndex <= options.choices.length) {
    return options.choices[selectedIndex - 1].value;
  }

  const normalized = answer.toLowerCase();
  const direct = options.choices.find((choice) => {
    const aliases = choice.aliases ?? [];
    return choice.value.toLowerCase() === normalized || choice.label.toLowerCase() === normalized || aliases.includes(normalized);
  });
  if (direct) {
    return direct.value;
  }

  throw new Error(`Unsupported selection: ${answer}. Use 1-${options.choices.length}.`);
}

async function askText(question: PromptQuestion, title: string, style: PromptStyle) {
  const answer = (await question(`${style.heading(title)} `)).trim();
  if (!answer) {
    throw new Error(`${title} requires a value.`);
  }
  return answer;
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

function formatChoicePrompt(options: { title: string; description?: string; defaultIndex: number; choices: PromptChoice[]; style: PromptStyle }) {
  const lines = [
    "",
    options.style.heading(options.title),
    options.description ? `  ${options.style.muted(options.description)}` : undefined,
    ...options.choices.map((choice, index) => {
      const defaultLabel = index === options.defaultIndex ? options.style.muted(" (default)") : "";
      const description = choice.description ? options.style.muted(` - ${choice.description}`) : "";
      return `  ${options.style.option(String(index + 1))}. ${choice.label}${defaultLabel}${description}`;
    }),
    `Select an option (${options.defaultIndex + 1}) `
  ];

  return lines.filter((line): line is string => line !== undefined).join("\n");
}

function formatPromptPath(value: string) {
  return `./${value.replace(/^\.?\//, "").replace(/\/+$/g, "")}/`;
}

function createPromptStyle(useColor: boolean): PromptStyle {
  if (!useColor || process.env.NO_COLOR) {
    return {
      heading: identity,
      muted: identity,
      option: identity
    };
  }

  return {
    heading: (value) => `\x1b[1m${value}\x1b[22m`,
    muted: (value) => `\x1b[2m${value}\x1b[22m`,
    option: (value) => `\x1b[36m${value}\x1b[39m`
  };
}

function identity(value: string) {
  return value;
}

function formatInitSummary(options: Required<Pick<InitProjectOptions, "agent" | "docsDir">> & Pick<InitProjectOptions, "componentsDir">) {
  const examplePath = `${options.docsDir}/examples/hello.mdx`;
  const files = [
    "  config: mdx-artifacts.config.mjs",
    `  example: ${examplePath}`,
    "  agent snippet: agents/AGENTS.snippet.md",
    ...agentGuidanceSummaryFiles(options.agent),
    ...(options.componentsDir ? [`  component source: ${options.componentsDir}/`] : [])
  ];

  return [
    "MDX Artifacts initialized.",
    "",
    "Summary:",
    `  docsDir: ${options.docsDir}`,
    `  componentsDir: ${options.componentsDir ?? "none"}`,
    `  agent: ${options.agent}`,
    "",
    "Files:",
    ...files,
    "",
    "Next steps:",
    `  mdx-artifacts validate ${examplePath}`,
    `  mdx-artifacts build ${examplePath}`
  ].join("\n");
}

function agentGuidanceSummaryFiles(agent: InitAgent) {
  const files: string[] = [];
  if (agent === "codex" || agent === "all") {
    files.push("  Codex skill: .agents/skills/mdx-artifacts/SKILL.md");
  }
  if (agent === "claude-code" || agent === "all") {
    files.push("  Claude Code skill: .claude/skills/mdx-artifacts/SKILL.md");
  }
  if (agent === "cursor" || agent === "all") {
    files.push("  Cursor rule: .cursor/rules/mdx-artifacts.mdc");
  }
  return files;
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
