import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReviewContext, extractReviewAnchors } from "./review";

describe("review context", () => {
  it("builds LLM-readable context from MDX and sidecar state", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(
      mdxPath,
      `import { DecisionMatrix, ExportPanel, Section } from "../../src/react";

<Section id="section.context">

## Context

Review this section.

</Section>

<DecisionMatrix
  id="decision.auth"
  question="Choose auth?"
  options={[
    {
      id: "jwt",
      name: "JWT"
    }
  ]}
/>

<ExportPanel value={{ ok: true }} />`,
      "utf8"
    );
    await writeFile(
      statePath,
      JSON.stringify(
        {
          version: 1,
          source: "artifact-docs/feedback.mdx",
          threads: [
            {
              id: "thr_001",
              anchorId: "section.context",
              status: "open",
              title: "Context",
              messages: [{ id: "msg_001", role: "user", body: "Tighten this section." }]
            },
            {
              id: "thr_002",
              anchorId: "decision.auth.jwt",
              status: "open",
              title: "JWT",
              messages: [{ id: "msg_002", role: "user", body: "Explain the tradeoff." }]
            }
          ],
          interactions: {}
        },
        null,
        2
      ),
      "utf8"
    );

    const context = await buildReviewContext(projectRoot, "artifact-docs/feedback.mdx");

    expect(context).toContain("# Artifact Review Context");
    expect(context).toContain("state: artifact-docs/feedback.state.json");
    expect(context).toContain("## Thread thr_001");
    expect(context).toContain("- anchorId: section.context");
    expect(context).toContain("- anchor: Section found");
    expect(context).toContain("<Section id=\"section.context\">");
    expect(context).toContain("- user: Tighten this section.");
    expect(context).toContain("## Thread thr_002");
    expect(context).toContain("- anchorId: decision.auth.jwt");
    expect(context).toContain("- anchor: DecisionMatrix found");
    expect(context).toContain("- user: Explain the tradeoff.");
  });

  it("marks missing anchors without guessing", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `import { ExportPanel } from "../../src/react";\n\n<ExportPanel value={{ ok: true }} />`, "utf8");
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [{ id: "thr_missing", anchorId: "section.missing", messages: [] }],
        interactions: {}
      }),
      "utf8"
    );

    const context = await buildReviewContext(projectRoot, "artifact-docs/feedback.mdx");

    expect(context).toContain("- anchor: missing");
    expect(context).toContain("Anchor not found for section.missing.");
  });

  it("extracts child anchors for option-like components", () => {
    const anchors = extractReviewAnchors(`<OptionGrid
  id="option.flow"
  title="Flow"
  options={[
    {
      id: "state",
      name: "State"
    }
  ]}
/>`);

    expect(anchors.has("option.flow")).toBe(true);
    expect(anchors.has("option.flow.state")).toBe(true);
  });

  it("does not infer a parent anchor from nested content", () => {
    const anchors = extractReviewAnchors(`<Section>

<DecisionMatrix
  id="decision.auth"
  question="Choose auth?"
  options={[
    {
      id: "jwt",
      name: "JWT"
    }
  ]}
/>

</Section>`);

    expect(anchors.has("decision.auth")).toBe(true);
    expect(anchors.has("jwt")).toBe(false);
  });
});
