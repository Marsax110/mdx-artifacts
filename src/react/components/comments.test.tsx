import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CommentableBlock,
  CommentExport,
  CommentLayer,
  CommentTarget,
  createArtifactComment,
  createArtifactCommentsFromState,
  createArtifactThreadsFromState,
  serializeCommentsToMarkdown
} from "./Comments";
import { createArtifactStateFromComments } from "./ArtifactState";
import { AnnotatedCode } from "../primitives/annotated-code/AnnotatedCode";
import { Callout } from "../primitives/callout/Callout";
import { CodeBlock } from "../primitives/code-block/CodeBlock";
import { ComparisonSet } from "../composites/comparison-set/ComparisonSet";
import { ContentSet } from "../composites/content-set/ContentItem";
import { DiffBlock } from "../primitives/diff-block/DiffBlock";
import { ExportPanel } from "../composites/export-panel/ExportPanel";

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

  it("adds fine-grained targets to content set items inside a layer", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <ContentSet title="Comment target scope">
          <ContentSet.Item title="Explicit blocks" />
        </ContentSet>
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="content-set:comment-target-scope:explicit-blocks"');
  });

  it("uses explicit ids for shorter anchor targets when provided", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <ContentSet id="set.comment-targets" title="Comment target scope">
          <ContentSet.Item id="explicit" title="Explicit blocks" />
        </ContentSet>
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="set.comment-targets"');
    expect(html).toContain('data-anchor-id="set.comment-targets"');
    expect(html).toContain('data-comment-target-id="set.comment-targets.explicit"');
  });

  it("uses explicit ids for semantic, code, diff, and comparison targets when provided", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <Callout id="callout.review-focus" body="Check the export path." title="Review focus" tone="warning" />
        <CodeBlock id="code.example" code="const value = 1;" filename="example.ts" language="ts" />
        <DiffBlock
          id="diff.example"
          filename="example.diff"
          lines={[
            { type: "remove", oldLine: 1, content: "old" },
            { type: "add", newLine: 1, content: "new" }
          ]}
        />
        <AnnotatedCode
          annotations={[
            {
              id: "setup",
              line: 1,
              title: "Important line",
              body: "Review the setup."
            }
          ]}
          code="const setup = true;"
          filename="setup.ts"
          id="code.setup"
        />
        <ComparisonSet id="comparison.content" title="Content forms">
          <ComparisonSet.Item id="markdown" title="Markdown body">
            <p>Plain prose.</p>
          </ComparisonSet.Item>
        </ComparisonSet>
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="callout.review-focus"');
    expect(html).toContain('data-comment-target-id="code.example"');
    expect(html).toContain('data-comment-target-id="diff.example"');
    expect(html).toContain('data-comment-target-id="code.setup"');
    expect(html).toContain('data-comment-target-id="code.setup.code"');
    expect(html).toContain('data-comment-target-id="code.setup.setup"');
    expect(html).toContain('data-comment-target-id="comparison.content"');
    expect(html).toContain('data-comment-target-id="comparison.content.markdown"');
  });

  it("adds targets to semantic, code, and diff blocks inside a layer", () => {
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
    expect(html).toContain("ak-export-dock");
    expect(html).not.toContain('data-comment-target-id="export:export-review-result"');
  });

  it("renders an empty comment export inside a layer", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <CommentExport />
      </CommentLayer>
    );

    expect(html).toContain("Comments");
    expect(html).toContain("ak-export-dock-trigger");
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
    expect(markdown).toContain("- status: open");
    expect(markdown).toContain("- description: Main tradeoff");
    expect(markdown).toContain("### Messages");
    expect(markdown).toContain("- user (2026-05-13T00:00:00.000Z): Prefer the smaller API.");
    expect(markdown).toContain("## Component menu");
    expect(markdown).toContain("- user (2026-05-13T00:01:00.000Z): Add one more example.");
  });

  it("serializes assistant replies in review thread markdown", () => {
    const markdown = serializeCommentsToMarkdown({
      threads: [
        {
          id: "thr-risks",
          blockId: "risks",
          blockTitle: "Risks",
          status: "resolved",
          messages: [
            {
              id: "msg-user",
              role: "user",
              body: "Add the fallback path.",
              createdAt: "2026-05-14T10:20:00.000Z"
            },
            {
              id: "msg-assistant",
              role: "assistant",
              body: "Added the fallback path.",
              createdAt: "2026-05-14T10:28:00.000Z"
            }
          ]
        }
      ]
    });

    expect(markdown).toContain("- status: resolved");
    expect(markdown).toContain("- user (2026-05-14T10:20:00.000Z): Add the fallback path.");
    expect(markdown).toContain("- assistant (2026-05-14T10:28:00.000Z): Added the fallback path.");
  });

  it("serializes comments into artifact state threads", () => {
    const state = createArtifactStateFromComments(
      [
        {
          id: "comment-1",
          blockId: "risks",
          blockTitle: "Risks",
          blockDescription: "Risk section",
          comment: "Add the fallback path.",
          createdAt: "2026-05-14T10:20:00.000Z"
        }
      ],
      {
        version: 1,
        source: "old.mdx",
        threads: [
          {
            id: "thr-risks",
            anchorId: "risks",
            status: "open",
            messages: [
              {
                id: "msg-existing",
                role: "user",
                body: "Old body",
                createdAt: "2026-05-14T10:00:00.000Z"
              },
              {
                id: "msg-assistant",
                role: "assistant",
                body: "I will update this."
              }
            ]
          }
        ],
        interactions: {
          decision: {
            selected: true
          }
        }
      },
      "artifact-docs/auth-strategy.mdx"
    );

    expect(state).toEqual({
      version: 1,
      source: "artifact-docs/auth-strategy.mdx",
      threads: [
        {
          id: "thr-risks",
          anchorId: "risks",
          status: "open",
          description: "Risk section",
          title: "Risks",
          messages: [
            {
              id: "msg-existing",
              role: "user",
              body: "Add the fallback path.",
              createdAt: "2026-05-14T10:00:00.000Z"
            },
            {
              id: "msg-assistant",
              role: "assistant",
              body: "I will update this."
            }
          ]
        }
      ],
      interactions: {
        decision: {
          selected: true
        }
      }
    });
  });

  it("uses compact thread ids for new comment state threads", () => {
    const state = createArtifactStateFromComments(
      [
        {
          id: "comment-1",
          blockId: "decision:should-comment-targets-be-explicit-blocks-in-v1:1:explicit-comment-blocks",
          blockTitle: "Explicit comment blocks",
          comment: "This should use a compact thread id.",
          createdAt: "2026-05-14T10:20:00.000Z"
        }
      ],
      {},
      "artifact-docs/commentable-feedback.mdx"
    );

    expect(state.threads[0]?.id).toMatch(/^thr_[a-z0-9]+$/);
    expect(state.threads[0]?.id.length).toBeLessThan(16);
    expect(state.threads[0]?.anchorId).toBe(
      "decision:should-comment-targets-be-explicit-blocks-in-v1:1:explicit-comment-blocks"
    );
  });

  it("hydrates saved artifact state into local comments", () => {
    const comments = createArtifactCommentsFromState({
      threads: [
        {
          id: "thr-risks",
          anchorId: "risks",
          status: "open",
          title: "Risks",
          description: "Risk section",
          messages: [
            {
              id: "msg-user",
              role: "user",
              body: "Add the fallback path.",
              createdAt: "2026-05-14T10:20:00.000Z"
            },
            {
              id: "msg-assistant",
              role: "assistant",
              body: "I will update this."
            }
          ]
        },
        {
          id: "thr-empty",
          anchorId: "empty",
          status: "open",
          messages: []
        }
      ]
    });

    expect(comments).toEqual([
      {
        id: "msg-user",
        blockId: "risks",
        blockTitle: "Risks",
        blockDescription: "Risk section",
        comment: "Add the fallback path.",
        createdAt: "2026-05-14T10:20:00.000Z"
      }
    ]);
  });

  it("hydrates saved artifact state into review threads with assistant replies", () => {
    const threads = createArtifactThreadsFromState({
      threads: [
        {
          id: "thr-risks",
          anchorId: "risks",
          status: "open",
          title: "Risks",
          description: "Risk section",
          messages: [
            {
              id: "msg-user",
              role: "user",
              body: "Add the fallback path.",
              createdAt: "2026-05-14T10:20:00.000Z"
            },
            {
              id: "msg-assistant",
              role: "assistant",
              body: "I updated this section.",
              createdAt: "2026-05-14T10:30:00.000Z"
            }
          ]
        }
      ]
    });

    expect(threads).toEqual([
      {
        id: "thr-risks",
        blockId: "risks",
        blockTitle: "Risks",
        blockDescription: "Risk section",
        status: "open",
        messages: [
          {
            id: "msg-user",
            role: "user",
            body: "Add the fallback path.",
            createdAt: "2026-05-14T10:20:00.000Z"
          },
          {
            id: "msg-assistant",
            role: "assistant",
            body: "I updated this section.",
            createdAt: "2026-05-14T10:30:00.000Z"
          }
        ]
      }
    ]);
  });
});
