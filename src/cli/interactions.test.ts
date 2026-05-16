import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractSortableListSeeds } from "./interaction-mdx";
import { inspectInteraction } from "./interactions";

describe("interactions inspect", () => {
  it("reads the default SortableList order from MDX when state is missing", async () => {
    const projectRoot = await createProject({
      items: [
        `{ id: "api", title: "Stabilize API", badge: "P0", tags: ["api"] }`,
        `{ id: "docs", title: "Update docs", summary: "Document the protocol." }`
      ]
    });

    const result = await inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");

    expect(result.order).toEqual({
      source: "mdx",
      orderedIds: ["api", "docs"],
      staleIds: [],
      appendedIds: []
    });
    expect(result.state.exists).toBe(false);
    expect(result.component.items).toEqual([
      { id: "api", title: "Stabilize API", badge: "P0", tags: ["api"] },
      { id: "docs", title: "Update docs", summary: "Document the protocol." }
    ]);
  });

  it("merges state orderedIds with MDX items and reports stale ids", async () => {
    const projectRoot = await createProject({
      items: [
        `{ id: "api", title: "Stabilize API" }`,
        `{ id: "docs", title: "Update docs" }`,
        `{ id: "adapter", title: "Adapter design" }`
      ],
      state: {
        version: 1,
        source: "artifact-docs/examples/priorities.mdx",
        threads: [],
        interactions: {
          "list.priorities": {
            type: "sortable-list",
            orderedIds: ["docs", "missing", "api"]
          }
        }
      }
    });

    const result = await inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");

    expect(result.order).toEqual({
      source: "state",
      orderedIds: ["docs", "api", "adapter"],
      staleIds: ["missing"],
      appendedIds: ["adapter"]
    });
    expect(result.warnings).toEqual([
      "SortableList list.priorities state contains stale orderedIds ignored by inspect: missing."
    ]);
  });

  it("rejects dynamic SortableList items", () => {
    expect(() =>
      extractSortableListSeeds(`<SortableList id="list.dynamic" title="Dynamic" items={itemsFromRuntime} />`)
    ).toThrow("SortableList items must use only static objects, arrays, strings, booleans, or null.");
  });

  it("throws when the requested SortableList id is not found", async () => {
    const projectRoot = await createProject({
      items: [`{ id: "api", title: "Stabilize API" }`]
    });

    await expect(
      inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.missing")
    ).rejects.toThrow("SortableList not found: list.missing. Available SortableList ids: list.priorities.");
  });
});

async function createProject(options: { items: string[]; state?: unknown }) {
  const projectRoot = await mkdtemp(path.join(tmpdir(), "mdx-artifacts-interactions-"));
  const docsDir = path.join(projectRoot, "artifact-docs", "examples");
  const mdxPath = path.join(docsDir, "priorities.mdx");
  await mkdir(docsDir, { recursive: true });
  await writeFile(
    mdxPath,
    `import { SortableList } from "mdx-artifacts/react";

<SortableList
  id="list.priorities"
  title="Priorities"
  items={[
    ${options.items.join(",\n    ")}
  ]}
/>`,
    "utf8"
  );

  if (options.state) {
    await writeFile(mdxPath.replace(/\.mdx$/, ".state.json"), `${JSON.stringify(options.state, null, 2)}\n`, "utf8");
  }

  return projectRoot;
}
