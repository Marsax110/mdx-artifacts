import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, build as viteBuild } from "vite";
import type { InlineConfig, ViteDevServer } from "vite";
import type { ArtifactKitConfig } from "./types";

const packageCliDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStylesPath = path.resolve(packageCliDir, "../react/styles.css");

export type ArtifactProject = {
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
  const srcDir = path.join(tmpDir, "src");
  const distDir = path.join(tmpDir, "dist");
  const entryPath = path.join(srcDir, "entry.tsx");
  const mdxImport = toRelativeImport(entryPath, mdxPath);
  const styleImports = createStyleImports(projectRoot, entryPath, config);
  const reactEntryImport = toRelativeImport(entryPath, await resolveReactEntryPath());

  await mkdir(srcDir, { recursive: true });
  await writeFile(
    path.join(tmpDir, "index.html"),
    `<!doctype html>
<html lang="zh-CN">
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
import { CommentLayer } from "${reactEntryImport}";
import Doc from "${mdxImport}";
${styleImports}

function App() {
  return (
    <main className="ak-shell">
      <article className="ak-document">
        <CommentLayer>
          <Doc />
        </CommentLayer>
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
    plugins: [react(), mdx(), tailwindcss()],
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
    tmpDir,
    distDir,
    config: viteConfig,
    cleanup: () => rm(tmpDir, { recursive: true, force: true })
  };
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
