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
      styles: []
    });
    projects.push(project);

    const entry = await readFile(path.join(project.tmpDir, "src", "entry.tsx"), "utf8");

    expect(project.artifact.routePath).toBe("/artifacts/entry");
    expect(project.artifact.statePath).toBe(mdxPath.replace(/\.mdx$/, ".state.json"));
    expect(entry).toContain('import { ArtifactStateProvider, CommentLayer } from "');
    expect(entry).toContain('src/react/index.ts";');
    expect(entry).toContain("<ArtifactStateProvider>");
    expect(entry).toContain("<CommentLayer>");
    expect(entry).toContain("<Doc />");
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
      styles: []
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
  });
});

function postJson(baseUrl: string, pathname: string, value: unknown) {
  return fetch(new URL(pathname, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value)
  });
}
