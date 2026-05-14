import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createArtifactMeta,
  createArtifactRoute,
  readArtifactState,
  writeArtifactState
} from "./artifact-state";

describe("artifact state", () => {
  it("places the state file next to the MDX source", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-state-"));
    const mdxPath = path.join(projectRoot, "artifact-docs", "examples", "auth-strategy.mdx");
    const artifact = createArtifactRoute(projectRoot, mdxPath, "artifact-docs");

    expect(artifact.routePath).toBe("/artifacts/examples/auth-strategy");
    expect(artifact.sourceRelativePath).toBe("artifact-docs/examples/auth-strategy.mdx");
    expect(artifact.stateRelativePath).toBe("artifact-docs/examples/auth-strategy.state.json");
    expect(artifact.statePath).toBe(path.join(projectRoot, "artifact-docs", "examples", "auth-strategy.state.json"));
  });

  it("returns an empty state when no sidecar exists", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-state-"));
    const mdxPath = path.join(projectRoot, "artifact-docs", "auth-strategy.mdx");
    const artifact = createArtifactRoute(projectRoot, mdxPath, "artifact-docs");

    await expect(readArtifactState(artifact)).resolves.toEqual({
      version: 1,
      source: "artifact-docs/auth-strategy.mdx",
      threads: [],
      interactions: {}
    });

    await expect(createArtifactMeta(projectRoot, artifact)).resolves.toMatchObject({
      routePath: "/artifacts/auth-strategy",
      sourcePath: "artifact-docs/auth-strategy.mdx",
      statePath: "artifact-docs/auth-strategy.state.json",
      stateExists: false,
      writable: true
    });
  });

  it("writes normalized state JSON beside the source file", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-state-"));
    const mdxPath = path.join(projectRoot, "artifact-docs", "auth-strategy.mdx");
    await mkdir(path.dirname(mdxPath), { recursive: true });
    await writeFile(mdxPath, "# Auth Strategy", "utf8");
    const artifact = createArtifactRoute(projectRoot, mdxPath, "artifact-docs");

    await writeArtifactState(projectRoot, artifact, {
      threads: [{ id: "thr_001", anchorId: "risks" }],
      interactions: {
        "auth-decision": {
          selectedOption: "custom-jwt"
        }
      }
    });

    const rawState = await readFile(artifact.statePath, "utf8");
    expect(JSON.parse(rawState)).toEqual({
      version: 1,
      source: "artifact-docs/auth-strategy.mdx",
      threads: [{ id: "thr_001", anchorId: "risks" }],
      interactions: {
        "auth-decision": {
          selectedOption: "custom-jwt"
        }
      }
    });
  });

  it("refuses to write state outside the project workspace", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-state-root-"));
    const externalRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-state-external-"));
    const mdxPath = path.join(externalRoot, "auth-strategy.mdx");
    const artifact = createArtifactRoute(projectRoot, mdxPath, "artifact-docs");

    await expect(writeArtifactState(projectRoot, artifact, { threads: [] })).rejects.toThrow(
      "State file must be next to its MDX source inside the project workspace."
    );
  });
});
