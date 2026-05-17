import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommentLayer } from "../../interactions/comments/Comments";
import { ContentItem, ContentSet } from "./ContentItem";

describe("ContentItem", () => {
  it("renders a standalone tone and emphasis card with a stable anchor", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <ContentItem
          id="item.api-boundary"
          title="API boundary"
          badge="Focus"
          tone="accent"
          emphasis="primary"
          summary="Keep the public API readable."
        >
          <p>Detailed rationale stays in children.</p>
        </ContentItem>
      </CommentLayer>
    );

    expect(html).toContain('data-anchor-id="item.api-boundary"');
    expect(html).toContain("ak-content-item-tone-accent");
    expect(html).toContain("ak-content-item-emphasis-primary");
    expect(html).toContain("Keep the public API readable.");
    expect(html).toContain("Detailed rationale stays in children.");
  });
});

describe("ContentSet", () => {
  it("renders compound items with inherited tone and parent-prefixed anchors", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <ContentSet
          id="set.authoring"
          title="Authoring paths"
          layout="grid"
          columns={5}
          surface="outlined"
          tone="positive"
        >
          <ContentSet.Item id="component-first" title="Component-first" badge="Recommended">
            <p>Use stable components for interaction.</p>
          </ContentSet.Item>
        </ContentSet>
      </CommentLayer>
    );

    expect(html).toContain('data-anchor-id="set.authoring.component-first"');
    expect(html).toContain("--ak-content-set-columns:5");
    expect(html).toContain("ak-content-set-surface-outlined");
    expect(html).toContain("ak-content-set-items-grid");
    expect(html).toContain("ak-content-item-tone-positive");
    expect(html).toContain("Recommended");
  });

  it("allows item tone and emphasis to override the parent defaults", () => {
    const html = renderToStaticMarkup(
      <ContentSet title="Risks" layout="stack" tone="warning" emphasis="subtle">
        <ContentSet.Item title="Blocking risk" tone="danger" emphasis="primary">
          <p>Escalate before release.</p>
        </ContentSet.Item>
      </ContentSet>
    );

    expect(html).toContain("ak-content-set-items-stack");
    expect(html).toContain("ak-content-item-tone-danger");
    expect(html).toContain("ak-content-item-emphasis-primary");
    expect(html).not.toContain("ak-content-item-tone-warning");
  });
});
