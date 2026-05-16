import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createArtifactMeta,
  createArtifactRoute,
  readArtifactState,
  writeArtifactState,
  type ArtifactRoute,
  type ArtifactState
} from "./artifact-state";
import { loadConfig } from "./config";
import {
  addSortableListItem as addSortableListItemSource,
  extractSortableListSeeds,
  promoteSortableListOrder,
  removeSortableListItem as removeSortableListItemSource,
  updateSortableListItem as updateSortableListItemSource,
  type SortableListSeed
} from "./interaction-mdx";
import type { SortableListInteraction, SortableListItem } from "../react";

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

export type InteractionMutationResult = {
  action: string;
  component: string;
  sourcePath: string;
  statePath: string;
  state: ArtifactState;
  itemId?: string;
  orderedIds?: string[];
  status?: "ok" | "noop";
  reason?: string;
};

export async function inspectInteractionService(
  projectRoot: string,
  input: string,
  id: string
): Promise<InteractionsInspectResult> {
  const artifact = await createArtifactFromInput(projectRoot, input);
  const meta = await createArtifactMeta(projectRoot, artifact);
  const state = await readArtifactState(artifact);
  const source = await readFile(artifact.sourcePath, "utf8");
  const component = findSortableList(source, id);
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

export async function setInteractionOrderService(
  projectRoot: string,
  input: string,
  id: string,
  orderedIds: string[]
): Promise<InteractionMutationResult> {
  const { artifact, component } = await loadSortableList(projectRoot, input, id);
  validateOrderedIds(component, orderedIds);

  const state = await readArtifactState(artifact);
  const interaction = createSortableListInteraction(component, orderedIds);
  const nextState = await writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions: {
      ...state.interactions,
      [id]: interaction
    }
  });

  return createMutationResult("set-order", artifact, id, nextState, { orderedIds });
}

export async function resetInteractionService(
  projectRoot: string,
  input: string,
  id: string
): Promise<InteractionMutationResult> {
  const { artifact } = await loadSortableList(projectRoot, input, id);
  const state = await readArtifactState(artifact);
  const { [id]: _removed, ...interactions } = state.interactions;
  const nextState = await writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions
  });

  return createMutationResult("reset", artifact, id, nextState);
}

export async function promoteInteractionService(
  projectRoot: string,
  input: string,
  id: string
): Promise<InteractionMutationResult> {
  const { artifact, component, source } = await loadSortableList(projectRoot, input, id);
  const state = await readArtifactState(artifact);
  const orderedIds = readPersistedOrder(state.interactions[id]);

  if (!orderedIds) {
    return createMutationResult("promote", artifact, id, state, { status: "noop", reason: "no runtime overlay" });
  }

  validateOrderedIds(component, orderedIds);
  const nextSource = promoteSortableListOrder(source, id, orderedIds);
  await writeFile(artifact.sourcePath, nextSource, "utf8");

  const { [id]: _removed, ...interactions } = state.interactions;
  const nextState = await writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions
  });

  return createMutationResult("promote", artifact, id, nextState, { orderedIds });
}

export async function addInteractionItemService(
  projectRoot: string,
  input: string,
  id: string,
  item: SortableListItem,
  options: { afterId?: string } = {}
): Promise<InteractionMutationResult> {
  const { artifact, source } = await loadSortableList(projectRoot, input, id);
  const nextSource = addSortableListItemSource(source, id, item, options);
  const nextComponent = readSortableListFromSource(nextSource, id);
  await writeFile(artifact.sourcePath, nextSource, "utf8");
  const nextState = await syncInteractionOverlay(projectRoot, artifact, id, nextComponent);

  return createMutationResult("add-item", artifact, id, nextState, { itemId: item.id });
}

export async function removeInteractionItemService(
  projectRoot: string,
  input: string,
  id: string,
  itemId: string
): Promise<InteractionMutationResult> {
  const { artifact, source } = await loadSortableList(projectRoot, input, id);
  const nextSource = removeSortableListItemSource(source, id, itemId);
  const nextComponent = readSortableListFromSource(nextSource, id);
  await writeFile(artifact.sourcePath, nextSource, "utf8");
  const nextState = await syncInteractionOverlay(projectRoot, artifact, id, nextComponent);

  return createMutationResult("remove-item", artifact, id, nextState, { itemId });
}

export async function updateInteractionItemService(
  projectRoot: string,
  input: string,
  id: string,
  itemId: string,
  patch: Partial<Omit<SortableListItem, "id">>
): Promise<InteractionMutationResult> {
  const { artifact, source } = await loadSortableList(projectRoot, input, id);
  const nextSource = updateSortableListItemSource(source, id, itemId, patch);
  const nextComponent = readSortableListFromSource(nextSource, id);
  await writeFile(artifact.sourcePath, nextSource, "utf8");
  const nextState = await syncInteractionOverlay(projectRoot, artifact, id, nextComponent);

  return createMutationResult("update-item", artifact, id, nextState, { itemId });
}

async function createArtifactFromInput(projectRoot: string, input: string): Promise<ArtifactRoute> {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  return createArtifactRoute(projectRoot, mdxPath, config.docsDir);
}

async function loadSortableList(projectRoot: string, input: string, id: string) {
  const artifact = await createArtifactFromInput(projectRoot, input);
  const source = await readFile(artifact.sourcePath, "utf8");
  const component = findSortableList(source, id);
  return { artifact, component, source };
}

function findSortableList(source: string, id: string) {
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

  return component;
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

async function syncInteractionOverlay(
  projectRoot: string,
  artifact: ArtifactRoute,
  id: string,
  component: SortableListSeed
) {
  const state = await readArtifactState(artifact);
  const orderedIds = readPersistedOrder(state.interactions[id]);
  if (!orderedIds) {
    return state;
  }

  const nextOrder = resolveOrder(component, orderedIds).orderedIds;
  return writeArtifactState(projectRoot, artifact, {
    ...state,
    interactions: {
      ...state.interactions,
      [id]: createSortableListInteraction(component, nextOrder)
    }
  });
}

function readSortableListFromSource(source: string, id: string) {
  const component = extractSortableListSeeds(source).find((seed) => seed.id === id);
  if (!component) {
    throw new Error(`SortableList not found: ${id}.`);
  }

  return component;
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

function createMutationResult(
  action: string,
  artifact: ArtifactRoute,
  id: string,
  state: ArtifactState,
  extra: Partial<InteractionMutationResult> = {}
): InteractionMutationResult {
  return {
    action,
    component: id,
    sourcePath: artifact.sourceRelativePath,
    statePath: artifact.stateRelativePath,
    state,
    status: extra.status ?? "ok",
    ...extra
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
