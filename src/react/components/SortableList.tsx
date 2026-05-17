import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useOptionalArtifactState, type ArtifactStateValue } from "./ArtifactState";
import { CommentTarget } from "./Comments";
import { InlineText } from "../primitives/inline-text/InlineText";

export type SortableListSurface = "plain" | "subtle" | "outlined";

export type SortableListItem = {
  id: string;
  title: string;
  summary?: string;
  badge?: string;
  tags?: string[];
  disabled?: boolean;
};

export type SortableListInteraction = {
  type: "sortable-list";
  id: string;
  title: string;
  orderedIds: string[];
  orderedItems: SortableListItem[];
  updatedAt: string;
};

export type SortableListProps = {
  id: string;
  title: string;
  summary?: string;
  items: SortableListItem[];
  surface?: SortableListSurface;
  className?: string;
};

type SortableListItemDraft = {
  id: string;
  title: string;
  summary: string;
  badge: string;
  tags: string;
  disabled: boolean;
};

export function SortableList({ id, title, summary, items, surface = "outlined", className }: SortableListProps) {
  const artifactState = useOptionalArtifactState();
  const writable = artifactState?.meta.daemon?.writable === true;
  const persistedInteraction = artifactState?.state?.interactions[id];
  const persistedOrder = useMemo(() => getPersistedOrder(persistedInteraction), [persistedInteraction]);
  const [currentItems, setCurrentItems] = useState(items);
  const [orderedIds, setOrderedIds] = useState(() => resolveSortableListOrder(currentItems, persistedOrder));
  const [draggingId, setDraggingId] = useState<string | undefined>();
  const [editorMode, setEditorMode] = useState<"add" | "edit" | undefined>();
  const [editingItemId, setEditingItemId] = useState<string | undefined>();
  const [draft, setDraft] = useState(() => createEmptyDraft());
  const [editorStatus, setEditorStatus] = useState<"idle" | "saving" | "error">("idle");
  const [editorError, setEditorError] = useState<string | undefined>();
  const orderedItems = useMemo(() => orderItems(currentItems, orderedIds), [currentItems, orderedIds]);

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  useEffect(() => {
    setOrderedIds(resolveSortableListOrder(currentItems, persistedOrder));
  }, [currentItems, persistedOrder]);

  function commitOrder(nextOrderedIds: string[]) {
    setOrderedIds(nextOrderedIds);

    if (!artifactState?.state) {
      return;
    }

    const nextState: ArtifactStateValue = {
      ...artifactState.state,
      interactions: {
        ...artifactState.state.interactions,
        [id]: createSortableListInteraction(id, title, nextOrderedIds, currentItems)
      }
    };

    void artifactState.actions.saveState(nextState);
  }

  function moveItem(activeId: string, targetId: string) {
    const activeItem = currentItems.find((item) => item.id === activeId);
    if (!activeItem || activeItem.disabled || activeId === targetId) {
      return;
    }

    commitOrder(reorderIds(orderedIds, activeId, targetId));
  }

  function moveByOffset(itemId: string, offset: -1 | 1) {
    const item = currentItems.find((candidate) => candidate.id === itemId);
    if (!item || item.disabled) {
      return;
    }

    const index = orderedIds.indexOf(itemId);
    const targetId = orderedIds[index + offset];
    if (!targetId) {
      return;
    }

    const nextOrderedIds = [...orderedIds];
    nextOrderedIds.splice(index, 1);
    nextOrderedIds.splice(index + offset, 0, itemId);
    commitOrder(nextOrderedIds);
  }

  function handleDragStart(event: DragEvent<HTMLElement>, itemId: string) {
    setDraggingId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, targetId: string) {
    const activeId = draggingId ?? event.dataTransfer.getData("text/plain");
    if (!activeId || activeId === targetId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const activeId = event.dataTransfer.getData("text/plain") || draggingId;
    if (activeId) {
      moveItem(activeId, targetId);
    }
    setDraggingId(undefined);
  }

  function startAddItem() {
    setEditorMode("add");
    setEditingItemId(undefined);
    setDraft(createEmptyDraft());
    setEditorStatus("idle");
    setEditorError(undefined);
  }

  function startEditItem(item: SortableListItem) {
    setEditorMode("edit");
    setEditingItemId(item.id);
    setDraft(createDraftFromItem(item));
    setEditorStatus("idle");
    setEditorError(undefined);
  }

  function cancelEdit() {
    setEditorMode(undefined);
    setEditingItemId(undefined);
    setDraft(createEmptyDraft());
    setEditorStatus("idle");
    setEditorError(undefined);
  }

  async function saveDraft() {
    if (!editorMode || editorStatus === "saving") {
      return;
    }

    const nextItem = createItemFromDraft(draft);
    if (!nextItem.id || !nextItem.title) {
      setEditorStatus("error");
      setEditorError("Item id and title are required.");
      return;
    }

    try {
      setEditorStatus("saving");
      setEditorError(undefined);

      if (editorMode === "add") {
        await postInteraction("/__artifact/interactions/add-item", {
          id,
          item: nextItem,
          afterId: orderedIds[orderedIds.length - 1]
        });
        const nextItems = [...currentItems, nextItem];
        setCurrentItems(nextItems);
        setOrderedIds(resolveSortableListOrder(nextItems, [...orderedIds, nextItem.id]));
      } else if (editingItemId) {
        const patch = createPatchFromDraft(draft);
        await postInteraction("/__artifact/interactions/update-item", {
          id,
          itemId: editingItemId,
          patch: createPatchPayloadFromDraft(draft)
        });
        const nextItems = currentItems.map((item) => (item.id === editingItemId ? { ...item, ...patch } : item));
        setCurrentItems(nextItems);
      }

      cancelEdit();
    } catch (error) {
      setEditorStatus("error");
      setEditorError(error instanceof Error ? error.message : String(error));
    }
  }

  async function deleteItem(item: SortableListItem) {
    if (!window.confirm(`Delete ${item.title}?`)) {
      return;
    }

    try {
      await postInteraction("/__artifact/interactions/remove-item", {
        id,
        itemId: item.id
      });
      const nextItems = currentItems.filter((candidate) => candidate.id !== item.id);
      setCurrentItems(nextItems);
      setOrderedIds(orderedIds.filter((itemId) => itemId !== item.id));
    } catch (error) {
      setEditorStatus("error");
      setEditorError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="SortableList component"
      targetId={id}
      title={title}
    >
      <section className={classNames("ak-section", "ak-sortable-list", `ak-surface-${surface}`, "ak-padding-md")}>
        <div className="ak-section-header">
          <p className="ak-eyebrow">Sortable List</p>
          <InlineText as="h2" text={title} variant="title" />
          {summary ? <InlineText as="p" className="ak-sortable-list-summary" text={summary} /> : null}
          {writable ? (
            <div className="ak-sortable-list-editor-actions">
              <button className="ak-sortable-list-control" onClick={startAddItem} type="button">
                Add item
              </button>
            </div>
          ) : null}
        </div>
        {writable && editorMode ? (
          <SortableListEditor
            draft={draft}
            itemIdLocked={editorMode === "edit"}
            onCancel={cancelEdit}
            onChange={setDraft}
            onSave={saveDraft}
            status={editorStatus}
          />
        ) : null}
        {editorError ? <p className="ak-sortable-list-editor-error">{editorError}</p> : null}
        <ol className="ak-sortable-list-items">
          {orderedItems.map((item, index) => (
            <li
              className={classNames("ak-sortable-list-item", item.disabled ? "ak-sortable-list-item-disabled" : undefined)}
              draggable={!item.disabled}
              key={item.id}
              onDragEnd={() => setDraggingId(undefined)}
              onDragOver={(event) => handleDragOver(event, item.id)}
              onDragStart={(event) => handleDragStart(event, item.id)}
              onDrop={(event) => handleDrop(event, item.id)}
            >
              <div className="ak-sortable-list-rank">{index + 1}</div>
              <div className="ak-sortable-list-content">
                <div className="ak-sortable-list-item-header">
                  <InlineText as="h3" text={item.title} variant="subtitle" />
                  {item.badge ? <span className="ak-sortable-list-badge">{item.badge}</span> : null}
                </div>
                {item.summary ? <InlineText as="p" className="ak-sortable-list-item-summary" text={item.summary} /> : null}
                {item.tags?.length ? (
                  <div className="ak-sortable-list-tags" aria-label={`${item.title} tags`}>
                    {item.tags.map((tag) => (
                      <span className="ak-sortable-list-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="ak-sortable-list-controls">
                <button
                  aria-label={`Move ${item.title} up`}
                  className="ak-sortable-list-control"
                  disabled={item.disabled || index === 0}
                  onClick={() => moveByOffset(item.id, -1)}
                  type="button"
                >
                  Up
                </button>
                <button
                  aria-label={`Move ${item.title} down`}
                  className="ak-sortable-list-control"
                  disabled={item.disabled || index === orderedItems.length - 1}
                  onClick={() => moveByOffset(item.id, 1)}
                  type="button"
                >
                  Down
                </button>
                {writable ? (
                  <>
                    <button
                      aria-label={`Edit ${item.title}`}
                      className="ak-sortable-list-control"
                      onClick={() => startEditItem(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${item.title}`}
                      className="ak-sortable-list-control"
                      onClick={() => void deleteItem(item)}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </CommentTarget>
  );
}

function SortableListEditor({
  draft,
  itemIdLocked,
  onCancel,
  onChange,
  onSave,
  status
}: {
  draft: SortableListItemDraft;
  itemIdLocked: boolean;
  onCancel: () => void;
  onChange: (draft: SortableListItemDraft) => void;
  onSave: () => void;
  status: "idle" | "saving" | "error";
}) {
  return (
    <div className="ak-sortable-list-editor">
      <label className="ak-sortable-list-editor-field">
        <span>Id</span>
        <input
          disabled={itemIdLocked}
          onChange={(event) => onChange({ ...draft, id: event.currentTarget.value })}
          value={draft.id}
        />
      </label>
      <label className="ak-sortable-list-editor-field">
        <span>Title</span>
        <input onChange={(event) => onChange({ ...draft, title: event.currentTarget.value })} value={draft.title} />
      </label>
      <label className="ak-sortable-list-editor-field">
        <span>Summary</span>
        <input onChange={(event) => onChange({ ...draft, summary: event.currentTarget.value })} value={draft.summary} />
      </label>
      <label className="ak-sortable-list-editor-field">
        <span>Badge</span>
        <input onChange={(event) => onChange({ ...draft, badge: event.currentTarget.value })} value={draft.badge} />
      </label>
      <label className="ak-sortable-list-editor-field">
        <span>Tags</span>
        <input onChange={(event) => onChange({ ...draft, tags: event.currentTarget.value })} value={draft.tags} />
      </label>
      <label className="ak-sortable-list-editor-check">
        <input
          checked={draft.disabled}
          onChange={(event) => onChange({ ...draft, disabled: event.currentTarget.checked })}
          type="checkbox"
        />
        <span>Disabled</span>
      </label>
      <div className="ak-sortable-list-editor-buttons">
        <button className="ak-sortable-list-control" disabled={status === "saving"} onClick={onSave} type="button">
          Save
        </button>
        <button className="ak-sortable-list-control" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}

function createEmptyDraft(): SortableListItemDraft {
  return {
    id: "",
    title: "",
    summary: "",
    badge: "",
    tags: "",
    disabled: false
  };
}

function createDraftFromItem(item: SortableListItem): SortableListItemDraft {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary ?? "",
    badge: item.badge ?? "",
    tags: item.tags?.join(", ") ?? "",
    disabled: item.disabled ?? false
  };
}

function createItemFromDraft(draft: SortableListItemDraft): SortableListItem {
  return {
    id: draft.id.trim(),
    title: draft.title.trim(),
    ...createPatchFromDraft(draft)
  };
}

function createPatchFromDraft(draft: SortableListItemDraft): Partial<Omit<SortableListItem, "id">> {
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim() || undefined,
    badge: draft.badge.trim() || undefined,
    tags: parseTagDraft(draft.tags),
    disabled: draft.disabled
  };
}

function createPatchPayloadFromDraft(draft: SortableListItemDraft) {
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim() || null,
    badge: draft.badge.trim() || null,
    tags: parseTagDraft(draft.tags) ?? null,
    disabled: draft.disabled
  };
}

function parseTagDraft(value: string) {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

async function postInteraction(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new Error(isRecord(payload) && typeof payload.error === "string" ? payload.error : "Failed to save item.");
  }

  return response.json();
}

export function createSortableListInteraction(
  id: string,
  title: string,
  orderedIds: string[],
  items: SortableListItem[]
): SortableListInteraction {
  return {
    type: "sortable-list",
    id,
    title,
    orderedIds,
    orderedItems: orderItems(items, orderedIds),
    updatedAt: new Date().toISOString()
  };
}

export function resolveSortableListOrder(items: SortableListItem[], orderedIds: string[] | undefined) {
  const itemIds = items.map((item) => item.id);
  if (!orderedIds) {
    return itemIds;
  }

  const knownItemIds = new Set(itemIds);
  const retainedIds = orderedIds.filter((itemId) => knownItemIds.has(itemId));
  const retainedIdSet = new Set(retainedIds);
  const appendedIds = itemIds.filter((itemId) => !retainedIdSet.has(itemId));
  return [...retainedIds, ...appendedIds];
}

export function reorderIds(orderedIds: string[], activeId: string, targetId: string) {
  const activeIndex = orderedIds.indexOf(activeId);
  const initialTargetIndex = orderedIds.indexOf(targetId);
  if (activeIndex < 0 || initialTargetIndex < 0 || activeIndex === initialTargetIndex) {
    return orderedIds;
  }

  const nextIds = orderedIds.filter((itemId) => itemId !== activeId);
  const targetIndex = nextIds.indexOf(targetId);
  nextIds.splice(targetIndex, 0, activeId);
  return nextIds;
}

function orderItems(items: SortableListItem[], orderedIds: string[]) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  return orderedIds.flatMap((itemId) => {
    const item = itemsById.get(itemId);
    return item ? [item] : [];
  });
}

function getPersistedOrder(interaction: unknown) {
  if (!isRecord(interaction) || !Array.isArray(interaction.orderedIds)) {
    return undefined;
  }

  const orderedIds = interaction.orderedIds.filter((itemId): itemId is string => typeof itemId === "string");
  return orderedIds.length > 0 ? orderedIds : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
