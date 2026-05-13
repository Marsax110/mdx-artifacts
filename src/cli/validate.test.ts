import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateMdx } from "./validate";

describe("validateMdx", () => {
  it("accepts the example artifact", async () => {
    const result = await validateMdx(path.resolve("artifact-docs/examples/decision-matrix.mdx"));

    expect(result.errors).toEqual([]);
  });

  it("rejects raw script tags", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "unsafe.mdx");
    await writeFile(filePath, "<script>alert('x')</script>", "utf8");

    const result = await validateMdx(filePath);

    expect(result.errors).toContain(
      "Do not write <script> directly in MDX. Wrap behavior in a controlled component."
    );
  });
});
