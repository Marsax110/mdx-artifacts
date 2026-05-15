import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addReviewThread, replyToReviewThread, replyToReviewThreads, validateReviewState } from "./review";

describe("review reply", () => {
  it("adds a review thread for an existing anchor", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");

    const output = await addReviewThread(projectRoot, "artifact-docs/feedback.mdx", {
      anchorId: "section.context",
      title: "Context",
      body: "Tighten this section."
    });
    const state = JSON.parse(await readFile(statePath, "utf8"));

    expect(output).toContain("review add ok");
    expect(state.threads).toHaveLength(1);
    expect(state.threads[0]).toMatchObject({
      anchorId: "section.context",
      status: "open",
      title: "Context"
    });
    expect(state.threads[0].id).toMatch(/^thr_section_context/);
    expect(state.threads[0].messages[0]).toMatchObject({
      role: "user",
      body: "Tighten this section."
    });
  });

  it("does not add a review thread for a missing anchor", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");

    await expect(
      addReviewThread(projectRoot, "artifact-docs/feedback.mdx", {
        anchorId: "section.missing",
        body: "Tighten this section."
      })
    ).rejects.toThrow("Review anchor not found: section.missing");
  });

  it("does not add a second review thread for the same anchor", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [{ id: "thr_001", anchorId: "section.context", messages: [] }],
        interactions: {}
      }),
      "utf8"
    );

    await expect(
      addReviewThread(projectRoot, "artifact-docs/feedback.mdx", {
        anchorId: "section.context",
        body: "Tighten this section."
      })
    ).rejects.toThrow("Review thread already exists for anchor: section.context");
  });

  it("replies to an existing review thread", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [
          {
            id: "thr_001",
            anchorId: "section.context",
            status: "open",
            messages: [{ id: "msg_001", role: "user", body: "Tighten this section." }]
          }
        ],
        interactions: {}
      }),
      "utf8"
    );

    const output = await replyToReviewThread(projectRoot, "artifact-docs/feedback.mdx", {
      threadId: "thr_001",
      body: "Updated the section.",
      status: "resolved"
    });
    const state = JSON.parse(await readFile(statePath, "utf8"));

    expect(output).toContain("review reply ok");
    expect(state.threads[0].status).toBe("resolved");
    expect(state.threads[0].messages).toHaveLength(2);
    expect(state.threads[0].messages[1]).toMatchObject({
      role: "assistant",
      body: "Updated the section."
    });
    expect(state.threads[0].messages[1].id).toMatch(/^msg_/);
    expect(state.threads[0].messages[1].createdAt).toEqual(expect.any(String));
  });

  it("replies to multiple existing review threads in one write", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [
          {
            id: "thr_001",
            anchorId: "section.context",
            status: "open",
            messages: []
          },
          {
            id: "thr_002",
            anchorId: "section.context",
            status: "open",
            messages: []
          }
        ],
        interactions: {}
      }),
      "utf8"
    );

    const output = await replyToReviewThreads(projectRoot, "artifact-docs/feedback.mdx", {
      replies: [
        { threadId: "thr_001", body: "Updated the opening." },
        { threadId: "thr_002", body: "Kept the detail as-is." }
      ],
      status: "resolved"
    });
    const state = JSON.parse(await readFile(statePath, "utf8"));

    expect(output).toContain("messages: 2");
    expect(state.threads[0].status).toBe("resolved");
    expect(state.threads[1].status).toBe("resolved");
    expect(state.threads[0].messages[0]).toMatchObject({
      role: "assistant",
      body: "Updated the opening."
    });
    expect(state.threads[1].messages[0]).toMatchObject({
      role: "assistant",
      body: "Kept the detail as-is."
    });
  });

  it("does not create a thread when replying to a missing thread id", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [],
        interactions: {}
      }),
      "utf8"
    );

    await expect(
      replyToReviewThread(projectRoot, "artifact-docs/feedback.mdx", {
        threadId: "thr_missing",
        body: "Updated."
      })
    ).rejects.toThrow("Review thread not found: thr_missing");
  });

  it("validates review state anchors including component child anchors", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(
      mdxPath,
      `<DecisionMatrix
  id="decision.text-model"
  title="Choose a text model"
>
  <DecisionMatrix.Option id="native-mdx" title="Native MDX">
    Use native MDX for readable prose.
  </DecisionMatrix.Option>
</DecisionMatrix>
<Section id="section.context">

## Context

</Section>`,
      "utf8"
    );
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [
          { id: "thr_001", anchorId: "section.context", status: "open", messages: [] },
          { id: "thr_002", anchorId: "decision.text-model.native-mdx", status: "open", messages: [] }
        ],
        interactions: {}
      }),
      "utf8"
    );

    const result = await validateReviewState(projectRoot, "artifact-docs/feedback.mdx");

    expect(result.missingThreads).toEqual([]);
    expect(result.output).toContain("review validate ok");
    expect(result.output).toContain("threads: 2");
  });

  it("reports review state threads whose anchors are missing from MDX", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-review-"));
    const docsDir = path.join(projectRoot, "artifact-docs");
    const mdxPath = path.join(docsDir, "feedback.mdx");
    const statePath = path.join(docsDir, "feedback.state.json");

    await mkdir(docsDir, { recursive: true });
    await writeFile(mdxPath, `<Section id="section.context">\n\n## Context\n\n</Section>`, "utf8");
    await writeFile(
      statePath,
      JSON.stringify({
        version: 1,
        source: "artifact-docs/feedback.mdx",
        threads: [
          {
            id: "thr_missing",
            anchorId: "comparison.removed",
            status: "open",
            title: "Removed comparison",
            messages: []
          }
        ],
        interactions: {}
      }),
      "utf8"
    );

    const result = await validateReviewState(projectRoot, "artifact-docs/feedback.mdx");

    expect(result.missingThreads).toEqual([
      {
        threadId: "thr_missing",
        anchorId: "comparison.removed",
        status: "open",
        title: "Removed comparison"
      }
    ]);
    expect(result.output).toContain("review validate failed");
    expect(result.output).toContain("missing: 1");
    expect(result.output).toContain("thread: thr_missing anchorId: comparison.removed");
  });
});
