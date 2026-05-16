import { readFile } from "node:fs/promises";
import path from "node:path";
import { createArtifactMeta, createArtifactRoute, readArtifactState, type ArtifactRoute } from "./artifact-state";
import { loadConfig } from "./config";
import { extractSortableListSeeds, type SortableListSeed } from "./interaction-mdx";

export type InteractionsInspectResult = {
  component: SortableListSeed;
  order: {
    source: "mdx" | "state";
    orderedIds: string[];
    staleIds: string[];
    appendedIds: string[];
  };
  state: {
    path: string;
    exists: boolean;
  };
  source: {
    path: string;
  };
  warnings: string[];
};

type ParsedInspectArgs = {
  input: string;
  id: string;
  json: boolean;
};

export async function interactionsCommand(projectRoot: string, args: string[]) {
  const [subcommand] = args;

  if (subcommand === "inspect") {
    const options = parseInspectArgs(args.slice(1));
    const result = await inspectInteraction(projectRoot, options.input, options.id);
    console.log(options.json ? JSON.stringify(result, null, 2) : formatInspectResult(result));
    return;
  }

  throw new Error("interactions requires a subcommand. Use `artifact-kit interactions inspect <file.mdx> <id> [--json]`.");
}

export async function inspectInteraction(
  projectRoot: string,
  input: string,
  id: string
): Promise<InteractionsInspectResult> {
  const artifact = await createArtifactFromInput(projectRoot, input);
  const meta = await createArtifactMeta(projectRoot, artifact);
  const state = await readArtifactState(artifact);
  const source = await readFile(artifact.sourcePath, "utf8");
  const seeds = extractSortableListSeeds(source);
  const component = seeds.find((seed) => seed.id === id);

  if (!component) {
    const availableIds = seeds.map((seed) => seed.id);
    throw new Error(
      availableIds.length > 0
        ? `SortableList not found: ${id}. Available SortableList ids: ${availableIds.join(", ")}.`
        : `SortableList not found: ${id}.`
    );
  }

  const persistedOrder = readPersistedOrder(state.interactions[id]);
  const resolvedOrder = resolveOrder(component, persistedOrder);
  const warnings = createInspectWarnings(id, resolvedOrder.staleIds);

  return {
    component,
    order: resolvedOrder,
    state: {
      path: meta.statePath,
      exists: meta.stateExists
    },
    source: {
      path: meta.sourcePath
    },
    warnings
  };
}

function parseInspectArgs(args: string[]): ParsedInspectArgs {
  const positional = args.filter((arg) => arg !== "--json");
  const json = args.includes("--json");
  const [input, id, ...rest] = positional;

  if (!input) {
    throw new Error("interactions inspect requires a .mdx file path.");
  }

  if (!id) {
    throw new Error("interactions inspect requires a component id.");
  }

  if (rest.length > 0) {
    throw new Error(`Unexpected interactions inspect argument: ${rest[0]}`);
  }

  return { input, id, json };
}

async function createArtifactFromInput(projectRoot: string, input: string): Promise<ArtifactRoute> {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  return createArtifactRoute(projectRoot, mdxPath, config.docsDir);
}

function readPersistedOrder(interaction: unknown) {
  if (!isRecord(interaction) || !Array.isArray(interaction.orderedIds)) {
    return undefined;
  }

  const orderedIds = interaction.orderedIds.filter((itemId): itemId is string => typeof itemId === "string");
  return orderedIds.length > 0 ? orderedIds : undefined;
}

function resolveOrder(component: SortableListSeed, persistedOrder: string[] | undefined) {
  const itemIds = component.items.map((item) => item.id);
  if (!persistedOrder) {
    return {
      source: "mdx" as const,
      orderedIds: itemIds,
      staleIds: [],
      appendedIds: []
    };
  }

  const knownIds = new Set(itemIds);
  const staleIds = persistedOrder.filter((itemId) => !knownIds.has(itemId));
  const retainedIds = persistedOrder.filter((itemId) => knownIds.has(itemId));
  const retainedIdSet = new Set(retainedIds);
  const appendedIds = itemIds.filter((itemId) => !retainedIdSet.has(itemId));

  return {
    source: "state" as const,
    orderedIds: [...retainedIds, ...appendedIds],
    staleIds,
    appendedIds
  };
}

function createInspectWarnings(id: string, staleIds: string[]) {
  if (staleIds.length === 0) {
    return [];
  }

  return [`SortableList ${id} state contains stale orderedIds ignored by inspect: ${staleIds.join(", ")}.`];
}

function formatInspectResult(result: InteractionsInspectResult) {
  return [
    "interactions inspect ok",
    `source: ${result.source.path}`,
    `state: ${result.state.path}${result.state.exists ? "" : " (not found)"}`,
    `component: ${result.component.id}`,
    `order source: ${result.order.source}`,
    `items: ${result.component.items.length}`,
    "order:",
    ...result.order.orderedIds.map((itemId, index) => {
      const item = result.component.items.find((candidate) => candidate.id === itemId);
      return `${index + 1}. ${itemId}${item ? ` - ${item.title}` : ""}`;
    }),
    ...(result.order.appendedIds.length > 0 ? [`appended: ${result.order.appendedIds.join(", ")}`] : []),
    ...(result.warnings.length > 0 ? ["warnings:", ...result.warnings.map((warning) => `- ${warning}`)] : [])
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
