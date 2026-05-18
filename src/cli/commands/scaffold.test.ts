import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { initProject, parseInitAgent, parseInitOptions } from "./scaffold";

const execFileAsync = promisify(execFile);
const cli = path.resolve("src/cli/index.ts");
const tsx = path.resolve("node_modules/.bin/tsx");

describe("initProject", () => {
  it("keeps the default generic scaffold small", async () => {
    const projectRoot = await createTempProject();

    await initProject(projectRoot);

    await expect(pathExists(path.join(projectRoot, "mdx-artifacts.config.mjs"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, "artifact-docs", "examples", "hello.mdx"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, "agents", "AGENTS.snippet.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"))).resolves.toBe(false);
    await expect(pathExists(path.join(projectRoot, ".claude", "skills", "mdx-artifacts", "SKILL.md"))).resolves.toBe(false);
    await expect(pathExists(path.join(projectRoot, ".cursor", "rules", "mdx-artifacts.mdc"))).resolves.toBe(false);
  });

  it("installs Codex project skill guidance", async () => {
    const projectRoot = await createTempProject();

    await initProject(projectRoot, { agent: "codex" });

    const skill = await readFile(path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"), "utf8");
    expect(skill).toContain("name: mdx-artifacts");
    expect(skill).toContain("mdx-artifacts validate <file.mdx> --json");
    expect(skill).toContain("The CLI registry is the source of truth.");
    expect(skill).toContain("Create .mdx files under artifact-docs/.");
  });

  it("uses configured docs and component source directories", async () => {
    const projectRoot = await createTempProject();

    await initProject(projectRoot, {
      docsDir: "docs/artifacts",
      componentsDir: "artifact-components",
      agent: "codex"
    });

    const config = await readFile(path.join(projectRoot, "mdx-artifacts.config.mjs"), "utf8");
    const snippet = await readFile(path.join(projectRoot, "agents", "AGENTS.snippet.md"), "utf8");
    const skill = await readFile(path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"), "utf8");

    expect(config).toContain('docsDir: "docs/artifacts"');
    expect(config).toContain('"artifact-components/**/*.{ts,tsx}"');
    await expect(pathExists(path.join(projectRoot, "docs", "artifacts", "examples", "hello.mdx"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, "artifact-components"))).resolves.toBe(true);
    expect(snippet).toContain("Create .mdx files under docs/artifacts/.");
    expect(snippet).toContain("Project-local component source may live under artifact-components/.");
    expect(skill).toContain("not automatic component registration");
  });

  it("installs Claude Code project skill guidance", async () => {
    const projectRoot = await createTempProject();

    await initProject(projectRoot, { agent: "claude-code" });

    const skill = await readFile(path.join(projectRoot, ".claude", "skills", "mdx-artifacts", "SKILL.md"), "utf8");
    expect(skill).toContain("name: mdx-artifacts");
    expect(skill).toContain("Component discovery:");
  });

  it("installs Cursor project rule guidance", async () => {
    const projectRoot = await createTempProject();

    await initProject(projectRoot, { agent: "cursor" });

    const rule = await readFile(path.join(projectRoot, ".cursor", "rules", "mdx-artifacts.mdc"), "utf8");
    expect(rule).toContain("description: Use MDX Artifacts");
    expect(rule).toContain("alwaysApply: false");
    expect(rule).toContain("mdx-artifacts components <ComponentName>");
  });

  it("installs all project agent guidance", async () => {
    const projectRoot = await createTempProject();

    await initProject(projectRoot, { agent: "all" });

    await expect(pathExists(path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, ".claude", "skills", "mdx-artifacts", "SKILL.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, ".cursor", "rules", "mdx-artifacts.mdc"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, "agents", "AGENTS.snippet.md"))).resolves.toBe(true);
  });

  it("does not overwrite existing user files", async () => {
    const projectRoot = await createTempProject();
    const skillPath = path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md");
    await writeFileWithParents(skillPath, "custom skill");

    await initProject(projectRoot, { agent: "codex" });

    await expect(readFile(skillPath, "utf8")).resolves.toBe("custom skill");
  });

  it("supports --agent through the CLI entrypoint", async () => {
    const projectRoot = await createTempProject();

    await execFileAsync(tsx, [cli, "init", "--agent", "all", "--docs-dir", "docs/reports", "--components-dir", "ui/artifacts"], { cwd: projectRoot });

    await expect(pathExists(path.join(projectRoot, ".agents", "skills", "mdx-artifacts", "SKILL.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, ".claude", "skills", "mdx-artifacts", "SKILL.md"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, ".cursor", "rules", "mdx-artifacts.mdc"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, "docs", "reports", "examples", "hello.mdx"))).resolves.toBe(true);
    await expect(pathExists(path.join(projectRoot, "ui", "artifacts"))).resolves.toBe(true);
  });
});

describe("parseInitAgent", () => {
  it("parses supported agent names", () => {
    expect(parseInitAgent(undefined)).toBe("generic");
    expect(parseInitAgent("codex")).toBe("codex");
    expect(parseInitAgent("claude_code")).toBe("claude-code");
    expect(parseInitAgent("cursor")).toBe("cursor");
    expect(parseInitAgent("all")).toBe("all");
  });

  it("rejects unsupported agent names", () => {
    expect(() => parseInitAgent("unknown")).toThrow("Unsupported init agent");
  });
});

describe("parseInitOptions", () => {
  it("parses non-interactive init flags", async () => {
    await expect(
      parseInitOptions(["--yes", "--agent", "cursor", "--docs-dir", "docs/reports", "--components-dir=ui/artifacts"])
    ).resolves.toEqual({
      yes: true,
      agent: "cursor",
      docsDir: "docs/reports",
      componentsDir: "ui/artifacts"
    });
  });

  it("rejects flags without values", async () => {
    await expect(parseInitOptions(["--docs-dir"])).rejects.toThrow("requires a value");
  });

  it("prompts for interactive defaults when attached to a TTY", async () => {
    const io = createPromptIo(["", "", "codex"]);

    await expect(parseInitOptions([], io)).resolves.toEqual({
      yes: false,
      agent: "codex",
      docsDir: "artifact-docs",
      componentsDir: undefined
    });
  });

  it("prompts for project-local component source directory when enabled", async () => {
    const io = createPromptIo(["docs/reports", "y", "ui/artifacts", "all"]);

    await expect(parseInitOptions([], io)).resolves.toEqual({
      yes: false,
      agent: "all",
      docsDir: "docs/reports",
      componentsDir: "ui/artifacts"
    });
  });

  it("does not re-prompt for init options already passed as flags", async () => {
    const io = createPromptIo(["y", "artifact-components", "cursor"]);

    await expect(parseInitOptions(["--docs-dir", "docs/reports"], io)).resolves.toEqual({
      yes: false,
      agent: "cursor",
      docsDir: "docs/reports",
      componentsDir: "artifact-components"
    });
  });
});

async function createTempProject() {
  return mkdtemp(path.join(tmpdir(), "mdx-artifacts-init-"));
}

async function pathExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeFileWithParents(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

function createPromptIo(answers: string[]) {
  const input = new PassThrough() as unknown as NodeJS.ReadStream;
  const output = new PassThrough() as unknown as NodeJS.WriteStream;
  input.isTTY = true;
  output.isTTY = true;
  const pending = [...answers];
  return {
    input,
    output,
    question: async () => {
      const answer = pending.shift();
      if (answer === undefined) {
        throw new Error("Missing prompt answer in test.");
      }
      return answer;
    }
  };
}
