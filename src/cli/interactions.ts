import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createArtifactMeta,
  createArtifactRoute,
  readArtifactState,
  writeArtifactState,
  type ArtifactRoute
} from "./artifact-state";
import { loadConfig } from "./config";
import { extractSortableListSeeds, promoteSortableListOrder, type SortableListSeed } from "./interaction-mdx";
import type { SortableListInteraction } from "../react";

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

type ParsedSetOrderArgs = {
  input: string;
  id: string;
  orderedIds: string[];
};

type ParsedResetArgs = {
  input: string;
  id: string;
};

type ParsedPromoteArgs = {
  input: string;
  id: string;
};

export async function interactionsCommand(projectRoot: string, args: string[]) {
  const [subcommand] = args;

  if (subcommand === "inspect") {
    const options = parseInspectArgs(args.slice(1));
    const result = await inspectInteraction(projectRoot, options.input, options.id);
    console.log(options.json ? JSON.stringify(result, null, 2) : formatInspectResult(result));
    return;
  }

  if (subcommand === "set-order") {
    const options = parseSetOrderArgs(args.slice(1));
    console.log(await setInteractionOrder(projectRoot, options.input, options.id, options.orderedIds));
    return;
  }

  if (subcommand === "reset") {
    const options = parseResetArgs(args.slice(1));
    console.log(await resetInteraction(projectRoot, options.input, options.id));
    return;
  }

  if (subcommand === "promote") {
    const options = parsePromoteArgs(args.slice(1));
    console.log(await promoteInteraction(projectRoot, options.input, options.id));
    return;
  }

  throw new Error(
    "interactions requires a subcommand. Use `artifact-kit interactions inspect <file.mdx> <id> [--json]`, `artifact-kit interactions set-order <file.mdx> <id> --ordered-ids ...`, `artifact-kit interactions reset <file.mdx> <id>`, or `artifact-kit interactions promote <file.mdx> <id>`."
  );
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

export async function setInteractionOrder(projectRoot: string, input: string, id: string, orderedIds: string[]) {
  const { artifact, component } = await loadSortableList(projectRoot, input, id);
  validateOrderedIds(component, orderedIds);

  const state = await readArtifactState(artifact);
  const interaction = createSortableListInteraction(component, orderedIds);
  await writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions: {
      ...state.interactions,
      [id]: interaction
    }
  });

  return [
    "interactions set-order ok",
    `state: ${artifact.stateRelativePath}`,
    `component: ${id}`,
    `items: ${orderedIds.length}`,
    `orderedIds: ${orderedIds.join(", ")}`
  ].join("\n");
}

export async function resetInteraction(projectRoot: string, input: string, id: string) {
  const { artifact } = await loadSortableList(projectRoot, input, id);
  const state = await readArtifactState(artifact);
  const { [id]: _removed, ...interactions } = state.interactions;

  await writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions
  });

  return ["interactions reset ok", `state: ${artifact.stateRelativePath}`, `component: ${id}`].join("\n");
}

export async function promoteInteraction(projectRoot: string, input: string, id: string) {
  const { artifact, component, source } = await loadSortableList(projectRoot, input, id);
  const state = await readArtifactState(artifact);
  const orderedIds = readPersistedOrder(state.interactions[id]);

  if (!orderedIds) {
    return ["interactions promote noop", `source: ${artifact.sourceRelativePath}`, `component: ${id}`, "reason: no runtime overlay"].join("\n");
  }

  validateOrderedIds(component, orderedIds);
  const nextSource = promoteSortableListOrder(source, id, orderedIds);
  await writeFile(artifact.sourcePath, nextSource, "utf8");

  const { [id]: _removed, ...interactions } = state.interactions;
  await writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions
  });

  return [
    "interactions promote ok",
    `source: ${artifact.sourceRelativePath}`,
    `state: ${artifact.stateRelativePath}`,
    `component: ${id}`,
    `orderedIds: ${orderedIds.join(", ")}`
  ].join("\n");
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

function parseSetOrderArgs(args: string[]): ParsedSetOrderArgs {
  const [input, id, ...rest] = args;

  if (!input) {
    throw new Error("interactions set-order requires a .mdx file path.");
  }

  if (!id) {
    throw new Error("interactions set-order requires a component id.");
  }

  const orderedIds = parseOrderedIds(rest);
  return { input, id, orderedIds };
}

function parseResetArgs(args: string[]): ParsedResetArgs {
  const [input, id, ...rest] = args;

  if (!input) {
    throw new Error("interactions reset requires a .mdx file path.");
  }

  if (!id) {
    throw new Error("interactions reset requires a component id.");
  }

  if (rest.length > 0) {
    throw new Error(`Unexpected interactions reset argument: ${rest[0]}`);
  }

  return { input, id };
}

function parsePromoteArgs(args: string[]): ParsedPromoteArgs {
  const [input, id, ...rest] = args;

  if (!input) {
    throw new Error("interactions promote requires a .mdx file path.");
  }

  if (!id) {
    throw new Error("interactions promote requires a component id.");
  }

  if (rest.length > 0) {
    throw new Error(`Unexpected interactions promote argument: ${rest[0]}`);
  }

  return { input, id };
}

function parseOrderedIds(args: string[]) {
  const flagIndex = args.indexOf("--ordered-ids");
  if (flagIndex < 0) {
    throw new Error("interactions set-order requires --ordered-ids <id> [...id].");
  }

  if (flagIndex > 0) {
    throw new Error(`Unexpected interactions set-order argument: ${args[0]}`);
  }

  const orderedIds = args
    .slice(flagIndex + 1)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  if (orderedIds.length === 0) {
    throw new Error("interactions set-order requires at least one ordered id.");
  }

  return orderedIds;
}

async function createArtifactFromInput(projectRoot: string, input: string): Promise<ArtifactRoute> {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  return createArtifactRoute(projectRoot, mdxPath, config.docsDir);
}

async function loadSortableList(projectRoot: string, input: string, id: string) {
  const artifact = await createArtifactFromInput(projectRoot, input);
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

  return { artifact, component, source };
}

function validateOrderedIds(component: SortableListSeed, orderedIds: string[]) {
  const itemIds = component.items.map((item) => item.id);
  const expectedIds = new Set(itemIds);
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const unknownIds = new Set<string>();

  for (const orderedId of orderedIds) {
    if (seenIds.has(orderedId)) {
      duplicateIds.add(orderedId);
    }
    seenIds.add(orderedId);
    if (!expectedIds.has(orderedId)) {
      unknownIds.add(orderedId);
    }
  }

  const missingIds = itemIds.filter((itemId) => !seenIds.has(itemId));
  const errors = [
    duplicateIds.size > 0 ? `duplicate ids: ${Array.from(duplicateIds).join(", ")}` : undefined,
    unknownIds.size > 0 ? `unknown ids: ${Array.from(unknownIds).join(", ")}` : undefined,
    missingIds.length > 0 ? `missing ids: ${missingIds.join(", ")}` : undefined
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Invalid orderedIds for SortableList ${component.id}: ${errors.join("; ")}.`);
  }
}

function createSortableListInteraction(component: SortableListSeed, orderedIds: string[]): SortableListInteraction {
  return {
    type: "sortable-list",
    id: component.id,
    title: component.title,
    orderedIds,
    orderedItems: orderedIds.map((itemId) => {
      const item = component.items.find((candidate) => candidate.id === itemId);
      if (!item) {
        throw new Error(`SortableList item not found: ${itemId}`);
      }
      return item;
    }),
    updatedAt: new Date().toISOString()
  };
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
