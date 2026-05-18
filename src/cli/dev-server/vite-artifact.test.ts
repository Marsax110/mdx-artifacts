import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ViteDevServer } from "vite";
import { createArtifactProject, startDevServer, type ArtifactProject } from "./vite-artifact";

const projects: ArtifactProject[] = [];
const servers: ViteDevServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(projects.splice(0).map((project) => project.cleanup()));
});

describe("createArtifactProject", () => {
  it("wraps rendered MDX with the comment layer", async () => {
    const projectRoot = process.cwd();
    const tempDir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-entry-"));
    const mdxPath = path.join(tempDir, "entry.mdx");
    await writeFile(mdxPath, "# Reviewable artifact", "utf8");

    const project = await createArtifactProject(projectRoot, mdxPath, {
      docsDir: "artifact-docs",
      includeDefaultStyles: true,
      outDir: "dist/artifacts",
      port: 4321,
      styles: [],
      tailwindSources: []
    });
    projects.push(project);

    const entry = await readFile(path.join(project.tmpDir, "src", "entry.tsx"), "utf8");
    const tailwindSources = await readFile(path.join(project.tmpDir, "src", "artifact-tailwind-sources.css"), "utf8");

    expect(project.artifact.routePath).toBe("/artifacts/entry");
    expect(project.artifact.statePath).toBe(mdxPath.replace(/\.mdx$/, ".state.json"));
    expect(tailwindSources).toContain('@import "tailwindcss";');
    expect(tailwindSources).toContain('@source "../../../');
    expect(tailwindSources).toContain('entry.mdx";');
    expect(entry).toContain('import { ArtifactStateProvider, CommentLayer, artifactMdxComponents } from "');
    expect(entry).toContain('src/react/index.ts";');
    expect(entry).toContain('import "./artifact-tailwind-sources.css";');
    expect(entry).toContain("<ArtifactStateProvider>");
    expect(entry).toContain("<CommentLayer>");
    expect(entry).toContain("<Doc components={artifactMdxComponents} />");
  });

  it("registers configured Tailwind source globs relative to the project root", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-tailwind-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "entry.mdx");
    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, "# Tailwind sources", "utf8");

    const project = await createArtifactProject(projectRoot, mdxPath, {
      docsDir: "artifact-docs",
      includeDefaultStyles: true,
      outDir: "dist/artifacts",
      port: 4321,
      styles: [],
      tailwindSources: ["artifact-components/**/*.{ts,tsx}"]
    });
    projects.push(project);

    const tailwindSources = await readFile(path.join(project.tmpDir, "src", "artifact-tailwind-sources.css"), "utf8");

    expect(tailwindSources).toContain('entry.mdx";');
    expect(tailwindSources).toContain('artifact-components/**/*.{ts,tsx}";');
  });

  it("serves narrow interaction state endpoints", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-server-"));
    const docsDir = path.join(projectRoot, "artifact-docs", "examples");
    const mdxPath = path.join(docsDir, "priorities.mdx");
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(projectRoot, "package.json"), `{"type":"module"}`, "utf8");
    await writeFile(
      mdxPath,
      `import { SortableList } from "mdx-artifacts/react";

<SortableList
  id="list.priorities"
  title="Priorities"
  items={[
    { id: "api", title: "Stabilize API" },
    { id: "docs", title: "Update docs" }
  ]}
/>`,
      "utf8"
    );

    const project = await createArtifactProject(projectRoot, mdxPath, {
      docsDir: "artifact-docs",
      includeDefaultStyles: true,
      outDir: "dist/artifacts",
      port: 0,
      styles: [],
      tailwindSources: []
    });
    projects.push(project);
    const server = await startDevServer(project);
    servers.push(server);
    const baseUrl = server.resolvedUrls?.local[0] ?? "http://localhost:4321/";

    const setOrder = await postJson(baseUrl, "/__artifact/interactions/set-order", {
      id: "list.priorities",
      orderedIds: ["docs", "api"]
    });
    expect(setOrder.status).toBe(200);
    expect(await setOrder.json()).toMatchObject({
      ok: true,
      result: {
        action: "set-order",
        component: "list.priorities"
      },
      state: {
        interactions: {
          "list.priorities": {
            orderedIds: ["docs", "api"]
          }
        }
      }
    });

    const badOrder = await postJson(baseUrl, "/__artifact/interactions/set-order", {
      id: "list.priorities",
      orderedIds: ["docs", "missing"]
    });
    expect(badOrder.status).toBe(400);

    const promote = await postJson(baseUrl, "/__artifact/interactions/promote", {
      id: "list.priorities"
    });
    expect(promote.status).toBe(200);
    expect(await promote.json()).toMatchObject({
      ok: true,
      state: {
        interactions: {}
      }
    });

    const source = await readFile(mdxPath, "utf8");
    expect(source.indexOf(`id: "docs"`)).toBeLessThan(source.indexOf(`id: "api"`));

    const reset = await postJson(baseUrl, "/__artifact/interactions/reset", {
      id: "list.priorities"
    });
    expect(reset.status).toBe(200);

    const addItem = await postJson(baseUrl, "/__artifact/interactions/add-item", {
      id: "list.priorities",
      item: {
        id: "adapter",
        title: "Adapter design",
        tags: ["adapter"]
      }
    });
    expect(addItem.status).toBe(200);
    expect(await addItem.json()).toMatchObject({ ok: true });

    const updateItem = await postJson(baseUrl, "/__artifact/interactions/update-item", {
      id: "list.priorities",
      itemId: "adapter",
      patch: {
        summary: "Patch through server"
      }
    });
    expect(updateItem.status).toBe(200);

    const removeItem = await postJson(baseUrl, "/__artifact/interactions/remove-item", {
      id: "list.priorities",
      itemId: "api"
    });
    expect(removeItem.status).toBe(200);

    const nextSource = await readFile(mdxPath, "utf8");
    expect(nextSource).toContain(`id: "adapter"`);
    expect(nextSource).toContain(`summary: "Patch through server"`);
    expect(nextSource).not.toContain(`id: "api"`);
  });
});

function postJson(baseUrl: string, pathname: string, value: unknown) {
  return fetch(new URL(pathname, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value)
  });
}
