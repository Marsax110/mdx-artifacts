import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "mdx-artifacts-pack-smoke-"));
const packDir = path.join(tmpRoot, "pack");
const projectDir = path.join(tmpRoot, "project");

await mkdir(packDir, { recursive: true });
await mkdir(projectDir, { recursive: true });

const packOutput = run("npm", ["pack", "--json", "--pack-destination", packDir], repoRoot);
const packResult = parsePackJson(packOutput)[0];
const tarballPath = path.resolve(packDir, packResult.filename);
const packedPaths = packResult.files.map((file) => file.path);

assertPackedPaths(packedPaths);

await writeFile(
  path.join(projectDir, "package.json"),
  `${JSON.stringify({ type: "module", private: true }, null, 2)}\n`,
  "utf8"
);

run("pnpm", ["add", "--offline", tarballPath, "react", "react-dom"], projectDir);
run("node", ["-e", 'import("mdx-artifacts/react").then(() => console.log("import ok"))'], projectDir);
run("pnpm", ["exec", "artifact-kit", "components"], projectDir);
run("pnpm", ["exec", "artifact-kit", "init"], projectDir);
run("pnpm", ["exec", "artifact-kit", "validate", "artifact-docs/examples/hello.mdx"], projectDir);
run("pnpm", ["exec", "artifact-kit", "build", "artifact-docs/examples/hello.mdx"], projectDir);
run("pnpm", ["exec", "artifact-kit", "review", "validate", "artifact-docs/examples/hello.mdx"], projectDir);
const reviewAddOutput = run(
  "pnpm",
  [
    "exec",
    "artifact-kit",
    "review",
    "add",
    "artifact-docs/examples/hello.mdx",
    "--anchor",
    "decision.initialized",
    "--body",
    "Clarify the initialized decision."
  ],
  projectDir
);
const threadId = extractThreadId(reviewAddOutput);
run(
  "pnpm",
  [
    "exec",
    "artifact-kit",
    "review",
    "reply",
    "artifact-docs/examples/hello.mdx",
    "--thread",
    threadId,
    "--body",
    "Updated the initialized decision.",
    "--status",
    "resolved"
  ],
  projectDir
);
run("pnpm", ["exec", "artifact-kit", "review", "validate", "artifact-docs/examples/hello.mdx"], projectDir);

console.log(`pack smoke ok: ${tarballPath}`);

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  });
}

function assertPackedPaths(paths) {
  const forbidden = paths.filter(
    (filePath) =>
      filePath.startsWith("src/") ||
      filePath.startsWith("docs/local/") ||
      filePath.endsWith(".state.json") ||
      filePath.includes(".local.")
  );

  if (forbidden.length > 0) {
    throw new Error(`Unexpected files in npm package:\n${forbidden.map((filePath) => `- ${filePath}`).join("\n")}`);
  }
}

function parsePackJson(output) {
  const start = output.lastIndexOf("\n[");
  const json = output.slice(start >= 0 ? start + 1 : output.indexOf("[")).trim();
  return JSON.parse(json);
}

function extractThreadId(output) {
  const threadId = output.match(/^thread:\s+(.+)$/m)?.[1]?.trim();
  if (!threadId) {
    throw new Error(`Could not find review thread id in output:\n${output}`);
  }

  return threadId;
}
