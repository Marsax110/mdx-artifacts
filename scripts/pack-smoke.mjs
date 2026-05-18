import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";

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

run("pnpm", ["add", "--offline", tarballPath], projectDir);
run("node", ["-e", 'import("mdx-artifacts/react").then(() => console.log("import ok"))'], projectDir);
run("pnpm", ["exec", "mdx-artifacts", "components"], projectDir);
run("pnpm", ["exec", "mdx-artifacts", "init"], projectDir);
await writeFile(
  path.join(projectDir, "mdx-artifacts.config.mjs"),
  `/** @type {import("mdx-artifacts").MdxArtifactsConfig} */
const config = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: [],
  port: ${4300 + (process.pid % 1000)}
};

export default config;
`,
  "utf8"
);
run("pnpm", ["exec", "mdx-artifacts", "validate", "artifact-docs/examples/hello.mdx"], projectDir);
run("pnpm", ["exec", "mdx-artifacts", "build", "artifact-docs/examples/hello.mdx"], projectDir);
await runDevSmoke(projectDir);
run("pnpm", ["exec", "mdx-artifacts", "review", "validate", "artifact-docs/examples/hello.mdx"], projectDir);
const reviewAddOutput = run(
  "pnpm",
  [
    "exec",
    "mdx-artifacts",
    "review",
    "add",
    "artifact-docs/examples/hello.mdx",
    "--anchor",
    "set.initialized",
    "--body",
    "Clarify the initialized content set."
  ],
  projectDir
);
const threadId = extractThreadId(reviewAddOutput);
run(
  "pnpm",
  [
    "exec",
    "mdx-artifacts",
    "review",
    "reply",
    "artifact-docs/examples/hello.mdx",
    "--thread",
    threadId,
    "--body",
    "Updated the initialized content set.",
    "--status",
    "resolved"
  ],
  projectDir
);
run("pnpm", ["exec", "mdx-artifacts", "review", "validate", "artifact-docs/examples/hello.mdx"], projectDir);

console.log(`pack smoke ok: ${tarballPath}`);

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  });
}

async function runDevSmoke(cwd) {
  const server = spawn("pnpm", ["exec", "mdx-artifacts", "dev", "artifact-docs/examples/hello.mdx"], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    const artifactUrl = await waitForDevServer(server);
    const origin = new URL(artifactUrl).origin;
    const entrySource = await fetchText(new URL("/src/entry.tsx", origin));
    const shellReactImport = entrySource.match(/import \{ ArtifactStateProvider, CommentLayer \} from "([^"]+)"/)?.[1];

    if (!shellReactImport) {
      throw new Error(`Could not find shell react import in dev entry:\n${entrySource}`);
    }

    const mdxImport = entrySource.match(/import Doc from "([^"]+hello\.mdx[^"]*)"/)?.[1];

    if (!mdxImport) {
      throw new Error(`Could not find MDX import in dev entry:\n${entrySource}`);
    }

    const mdxSource = await fetchText(new URL(mdxImport, origin));

    if (entrySource.includes("mdx-artifacts_react") || mdxSource.includes("mdx-artifacts_react")) {
      throw new Error("Dev server prebundled mdx-artifacts/react, which can split comment context.");
    }

    if (!mdxSource.includes(shellReactImport)) {
      throw new Error("Dev server did not resolve MDX imports to the shell mdx-artifacts/react entry.");
    }
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill("SIGINT");
    }
    await waitForExit(server);
  }
}

function waitForDevServer(server) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for mdx-artifacts dev server.\n${output}`));
    }, 15_000);

    const handleChunk = (chunk) => {
      const text = chunk.toString();
      output += text;
      const match = text.match(/dev server ready:\s+(http:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    };

    server.stdout.on("data", handleChunk);
    server.stderr.on("data", handleChunk);
    server.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    server.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timer);
        reject(new Error(`mdx-artifacts dev exited before ready with code ${code}.\n${output}`));
      }
    });
  });
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GET ${url.href} failed with ${response.status}`);
  }

  return response.text();
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    child.on("exit", resolve);
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
