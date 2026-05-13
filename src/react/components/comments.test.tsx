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
import { DecisionMatrix } from "./DecisionMatrix";
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
