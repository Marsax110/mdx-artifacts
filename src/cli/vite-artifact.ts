import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, build as viteBuild } from "vite";
import type { InlineConfig, Plugin, ViteDevServer } from "vite";
import {
  createArtifactMeta,
  createArtifactRoute,
  readArtifactState,
  writeArtifactState,
  type ArtifactRoute
} from "./artifact-state";
import { promoteInteraction, resetInteraction, setInteractionOrder } from "./interactions";
import type { ArtifactKitConfig } from "./types";

const packageCliDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStylesPath = path.resolve(packageCliDir, "../react/styles.css");

export type ArtifactProject = {
  artifact: ArtifactRoute;
  tmpDir: string;
  distDir: string;
  config: InlineConfig;
  cleanup: () => Promise<void>;
};

export async function createArtifactProject(
  projectRoot: string,
  mdxPath: string,
  config: Required<ArtifactKitConfig>
): Promise<ArtifactProject> {
  const tmpDir = path.join(projectRoot, ".artifact-kit", "tmp", randomUUID());
  const artifact = createArtifactRoute(projectRoot, mdxPath, config.docsDir);
  const srcDir = path.join(tmpDir, "src");
  const distDir = path.join(tmpDir, "dist");
  const entryPath = path.join(srcDir, "entry.tsx");
  const mdxImport = toRelativeImport(entryPath, mdxPath);
  const styleImports = createStyleImports(projectRoot, entryPath, config);
  const reactEntryPath = await resolveReactEntryPath();
  const reactEntryImport = toRelativeImport(entryPath, reactEntryPath);
  const reactAliases = resolveReactAliases(projectRoot);

  await mkdir(srcDir, { recursive: true });
  await writeFile(
    path.join(tmpDir, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MDX Artifact</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/entry.tsx"></script>
  </body>
</html>
`
  );
  await writeFile(
    entryPath,
    `import React from "react";
import { createRoot } from "react-dom/client";
import { ArtifactStateProvider, CommentLayer } from "${reactEntryImport}";
import Doc from "${mdxImport}";
${styleImports}

function App() {
  return (
    <main className="ak-shell">
      <article className="ak-document">
        <ArtifactStateProvider>
          <CommentLayer>
            <Doc />
          </CommentLayer>
        </ArtifactStateProvider>
      </article>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
`
  );

  const viteConfig: InlineConfig = {
    root: tmpDir,
    logLevel: "warn",
    plugins: [artifactStatePlugin(projectRoot, artifact), react(), mdx(), tailwindcss()],
    resolve: {
      alias: [
        ...reactAliases,
        { find: /^mdx-artifacts\/react$/, replacement: reactEntryPath },
        { find: /^mdx-artifacts$/, replacement: reactEntryPath }
      ],
      dedupe: ["react", "react-dom"]
    },
    optimizeDeps: {
      exclude: ["mdx-artifacts", "mdx-artifacts/react"]
    },
    server: {
      port: config.port,
      fs: {
        allow: [projectRoot]
      }
    },
    build: {
      outDir: distDir,
      emptyOutDir: true,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rollupOptions: {
        input: path.join(tmpDir, "index.html")
      }
    }
  };

  return {
    artifact,
    tmpDir,
    distDir,
    config: viteConfig,
    cleanup: () => rm(tmpDir, { recursive: true, force: true })
  };
}

function artifactStatePlugin(projectRoot: string, artifact: ArtifactRoute): Plugin {
  return {
    name: "artifact-kit-state",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");

        try {
          if (requestUrl.pathname === "/__artifact/meta") {
            await handleArtifactMeta(projectRoot, artifact, request, response);
            return;
          }

          if (requestUrl.pathname === "/__artifact/state") {
            await handleArtifactState(projectRoot, artifact, request, response);
            return;
          }

          if (requestUrl.pathname.startsWith("/__artifact/interactions/")) {
            await handleArtifactInteraction(projectRoot, artifact, requestUrl.pathname, request, response);
            return;
          }
        } catch (error) {
          sendJson(response, 500, {
            error: error instanceof Error ? error.message : String(error)
          });
          return;
        }

        next();
      });
    }
  };
}

async function handleArtifactMeta(
  projectRoot: string,
  artifact: ArtifactRoute,
  request: IncomingMessage,
  response: ServerResponse
) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  sendJson(response, 200, await createArtifactMeta(projectRoot, artifact));
}

async function handleArtifactState(
  projectRoot: string,
  artifact: ArtifactRoute,
  request: IncomingMessage,
  response: ServerResponse
) {
  if (request.method === "GET") {
    sendJson(response, 200, await readArtifactState(artifact));
    return;
  }

  if (request.method === "POST") {
    let value: unknown;
    try {
      value = JSON.parse(await readRequestBody(request));
    } catch {
      sendJson(response, 400, { error: "Request body must be valid JSON." });
      return;
    }

    const state = await writeArtifactState(projectRoot, artifact, value);
    sendJson(response, 200, { ok: true, state });
    return;
  }

  sendJson(response, 405, { error: "Method not allowed." });
}

async function handleArtifactInteraction(
  projectRoot: string,
  artifact: ArtifactRoute,
  pathname: string,
  request: IncomingMessage,
  response: ServerResponse
) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  let value: unknown;
  try {
    value = JSON.parse(await readRequestBody(request));
  } catch {
    sendJson(response, 400, { error: "Request body must be valid JSON." });
    return;
  }

  try {
    if (pathname === "/__artifact/interactions/set-order") {
      const body = parseSetOrderRequest(value);
      const output = await setInteractionOrder(projectRoot, artifact.sourceRelativePath, body.id, body.orderedIds);
      sendJson(response, 200, { ok: true, output, state: await readArtifactState(artifact) });
      return;
    }

    if (pathname === "/__artifact/interactions/reset") {
      const body = parseInteractionIdRequest(value, "reset");
      const output = await resetInteraction(projectRoot, artifact.sourceRelativePath, body.id);
      sendJson(response, 200, { ok: true, output, state: await readArtifactState(artifact) });
      return;
    }

    if (pathname === "/__artifact/interactions/promote") {
      const body = parseInteractionIdRequest(value, "promote");
      const output = await promoteInteraction(projectRoot, artifact.sourceRelativePath, body.id);
      sendJson(response, 200, { ok: true, output, state: await readArtifactState(artifact) });
      return;
    }
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : String(error) });
    return;
  }

  sendJson(response, 404, { error: "Interaction endpoint not found." });
}

function parseSetOrderRequest(value: unknown) {
  const body = parseInteractionIdRequest(value, "set-order");
  if (!isRecord(value) || !Array.isArray(value.orderedIds)) {
    throw new Error("interactions set-order requires orderedIds.");
  }

  const orderedIds = value.orderedIds.filter((itemId): itemId is string => typeof itemId === "string");
  if (orderedIds.length !== value.orderedIds.length || orderedIds.length === 0) {
    throw new Error("interactions set-order requires non-empty string orderedIds.");
  }

  return {
    id: body.id,
    orderedIds
  };
}

function parseInteractionIdRequest(value: unknown, action: string) {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id) {
    throw new Error(`interactions ${action} requires id.`);
  }

  return {
    id: value.id
  };
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value, null, 2));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolveReactEntryPath() {
  const builtEntryPath = path.resolve(packageCliDir, "../react/index.js");
  const sourceEntryPath = path.resolve(packageCliDir, "../react/index.ts");

  try {
    await access(builtEntryPath);
    return builtEntryPath;
  } catch {
    return sourceEntryPath;
  }
}

function resolveReactAliases(projectRoot: string): Array<{ find: RegExp; replacement: string }> {
  const projectRequire = createRequire(path.join(projectRoot, "package.json"));
  const packageRequire = createRequire(import.meta.url);

  return [
    { find: /^react$/, replacement: resolveFromProjectOrPackage(projectRequire, packageRequire, "react") },
    {
      find: /^react\/jsx-runtime$/,
      replacement: resolveFromProjectOrPackage(projectRequire, packageRequire, "react/jsx-runtime")
    },
    {
      find: /^react\/jsx-dev-runtime$/,
      replacement: resolveFromProjectOrPackage(projectRequire, packageRequire, "react/jsx-dev-runtime")
    },
    { find: /^react-dom$/, replacement: resolveFromProjectOrPackage(projectRequire, packageRequire, "react-dom") },
    {
      find: /^react-dom\/client$/,
      replacement: resolveFromProjectOrPackage(projectRequire, packageRequire, "react-dom/client")
    }
  ];
}

function resolveFromProjectOrPackage(
  projectRequire: NodeJS.Require,
  packageRequire: NodeJS.Require,
  specifier: string
) {
  try {
    return projectRequire.resolve(specifier);
  } catch {
    return packageRequire.resolve(specifier);
  }
}

export async function startDevServer(project: ArtifactProject): Promise<ViteDevServer> {
  const server = await createServer(project.config);
  await server.listen();
  return server;
}

export async function buildArtifact(project: ArtifactProject) {
  await viteBuild(project.config);
  return inlineBuildAssets(project.distDir);
}

async function inlineBuildAssets(distDir: string) {
  const htmlPath = path.join(distDir, "index.html");
  let html = await readFile(htmlPath, "utf8");

  html = await replaceAsync(
    html,
    /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
    async (_match, href: string) => {
      const css = await readFile(assetPath(distDir, href), "utf8");
      return `<style>${css}</style>`;
    }
  );

  html = await replaceAsync(
    html,
    /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
    async (_match, src: string) => {
      const js = await readFile(assetPath(distDir, src), "utf8");
      return `<script type="module">${escapeScriptContent(js)}</script>`;
    }
  );

  return html;
}

function assetPath(distDir: string, value: string) {
  return path.join(distDir, value.replace(/^\//, ""));
}

function toRelativeImport(fromFile: string, targetFile: string) {
  const relative = path.relative(path.dirname(fromFile), targetFile).replaceAll(path.sep, "/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function createStyleImports(projectRoot: string, entryPath: string, config: Required<ArtifactKitConfig>) {
  const styles = [
    ...(config.includeDefaultStyles ? [defaultStylesPath] : []),
    ...config.styles.map((stylePath) => path.resolve(projectRoot, stylePath))
  ];

  return styles.map((stylePath) => `import "${toRelativeImport(entryPath, stylePath)}";`).join("\n");
}

async function replaceAsync(
  source: string,
  pattern: RegExp,
  replacer: (match: string, ...groups: string[]) => Promise<string>
) {
  const matches = Array.from(source.matchAll(pattern));
  let output = source;

  for (const match of matches) {
    const replacement = await replacer(match[0], ...match.slice(1));
    output = output.replace(match[0], () => replacement);
  }

  return output;
}

function escapeScriptContent(source: string) {
  return source.replace(/<\/script/gi, "<\\/script");
}
