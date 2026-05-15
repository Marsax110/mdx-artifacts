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

  it("warns when reviewable components omit stable ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "missing-id.mdx");
    await writeFile(
      filePath,
      `import { Callout, DecisionMatrix, ExportPanel } from "../../src/react";

<Callout title="Risk" body="Add a stable id." />

<DecisionMatrix title="Choose?">
  <DecisionMatrix.Option title="Missing id">Readable body.</DecisionMatrix.Option>
</DecisionMatrix>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).toContain(
      "Callout should include a stable id prop so comments and state can use a durable anchorId."
    );
    expect(result.warnings).toContain(
      "DecisionMatrix should include a stable id prop so comments and state can use a durable anchorId."
    );
  });

  it("warns when compound option components omit stable ids", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-"));
    const filePath = path.join(dir, "missing-compound-id.mdx");
    await writeFile(
      filePath,
      `import { DecisionMatrix, ExportPanel, OptionGrid } from "../../src/react";

<DecisionMatrix id="decision.api" title="Choose?">
  <DecisionMatrix.Option title="No stable child id">Readable body.</DecisionMatrix.Option>
</DecisionMatrix>

<OptionGrid id="option.api" title="Choose?">
  <OptionGrid.Item title="No stable child id">Readable body.</OptionGrid.Item>
</OptionGrid>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );

    const result = await validateMdx(filePath);

    expect(result.warnings).toContain(
      "DecisionMatrix.Option should include a stable id prop so comments and state can use a durable anchorId."
    );
    expect(result.warnings).toContain(
      "OptionGrid.Item should include a stable id prop so comments and state can use a durable anchorId."
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
      'DecisionMatrix prop "question" is deprecated. Use "title" for the visible decision title.'
    );
    expect(result.warnings).toContain(
      'DecisionMatrix prop "options" is deprecated. Use DecisionMatrix.Option children.'
    );
    expect(result.warnings).toContain('DecisionMatrix.Option prop "name" is deprecated. Use "title".');
    expect(result.warnings).toContain(
      'DecisionMatrix.Option prop "pros" is deprecated. Move long lists into MDX children.'
    );
    expect(result.warnings).toContain(
      'OptionGrid.Item prop "intent" is deprecated. Use "summary" for short intent text.'
    );
    expect(result.warnings).toContain('OptionGrid prop "options" is deprecated. Use OptionGrid.Item children.');
    expect(result.warnings).toContain(
      'OptionGrid.Item prop "tradeoffs" is deprecated. Move tradeoff lists into MDX children.'
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
  });
});
