import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { extractSortableListSeeds } from "./interaction-mdx";
import { inspectInteraction, interactionsCommand, resetInteraction, setInteractionOrder } from "./interactions";

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

describe("interactions set-order and reset", () => {
  it("supports the set-order and reset CLI command shape", async () => {
    const projectRoot = await createProject({
      items: [
        `{ id: "api", title: "Stabilize API" }`,
        `{ id: "docs", title: "Update docs" }`
      ]
    });
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await interactionsCommand(projectRoot, [
        "set-order",
        "artifact-docs/examples/priorities.mdx",
        "list.priorities",
        "--ordered-ids",
        "docs,api"
      ]);
      expect(log).toHaveBeenLastCalledWith(expect.stringContaining("interactions set-order ok"));

      let result = await inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");
      expect(result.order.orderedIds).toEqual(["docs", "api"]);

      await interactionsCommand(projectRoot, ["reset", "artifact-docs/examples/priorities.mdx", "list.priorities"]);
      expect(log).toHaveBeenLastCalledWith(expect.stringContaining("interactions reset ok"));

      result = await inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");
      expect(result.order.orderedIds).toEqual(["api", "docs"]);
    } finally {
      log.mockRestore();
    }
  });

  it("writes a SortableList order overlay and inspect reads it back", async () => {
    const projectRoot = await createProject({
      items: [
        `{ id: "api", title: "Stabilize API" }`,
        `{ id: "docs", title: "Update docs" }`,
        `{ id: "adapter", title: "Adapter design" }`
      ],
      state: {
        version: 1,
        source: "artifact-docs/examples/priorities.mdx",
        threads: [{ id: "thr_list", anchorId: "list.priorities" }],
        interactions: {
          "other.component": { selected: true }
        },
        customField: "keep"
      }
    });

    await setInteractionOrder(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities", [
      "adapter",
      "api",
      "docs"
    ]);

    const state = await readState(projectRoot);
    expect(state).toMatchObject({
      threads: [{ id: "thr_list", anchorId: "list.priorities" }],
      interactions: {
        "other.component": { selected: true },
        "list.priorities": {
          type: "sortable-list",
          id: "list.priorities",
          title: "Priorities",
          orderedIds: ["adapter", "api", "docs"],
          orderedItems: [
            { id: "adapter", title: "Adapter design" },
            { id: "api", title: "Stabilize API" },
            { id: "docs", title: "Update docs" }
          ]
        }
      },
      customField: "keep"
    });
    expect(typeof state.interactions["list.priorities"].updatedAt).toBe("string");

    const result = await inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");
    expect(result.order).toMatchObject({
      source: "state",
      orderedIds: ["adapter", "api", "docs"]
    });
  });

  it("rejects unknown, duplicate, and missing ordered ids", async () => {
    const projectRoot = await createProject({
      items: [
        `{ id: "api", title: "Stabilize API" }`,
        `{ id: "docs", title: "Update docs" }`
      ]
    });

    await expect(
      setInteractionOrder(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities", [
        "api",
        "api",
        "missing"
      ])
    ).rejects.toThrow(
      "Invalid orderedIds for SortableList list.priorities: duplicate ids: api; unknown ids: missing; missing ids: docs."
    );
  });

  it("resets only the requested interaction overlay", async () => {
    const projectRoot = await createProject({
      items: [
        `{ id: "api", title: "Stabilize API" }`,
        `{ id: "docs", title: "Update docs" }`
      ],
      state: {
        version: 1,
        source: "artifact-docs/examples/priorities.mdx",
        threads: [{ id: "thr_list", anchorId: "list.priorities" }],
        interactions: {
          "list.priorities": {
            type: "sortable-list",
            orderedIds: ["docs", "api"]
          },
          "other.component": { selected: true }
        }
      }
    });

    await resetInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");

    const state = await readState(projectRoot);
    expect(state.interactions).toEqual({
      "other.component": { selected: true }
    });
    expect(state.threads).toEqual([{ id: "thr_list", anchorId: "list.priorities" }]);

    const result = await inspectInteraction(projectRoot, "artifact-docs/examples/priorities.mdx", "list.priorities");
    expect(result.order).toEqual({
      source: "mdx",
      orderedIds: ["api", "docs"],
      staleIds: [],
      appendedIds: []
    });
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

async function readState(projectRoot: string) {
  const statePath = path.join(projectRoot, "artifact-docs", "examples", "priorities.state.json");
  return JSON.parse(await readFile(statePath, "utf8"));
}
