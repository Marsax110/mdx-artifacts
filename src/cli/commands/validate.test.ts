import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { validateMdx } from "./validate";

const execFileAsync = promisify(execFile);
const cli = path.resolve("src/cli/index.ts");
const tsx = path.resolve("node_modules/.bin/tsx");

describe("validateMdx", () => {
  it("accepts the example artifact", async () => {
    const result = await validateMdx(path.resolve("artifact-docs/examples/decision-matrix.mdx"));

    expect(result.errors).toEqual([]);
    expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
  });

  it("warns when reviewable components omit stable ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "missing-id.mdx");
    await writeFile(
      filePath,
      `import { Callout, ContentSet, ExportPanel, SortableList } from "../../src/react";

<Callout title="Risk" body="Add a stable id." />

<ContentSet title="Choose?">
  <ContentSet.Item title="Missing id">Readable body.</ContentSet.Item>
</ContentSet>

<SortableList title="Priority" items={[{ id: "api", title: "API" }]} />

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).toContain(
      "Callout should include a stable id prop so comments and state can use a durable anchorId."
    );
    expect(result.warnings).toContain(
      "ContentSet should include a stable id prop so comments and state can use a durable anchorId."
    );
    expect(result.warnings).toContain(
      "SortableList should include a stable id prop so comments and state can use a durable anchorId."
    );
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "stable_id_missing",
          componentName: "Callout",
          propName: "id",
          suggestion: "Add a stable id prop to Callout."
        }),
        expect.objectContaining({
          severity: "warning",
          code: "stable_id_missing",
          componentName: "ContentSet",
          propName: "id"
        }),
        expect.objectContaining({
          severity: "warning",
          code: "stable_id_missing",
          componentName: "SortableList",
          propName: "id"
        })
      ])
    );
  });

  it("warns when compound content set items omit stable ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "missing-compound-id.mdx");
    await writeFile(
      filePath,
      `import { ContentSet, ExportPanel } from "../../src/react";

<ContentSet id="set.api" title="Choose?">
  <ContentSet.Item title="No stable child id">Readable body.</ContentSet.Item>
</ContentSet>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).toContain(
      "ContentSet.Item should include a stable id prop so comments and state can use a durable anchorId."
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: "stable_id_missing",
        componentName: "ContentSet.Item",
        propName: "id"
      })
    );
  });

  it("does not treat component-like strings as missing ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "code-string.mdx");
    await writeFile(
      filePath,
      `import { CodeBlock, ExportPanel } from "../../src/react";

<CodeBlock
  id="code.example"
  code={\`<DecisionMatrix title="Example"><DecisionMatrix.Option title="A" /></DecisionMatrix>\`}
/>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).not.toContain(
      "DecisionMatrix should include a stable id prop so comments and state can use a durable anchorId."
    );
  });

  it("warns when deprecated authoring props are used", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "deprecated-authoring-props.mdx");
    await writeFile(
      filePath,
      `import { DecisionMatrix, ExportPanel, OptionGrid } from "../../src/react";

<DecisionMatrix id="decision.api" question="Choose?" options={[]}>
  <DecisionMatrix.Option
    id="path-a"
    name="Path A"
    pros={["Readable"]}
    cons={["Old API"]}
    risks={["Drift"]}
    confidence="high"
    verdict="Use the slot model"
  />
</DecisionMatrix>

<OptionGrid id="option.api" title="Options" options={[]}>
  <OptionGrid.Item
    id="workflow"
    name="Workflow components"
    intent="Explain choices."
    description="Longer prose belongs in children."
    tradeoffs={["Readable diffs"]}
  />
</OptionGrid>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).toContain(
      "DecisionMatrix has been removed from the public API. Use ContentSet with ContentSet.Item children."
    );
    expect(result.warnings).toContain("DecisionMatrix.Option has been removed from the public API. Use ContentSet.Item.");
    expect(result.warnings).toContain(
      'DecisionMatrix prop "question" is deprecated. Use ContentSet prop "title".'
    );
    expect(result.warnings).toContain('DecisionMatrix prop "options" is deprecated. Use ContentSet.Item children.');
    expect(result.warnings).toContain('DecisionMatrix.Option prop "name" is deprecated. Use "title".');
    expect(result.warnings).toContain(
      'DecisionMatrix.Option prop "pros" is deprecated. Move long lists into MDX children.'
    );
    expect(result.warnings).toContain(
      'OptionGrid.Item prop "intent" is deprecated. Use "summary" for short intent text.'
    );
    expect(result.warnings).toContain(
      "OptionGrid has been removed from the public API. Use ContentSet with ContentSet.Item children."
    );
    expect(result.warnings).toContain("OptionGrid.Item has been removed from the public API. Use ContentSet.Item.");
    expect(result.warnings).toContain('OptionGrid prop "options" is deprecated. Use ContentSet.Item children.');
    expect(result.warnings).toContain(
      'OptionGrid.Item prop "tradeoffs" is deprecated. Move tradeoff lists into MDX children.'
    );
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "deprecated_component",
          componentName: "DecisionMatrix",
          suggestion: "Replace DecisionMatrix with ContentSet and ContentSet.Item children."
        }),
        expect.objectContaining({
          code: "deprecated_prop",
          componentName: "DecisionMatrix",
          propName: "options"
        }),
        expect.objectContaining({
          code: "deprecated_prop",
          componentName: "OptionGrid.Item",
          propName: "tradeoffs"
        })
      ])
    );
  });

  it("does not warn for deprecated authoring props inside string literals", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "deprecated-authoring-props-string.mdx");
    await writeFile(
      filePath,
      `import { CodeBlock, ExportPanel } from "../../src/react";

<CodeBlock
  id="code.example"
  code={\`<OptionGrid.Item name="Old example" tradeoffs={[]} />\`}
/>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).not.toContain('OptionGrid.Item prop "name" is deprecated. Use "title".');
    expect(result.warnings).not.toContain(
      'OptionGrid.Item prop "tradeoffs" is deprecated. Move tradeoff lists into MDX children.'
    );
  });

  it("accepts CommentExport as an export path", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "comment-export.mdx");
    await writeFile(
      filePath,
      `import { CommentExport } from "../../src/react";

<CommentExport />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).not.toContain(
      "ExportPanel or equivalent export component not found. Interactive artifacts should provide an export path."
    );
  });

  it("rejects raw script tags", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "unsafe.mdx");
    await writeFile(filePath, "<script>alert('x')</script>", "utf8");

    const result = await validateMdx(filePath);

    expect(result.errors).toContain(
      "Do not write <script> directly in MDX. Wrap behavior in a controlled component."
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: "error",
        code: "raw_script_blocked"
      })
    );
  });

  it("prints structured diagnostics with validate --json", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "json-output.mdx");
    await writeFile(
      filePath,
      `import { Callout, ExportPanel } from "../../src/react";

<Callout title="Risk" body="Add a stable id." />

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await execFileAsync(tsx, [cli, "validate", filePath, "--json"]);
    const output = JSON.parse(result.stdout) as {
      ok: boolean;
      diagnostics: Array<{ code: string; componentName?: string; propName?: string }>;
    };

    expect(output.ok).toBe(true);
    expect(output.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "stable_id_missing",
          componentName: "Callout",
          propName: "id"
        })
      ])
    );
  });
});
