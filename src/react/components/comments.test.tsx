import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CommentableBlock,
  CommentExport,
  CommentLayer,
  CommentTarget,
  createArtifactComment,
  serializeCommentsToMarkdown
} from "./Comments";
import { AnnotatedCode } from "./AnnotatedCode";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { DecisionMatrix } from "./DecisionMatrix";
import { DiffBlock } from "./DiffBlock";
import { ExportPanel } from "./ExportPanel";
import { OptionGrid } from "./OptionGrid";

describe("Comment components", () => {
  it("renders a commentable block with a stable block target", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <CommentableBlock blockId="decision-path" title="Decision path">
          <p>Review this block.</p>
        </CommentableBlock>
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="decision-path"');
    expect(html).toContain("Decision path");
    expect(html).toContain("Comment");
    expect(html).not.toContain("0 comments");
  });

  it("renders target children without comment chrome outside a layer", () => {
    const html = renderToStaticMarkup(
      <CommentTarget targetId="standalone" title="Standalone target">
        <p>Plain content.</p>
      </CommentTarget>
    );

    expect(html).toContain("Plain content.");
    expect(html).not.toContain("ak-comment-target-block");
  });

  it("adds fine-grained targets to decision and option items inside a layer", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <DecisionMatrix
          options={[
            {
              name: "Explicit blocks"
            }
          ]}
          question="Comment target scope"
        />
        <OptionGrid
          options={[
            {
              name: "CommentLayer"
            }
          ]}
          title="Comment workflow pieces"
        />
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="decision:comment-target-scope:1:explicit-blocks"');
    expect(html).toContain('data-comment-target-id="option:comment-workflow-pieces:1:commentlayer"');
  });

  it("adds targets to semantic, code, diff, and export blocks inside a layer", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <Callout body="Check the export path." title="Review focus" tone="warning" />
        <CodeBlock code="const value = 1;" filename="example.ts" language="ts" />
        <DiffBlock
          filename="example.diff"
          lines={[
            { type: "remove", oldLine: 1, content: "old" },
            { type: "add", newLine: 1, content: "new" }
          ]}
        />
        <AnnotatedCode
          annotations={[
            {
              line: 1,
              title: "Important line",
              body: "Review the setup."
            }
          ]}
          code="const setup = true;"
          filename="setup.ts"
        />
        <ExportPanel title="Export review result" value={{ ok: true }} />
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="callout:review-focus:check-the-export-path"');
    expect(html).toContain('data-comment-target-id="code:example-ts"');
    expect(html).toContain('data-comment-target-id="diff:example-diff"');
    expect(html).toContain('data-comment-target-id="annotated-code:setup-ts"');
    expect(html).toContain('data-comment-target-id="annotation:setup-ts:1:important-line"');
    expect(html).toContain('data-comment-target-id="export:export-review-result"');
  });

  it("renders an empty comment export inside a layer", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <CommentExport />
      </CommentLayer>
    );

    expect(html).toContain("Export Comments");
    expect(html).toContain("No comments yet.");
  });

  it("creates trimmed comment records and skips empty input", () => {
    const comment = createArtifactComment(
      {
        blockId: "component-menu",
        blockTitle: "Component menu",
        blockDescription: "Feedback target",
        comment: "  Tighten this section.  "
      },
      "comment-1",
      "2026-05-13T00:00:00.000Z"
    );

    expect(comment).toEqual({
      id: "comment-1",
      blockId: "component-menu",
      blockTitle: "Component menu",
      blockDescription: "Feedback target",
      comment: "Tighten this section.",
      createdAt: "2026-05-13T00:00:00.000Z"
    });

    expect(
      createArtifactComment(
        {
          blockId: "component-menu",
          blockTitle: "Component menu",
          comment: "   "
        },
        "comment-2",
        "2026-05-13T00:00:00.000Z"
      )
    ).toBeNull();
  });

  it("serializes block comments to agent-friendly markdown", () => {
    const markdown = serializeCommentsToMarkdown({
      comments: [
        {
          id: "comment-1",
          blockId: "decision-path",
          blockTitle: "Decision path",
          blockDescription: "Main tradeoff",
          comment: "Prefer the smaller API.",
          createdAt: "2026-05-13T00:00:00.000Z"
        },
        {
          id: "comment-2",
          blockId: "component-menu",
          blockTitle: "Component menu",
          comment: "Add one more example.",
          createdAt: "2026-05-13T00:01:00.000Z"
        }
      ]
    });

    expect(markdown).toContain("# Artifact comments");
    expect(markdown).toContain("## Decision path");
    expect(markdown).toContain("- blockId: decision-path");
    expect(markdown).toContain("- description: Main tradeoff");
    expect(markdown).toContain("- comment: Prefer the smaller API.");
    expect(markdown).toContain("## Component menu");
    expect(markdown).toContain("- comment: Add one more example.");
  });
});
