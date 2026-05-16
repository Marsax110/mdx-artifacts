import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useOptionalArtifactState, type ArtifactStateValue } from "./ArtifactState";
import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";

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

export function SortableList({ id, title, summary, items, surface = "outlined", className }: SortableListProps) {
  const artifactState = useOptionalArtifactState();
  const persistedInteraction = artifactState?.state?.interactions[id];
  const persistedOrder = useMemo(() => getPersistedOrder(persistedInteraction), [persistedInteraction]);
  const [orderedIds, setOrderedIds] = useState(() => resolveSortableListOrder(items, persistedOrder));
  const [draggingId, setDraggingId] = useState<string | undefined>();
  const orderedItems = useMemo(() => orderItems(items, orderedIds), [items, orderedIds]);

  useEffect(() => {
    setOrderedIds(resolveSortableListOrder(items, persistedOrder));
  }, [items, persistedOrder]);

  function commitOrder(nextOrderedIds: string[]) {
    setOrderedIds(nextOrderedIds);

    if (!artifactState?.state) {
      return;
    }

    const nextState: ArtifactStateValue = {
      ...artifactState.state,
      interactions: {
        ...artifactState.state.interactions,
        [id]: createSortableListInteraction(id, title, nextOrderedIds, items)
      }
    };

    void artifactState.actions.saveState(nextState);
  }

  function moveItem(activeId: string, targetId: string) {
    const activeItem = items.find((item) => item.id === activeId);
    if (!activeItem || activeItem.disabled || activeId === targetId) {
      return;
    }

    commitOrder(reorderIds(orderedIds, activeId, targetId));
  }

  function moveByOffset(itemId: string, offset: -1 | 1) {
    const item = items.find((candidate) => candidate.id === itemId);
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
        </div>
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
              </div>
            </li>
          ))}
        </ol>
      </section>
    </CommentTarget>
  );
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
