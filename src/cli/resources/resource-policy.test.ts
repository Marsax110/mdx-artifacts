import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateResourceReferences } from "./resource-policy";
import { resolveSafeProjectPath } from "./safe-path";

describe("resolveSafeProjectPath", () => {
  it("accepts project-local paths", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const result = await resolveSafeProjectPath(projectRoot, "styles/app.css");

    expect(result).toEqual({
      ok: true,
      path: path.join(projectRoot, "styles/app.css")
    });
  });

  it("rejects paths that escape the project root", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const result = await resolveSafeProjectPath(projectRoot, "../outside.css");

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "resource_path_escape"
      })
    );
  });

  it("rejects home-relative paths", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const result = await resolveSafeProjectPath(projectRoot, "~/styles/app.css");

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "home_resource_blocked"
      })
    );
  });

  it("rejects remote URLs", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const result = await resolveSafeProjectPath(projectRoot, "https://example.com/app.css");

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "remote_resource_blocked"
      })
    );
  });

  it("rejects symlinks that resolve outside the project root", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const outsideRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-outside-"));
    const outsideFile = path.join(outsideRoot, "app.css");
    const symlinkPath = path.join(projectRoot, "linked.css");

    await writeFile(outsideFile, ".outside {}", "utf8");
    await symlink(outsideFile, symlinkPath);

    const result = await resolveSafeProjectPath(projectRoot, "linked.css", { realpath: true });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: "resource_path_escape"
      })
    );
  });
});

describe("validateResourceReferences", () => {
  it("accepts existing style resources", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const stylePath = path.join(projectRoot, "app.css");
    await writeFile(stylePath, ".artifact {}", "utf8");

    const diagnostics = await validateResourceReferences({
      projectRoot,
      references: [{ type: "style", path: "app.css", sourcePath: "artifact.mdx", fieldName: "styles" }]
    });

    expect(diagnostics).toEqual([]);
  });

  it("reports blocked resources as structured diagnostics", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));

    const diagnostics = await validateResourceReferences({
      projectRoot,
      references: [{ type: "style", path: "https://example.com/app.css", sourcePath: "artifact.mdx", fieldName: "styles" }]
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: "remote_resource_blocked",
        sourcePath: "artifact.mdx",
        propName: "styles",
        suggestion: "Use a local project-relative resource path."
      })
    ]);
  });

  it("reports missing style resources", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));

    const diagnostics = await validateResourceReferences({
      projectRoot,
      references: [{ type: "style", path: "missing.css", sourcePath: "artifact.mdx", fieldName: "styles" }]
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        code: "resource_not_found",
        message: "style resource not found: missing.css",
        sourcePath: "artifact.mdx",
        propName: "styles"
      })
    ]);
  });
});
