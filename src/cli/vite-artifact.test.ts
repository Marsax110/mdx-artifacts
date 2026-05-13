import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createArtifactProject, type ArtifactProject } from "./vite-artifact";

const projects: ArtifactProject[] = [];

afterEach(async () => {
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

    expect(entry).toContain('import { CommentLayer } from "');
    expect(entry).toContain('src/react/index.ts";');
    expect(entry).toContain("<CommentLayer>");
    expect(entry).toContain("<Doc />");
  });
});
