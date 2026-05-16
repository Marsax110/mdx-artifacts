import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommentLayer } from "./Comments";
import {
  SortableList,
  createSortableListInteraction,
  reorderIds,
  resolveSortableListOrder,
  type SortableListItem
} from "./SortableList";

const items: SortableListItem[] = [
  {
    id: "api",
    title: "Stabilize ContentSet API",
    summary: "Must land before public examples.",
    badge: "P0",
    tags: ["api", "docs"]
  },
  {
    id: "layout",
    title: "Clarify layout guidance",
    summary: "Explain component composition boundaries.",
    badge: "P1",
    tags: ["protocol"]
  },
  {
    id: "export",
    title: "Verify artifact export",
    badge: "P1",
    tags: ["export"]
  }
];

describe("SortableList", () => {
  it("renders draggable structured items with short metadata", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <SortableList id="list.priority" items={items} summary="Sort the launch order." title="Launch priority" />
      </CommentLayer>
    );

    expect(html).toContain('data-comment-target-id="list.priority"');
    expect(html).toContain("ak-sortable-list");
    expect(html).toContain('draggable="true"');
    expect(html).toContain("Stabilize ContentSet API");
    expect(html).toContain("Must land before public examples.");
    expect(html).toContain("P0");
    expect(html).toContain("api");
    expect(html).toContain("Move Stabilize ContentSet API down");
  });

  it("resolves persisted order while appending new items", () => {
    expect(resolveSortableListOrder(items, ["layout", "missing", "api"])).toEqual(["layout", "api", "export"]);
  });

  it("reorders ids by moving the active id before the target id", () => {
    expect(reorderIds(["api", "layout", "export"], "export", "api")).toEqual(["export", "api", "layout"]);
    expect(reorderIds(["api", "layout", "export"], "api", "export")).toEqual(["layout", "api", "export"]);
  });

  it("creates a structured interaction payload for export and artifact state", () => {
    const interaction = createSortableListInteraction("list.priority", "Launch priority", ["layout", "api"], items);

    expect(interaction).toMatchObject({
      type: "sortable-list",
      id: "list.priority",
      title: "Launch priority",
      orderedIds: ["layout", "api"],
      orderedItems: [items[1], items[0]]
    });
    expect(interaction.updatedAt).toBeTruthy();
  });
});
