import {
  addInteractionItemService,
  inspectInteractionService,
  promoteInteractionService,
  removeInteractionItemService,
  resetInteractionService,
  setInteractionOrderService,
  updateInteractionItemService,
  type InteractionMutationResult,
  type InteractionsInspectResult
} from "./interaction-service";
import type { SortableListItem } from "../react";

export type { InteractionsInspectResult } from "./interaction-service";

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

type ParsedAddItemArgs = {
  input: string;
  id: string;
  item: SortableListItem;
  afterId?: string;
};

type ParsedRemoveItemArgs = {
  input: string;
  id: string;
  itemId: string;
};

type ParsedUpdateItemArgs = {
  input: string;
  id: string;
  itemId: string;
  patch: Partial<Omit<SortableListItem, "id">>;
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

  if (subcommand === "add-item") {
    const options = parseAddItemArgs(args.slice(1));
    console.log(await addInteractionItem(projectRoot, options.input, options.id, options.item, { afterId: options.afterId }));
    return;
  }

  if (subcommand === "remove-item") {
    const options = parseRemoveItemArgs(args.slice(1));
    console.log(await removeInteractionItem(projectRoot, options.input, options.id, options.itemId));
    return;
  }

  if (subcommand === "update-item") {
    const options = parseUpdateItemArgs(args.slice(1));
    console.log(await updateInteractionItem(projectRoot, options.input, options.id, options.itemId, options.patch));
    return;
  }

  throw new Error(
    "interactions requires a subcommand. Use inspect, set-order, reset, promote, add-item, remove-item, or update-item."
  );
}

export function inspectInteraction(projectRoot: string, input: string, id: string) {
  return inspectInteractionService(projectRoot, input, id);
}

export async function setInteractionOrder(projectRoot: string, input: string, id: string, orderedIds: string[]) {
  return formatMutationResult(await setInteractionOrderService(projectRoot, input, id, orderedIds));
}

export async function resetInteraction(projectRoot: string, input: string, id: string) {
  return formatMutationResult(await resetInteractionService(projectRoot, input, id));
}

export async function promoteInteraction(projectRoot: string, input: string, id: string) {
  return formatMutationResult(await promoteInteractionService(projectRoot, input, id));
}

export async function addInteractionItem(
  projectRoot: string,
  input: string,
  id: string,
  item: SortableListItem,
  options: { afterId?: string } = {}
) {
  return formatMutationResult(await addInteractionItemService(projectRoot, input, id, item, options));
}

export async function removeInteractionItem(projectRoot: string, input: string, id: string, itemId: string) {
  return formatMutationResult(await removeInteractionItemService(projectRoot, input, id, itemId));
}

export async function updateInteractionItem(
  projectRoot: string,
  input: string,
  id: string,
  itemId: string,
  patch: Partial<Omit<SortableListItem, "id">>
) {
  return formatMutationResult(await updateInteractionItemService(projectRoot, input, id, itemId, patch));
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

function parseAddItemArgs(args: string[]): ParsedAddItemArgs {
  const [input, id, ...rest] = args;
  if (!input) {
    throw new Error("interactions add-item requires a .mdx file path.");
  }
  if (!id) {
    throw new Error("interactions add-item requires a component id.");
  }

  const options = parseOptionMap(rest, ["item-id", "title", "summary", "badge", "tags", "disabled", "after"], []);
  const itemId = options.values.get("item-id");
  const title = options.values.get("title");
  if (!itemId) {
    throw new Error("interactions add-item requires --item-id <id>.");
  }
  if (!title) {
    throw new Error("interactions add-item requires --title <title>.");
  }

  return {
    input,
    id,
    item: createItemFromOptions(itemId, title, options.values),
    ...(options.values.get("after") ? { afterId: options.values.get("after") } : {})
  };
}

function parseRemoveItemArgs(args: string[]): ParsedRemoveItemArgs {
  const [input, id, ...rest] = args;
  if (!input) {
    throw new Error("interactions remove-item requires a .mdx file path.");
  }
  if (!id) {
    throw new Error("interactions remove-item requires a component id.");
  }

  const options = parseOptionMap(rest, ["item-id"], []);
  const itemId = options.values.get("item-id");
  if (!itemId) {
    throw new Error("interactions remove-item requires --item-id <id>.");
  }

  return { input, id, itemId };
}

function parseUpdateItemArgs(args: string[]): ParsedUpdateItemArgs {
  const [input, id, ...rest] = args;
  if (!input) {
    throw new Error("interactions update-item requires a .mdx file path.");
  }
  if (!id) {
    throw new Error("interactions update-item requires a component id.");
  }

  const options = parseOptionMap(
    rest,
    ["item-id", "title", "summary", "badge", "tags", "disabled"],
    ["clear-summary", "clear-badge", "clear-tags"]
  );
  const itemId = options.values.get("item-id");
  if (!itemId) {
    throw new Error("interactions update-item requires --item-id <id>.");
  }

  const patch = createPatchFromOptions(options.values, options.flags);
  if (Object.keys(patch).length === 0) {
    throw new Error("interactions update-item requires at least one field update.");
  }

  return { input, id, itemId, patch };
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

function parseOptionMap(args: string[], valueKeys: string[], flagKeys: string[]) {
  const values = new Map<string, string>();
  const flags = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (!name?.startsWith("--")) {
      throw new Error(`Unexpected interactions argument: ${name}`);
    }

    const key = name.slice(2);
    if (flagKeys.includes(key)) {
      flags.add(key);
      continue;
    }

    if (!valueKeys.includes(key)) {
      throw new Error(`Unknown interactions option: --${key}.`);
    }

    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}.`);
    }

    values.set(key, value);
    index += 1;
  }

  return { flags, values };
}

function createItemFromOptions(itemId: string, title: string, options: Map<string, string>): SortableListItem {
  return {
    id: itemId,
    title,
    ...createPatchFromOptions(options, new Set())
  };
}

function createPatchFromOptions(
  options: Map<string, string>,
  flags: Set<string>
): Partial<Omit<SortableListItem, "id">> {
  return {
    ...(options.has("title") ? { title: options.get("title") ?? "" } : {}),
    ...(flags.has("clear-summary")
      ? { summary: undefined }
      : options.has("summary")
        ? { summary: options.get("summary") ?? "" }
        : {}),
    ...(flags.has("clear-badge")
      ? { badge: undefined }
      : options.has("badge")
        ? { badge: options.get("badge") ?? "" }
        : {}),
    ...(flags.has("clear-tags") ? { tags: undefined } : options.has("tags") ? { tags: parseTags(options.get("tags") ?? "") } : {}),
    ...(options.has("disabled") ? { disabled: parseBooleanOption(options.get("disabled") ?? "", "disabled") } : {})
  };
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseBooleanOption(value: string, name: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`--${name} must be true or false.`);
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

function formatMutationResult(result: InteractionMutationResult) {
  if (result.action === "promote" && result.status === "noop") {
    return [
      "interactions promote noop",
      `source: ${result.sourcePath}`,
      `component: ${result.component}`,
      `reason: ${result.reason ?? "no runtime overlay"}`
    ].join("\n");
  }

  const lines = [
    `interactions ${result.action} ok`,
    ...(result.action === "reset" || result.action === "set-order" ? [] : [`source: ${result.sourcePath}`]),
    `state: ${result.statePath}`,
    `component: ${result.component}`
  ];

  if (result.itemId) {
    lines.push(`item: ${result.itemId}`);
  }

  if (result.orderedIds) {
    lines.push(`items: ${result.orderedIds.length}`);
    lines.push(`orderedIds: ${result.orderedIds.join(", ")}`);
  }

  return lines.join("\n");
}
