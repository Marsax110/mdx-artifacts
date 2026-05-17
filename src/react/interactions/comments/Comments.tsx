import type { CSSProperties, FormEvent, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  createArtifactThreadsFromState as createThreadsFromState,
  type ArtifactStateMessage,
  type ArtifactStateReviewThread,
  useOptionalArtifactState
} from "../artifact-state/ArtifactState";
import { InlineText } from "../../primitives/inline-text/InlineText";

export { createArtifactCommentsFromState, createArtifactThreadsFromState } from "../artifact-state/ArtifactState";

export type ArtifactComment = {
  id: string;
  blockId: string;
  blockTitle: string;
  blockDescription?: string;
  comment: string;
  createdAt: string;
};

export type CommentExportValue = {
  comments?: ArtifactComment[];
  threads?: ArtifactReviewThread[];
};

export type ArtifactReviewMessage = ArtifactStateMessage;
export type ArtifactReviewThread = ArtifactStateReviewThread;

export type CommentLayerProps = {
  children: ReactNode;
};

export type CommentableBlockProps = {
  blockId: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export type CommentTargetProps = {
  targetId: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export type CommentExportFormat = "markdown" | "json";

export type CommentExportProps = {
  title?: string;
  formats?: CommentExportFormat[];
};

export type AddCommentInput = {
  blockId: string;
  blockTitle: string;
  blockDescription?: string;
  comment: string;
};

type CommentLayerValue = {
  activeTargetId?: string;
  threads: ArtifactReviewThread[];
  addComment: (input: AddCommentInput) => void;
  closePanel: (targetId: string) => void;
  closeTarget: () => void;
  getActiveTarget: () => CommentTargetAnchor | undefined;
  getPanels: () => CommentReviewPanel[];
  getUnplacedPanels: () => CommentReviewPanel[];
  getTargetNumber: (targetId: string) => number | undefined;
  openTarget: (input: OpenCommentTargetInput) => void;
  registerTarget: (input: RegisterCommentTargetInput) => void;
  updateComment: (commentId: string, comment: string) => void;
};

type OpenCommentTargetInput = {
  targetId: string;
  rect: DOMRect;
};

type RegisterCommentTargetInput = {
  targetId: string;
  title: string;
  description?: string;
  rect: DOMRect;
  contentRect: DOMRect | undefined;
};

type CommentTargetAnchor = {
  targetId: string;
  title: string;
  description?: string;
  top: number;
  side: "left" | "right";
};

type CommentReviewPanel = {
  isActive?: boolean;
  number: number;
  side: "left" | "right";
  targetId: string;
  thread?: ArtifactReviewThread;
  title: string;
  top: number;
};

const CommentContext = createContext<CommentLayerValue | null>(null);

export function CommentLayer({ children }: CommentLayerProps) {
  const artifactState = useOptionalArtifactState();
  const [activeTargetId, setActiveTargetId] = useState<string | undefined>();
  const [threads, setThreads] = useState<ArtifactReviewThread[]>([]);
  const [openTargetIds, setOpenTargetIds] = useState<string[]>([]);
  const [targets, setTargets] = useState<Record<string, CommentTargetAnchor>>({});
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const nextId = useRef(1);
  const pendingPersistThreads = useRef<ArtifactReviewThread[] | undefined>(undefined);
  const panels = createReviewPanels(activeTargetId, threads, openTargetIds, targetIds, targets);
  const unplacedPanels = createUnplacedReviewPanels(threads, targetIds, targets);

  useEffect(() => {
    if (!artifactState?.state) {
      return;
    }

    const savedThreads = createThreadsFromState(artifactState.state);
    if (savedThreads.length === 0) {
      return;
    }

    setThreads((current) => (sameReviewThreads(current, savedThreads) ? current : savedThreads));
    setOpenTargetIds((current) =>
      current.length > 0 ? current : uniqueValues(savedThreads.map((thread) => thread.blockId))
    );
  }, [artifactState?.state]);

  useEffect(() => {
    if (!artifactState || pendingPersistThreads.current !== threads) {
      return;
    }

    pendingPersistThreads.current = undefined;
    void artifactState.actions.saveThreads(threads);
  }, [artifactState, threads]);

  const value = useMemo<CommentLayerValue>(
    () => ({
      activeTargetId,
      threads,
      addComment(input) {
        const thread = createArtifactThread(input, `thread-${nextId.current}`, `comment-${nextId.current}`, new Date().toISOString());
        if (!thread) {
          return;
        }

        const nextThreads = threads.some((item) => item.blockId === thread.blockId)
          ? threads.map((item) => (item.blockId === thread.blockId ? replaceUserMessage(item, thread.messages[0]) : item))
          : [...threads, thread];

        nextId.current += 1;
        pendingPersistThreads.current = nextThreads;
        setThreads(nextThreads);
        setOpenTargetIds((current) => (current.includes(thread.blockId) ? current : [...current, thread.blockId]));
      },
      closePanel(targetId) {
        setOpenTargetIds((current) => current.filter((item) => item !== targetId));
        setActiveTargetId((current) => (current === targetId ? undefined : current));
      },
      closeTarget() {
        setActiveTargetId(undefined);
      },
      getActiveTarget() {
        return activeTargetId ? targets[activeTargetId] : undefined;
      },
      getPanels() {
        return panels;
      },
      getUnplacedPanels() {
        return unplacedPanels;
      },
      getTargetNumber(targetId) {
        const index = targetIds.indexOf(targetId);
        return index >= 0 ? index + 1 : undefined;
      },
      openTarget(input) {
        setActiveTargetId((current) => (current === input.targetId ? undefined : input.targetId));
        setOpenTargetIds((current) =>
          current.includes(input.targetId)
            ? current.filter((item) => item !== input.targetId)
            : [...current, input.targetId]
        );
      },
      registerTarget(input) {
        const nextTarget = anchorFromRect(input);
        setTargetIds((current) => (current.includes(input.targetId) ? current : [...current, input.targetId]));
        setTargets((current) => {
          const previous = current[input.targetId];
          if (previous && sameAnchor(previous, nextTarget)) {
            return current;
          }
          return { ...current, [input.targetId]: nextTarget };
        });
      },
      updateComment(commentId, comment) {
        const normalized = comment.trim();
        if (!normalized) {
          return;
        }

        const nextThreads = threads.map((thread) => ({
          ...thread,
          messages: thread.messages.map((message) =>
            message.id === commentId && message.role === "user" ? { ...message, body: normalized } : message
          )
        }));
        pendingPersistThreads.current = nextThreads;
        setThreads(nextThreads);
      }
    }),
    [activeTargetId, panels, targetIds, targets, threads, unplacedPanels]
  );

  const isReviewLayoutActive =
    (activeTargetId !== undefined && targets[activeTargetId] !== undefined) ||
    openTargetIds.some((targetId) => targets[targetId] !== undefined);

  return (
    <CommentContext.Provider value={value}>
      <div
        className={classNames(
          "ak-review-layout",
          isReviewLayoutActive ? "ak-review-layout-active" : "ak-review-layout-inactive"
        )}
      >
        <CommentReviewRail side="left" />
        <div className="ak-review-content">{children}</div>
        <CommentReviewRail side="right" />
      </div>
      <UnplacedReviewDock />
    </CommentContext.Provider>
  );
}

export function CommentableBlock({ blockId, title, description, children, className }: CommentableBlockProps) {
  return (
    <CommentTarget className={className} description={description} targetId={blockId} title={title}>
      {children}
    </CommentTarget>
  );
}

export function CommentTarget({ targetId, title, description, children, className }: CommentTargetProps) {
  const layer = useOptionalCommentLayer();
  const targetRef = useRef<HTMLElement | null>(null);
  const [isCompactPopoverOpen, setCompactPopoverOpen] = useState(false);
  const [isCompactComposerOpen, setCompactComposerOpen] = useState(false);
  const [compactDraft, setCompactDraft] = useState("");
  const [compactEditingCommentId, setCompactEditingCommentId] = useState<string | undefined>();
  const [compactEditingDraft, setCompactEditingDraft] = useState("");
  const blockThread = layer?.threads.find((thread) => thread.blockId === targetId);
  const blockMessageCount = blockThread?.messages.length ?? 0;
  const targetNumber = layer?.getTargetNumber(targetId);
  const isOpen = layer?.activeTargetId === targetId;

  useEffect(() => {
    if (!layer) {
      return;
    }

    function registerCurrentTarget() {
      const rect = targetRef.current?.getBoundingClientRect();
      if (!rect || !layer) {
        return;
      }

      layer.registerTarget({
        targetId,
        title,
        description,
        rect,
        contentRect: findReviewContentRect(targetRef.current)
      });
    }

    registerCurrentTarget();
    window.addEventListener("resize", registerCurrentTarget);
    window.addEventListener("scroll", registerCurrentTarget, true);

    return () => {
      window.removeEventListener("resize", registerCurrentTarget);
      window.removeEventListener("scroll", registerCurrentTarget, true);
    };
  }, [description, targetId, title]);

  if (!layer) {
    return <>{children}</>;
  }

  function toggleTarget() {
    if (!layer) {
      return;
    }

    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    layer.openTarget({
      targetId,
      rect
    });
  }

  function closeCompactPopover() {
    setCompactPopoverOpen(false);
    setCompactEditingCommentId(undefined);
    setCompactEditingDraft("");
  }

  function closeCompactComposer() {
    setCompactComposerOpen(false);
  }

  function handleMarkerClick() {
    if (isCompactReviewLayout()) {
      setCompactPopoverOpen((current) => !current);
      setCompactComposerOpen(false);
      return;
    }

    toggleTarget();
  }

  function handleAffordanceClick() {
    if (isCompactReviewLayout()) {
      setCompactComposerOpen((current) => !current);
      setCompactPopoverOpen(false);
      return;
    }

    toggleTarget();
  }

  function submitCompactComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!layer) {
      return;
    }

    if (!compactDraft.trim()) {
      return;
    }

    layer.addComment({
      blockId: targetId,
      blockTitle: title,
      blockDescription: description,
      comment: compactDraft
    });
    setCompactDraft("");
    setCompactComposerOpen(false);
  }

  function beginCompactEdit(message: ArtifactReviewMessage) {
    setCompactEditingCommentId(message.id);
    setCompactEditingDraft(message.body);
  }

  function cancelCompactEdit() {
    setCompactEditingCommentId(undefined);
    setCompactEditingDraft("");
  }

  function submitCompactEdit(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    if (!layer) {
      return;
    }

    layer.updateComment(commentId, compactEditingDraft);
    cancelCompactEdit();
  }

  return (
    <section
      className={classNames(
        "ak-comment-target-block",
        blockThread ? "ak-comment-target-has-comments" : undefined,
        isOpen ? "ak-comment-target-selected" : undefined,
        isCompactPopoverOpen ? "ak-comment-target-popover-open" : undefined,
        isCompactComposerOpen ? "ak-comment-target-composer-open" : undefined,
        className
      )}
      data-comment-target-id={targetId}
      data-anchor-id={targetId}
      id={targetId}
      ref={targetRef}
    >
      <div className="ak-comment-target-content">{children}</div>
      {blockThread ? (
        <span className="ak-comment-marker-anchor">
          <button
            aria-label={`Show comments on ${title}`}
            className="ak-comment-marker"
            onClick={handleMarkerClick}
            type="button"
          >
            #{targetNumber ?? "?"} · {blockMessageCount}
          </button>
          <CommentTargetPopover
            editingCommentId={compactEditingCommentId}
            editingDraft={compactEditingDraft}
            number={targetNumber}
            onBeginEdit={beginCompactEdit}
            onCancelEdit={cancelCompactEdit}
            onClose={closeCompactPopover}
            onEditingDraftChange={setCompactEditingDraft}
            onSubmitEdit={submitCompactEdit}
            thread={blockThread}
            title={title}
          />
        </span>
      ) : null}
      {!blockThread ? (
        <span className="ak-comment-affordance-anchor">
          <button
            aria-label={`Comment on ${title}`}
            className="ak-comment-affordance"
            onClick={handleAffordanceClick}
            type="button"
          >
            Comment
          </button>
          <CommentTargetComposer
            draft={compactDraft}
            onDraftChange={setCompactDraft}
            onClose={closeCompactComposer}
            onSubmit={submitCompactComment}
            title={title}
          />
        </span>
      ) : null}
    </section>
  );
}

function CommentTargetComposer({
  draft,
  onDraftChange,
  onClose,
  onSubmit,
  title
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
}) {
  return (
    <aside className="ak-comment-composer-popover" role="dialog">
      <div className="ak-comment-form-header">
        <InlineText as="span" text={title} variant="label" />
        <button aria-label="Close comment composer" className="ak-comment-close-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <form className="ak-comment-form" onSubmit={onSubmit}>
        <textarea
          aria-label={`Comment on ${title}`}
          className="ak-comment-input"
          onChange={(event) => onDraftChange(event.currentTarget.value)}
          placeholder="Write a block-level comment..."
          value={draft}
        />
        <div className="ak-comment-form-actions">
          <button className="ak-button ak-button-primary" disabled={!draft.trim()} type="submit">
            Add comment
          </button>
        </div>
      </form>
    </aside>
  );
}

function CommentTargetPopover({
  editingCommentId,
  editingDraft,
  number,
  onBeginEdit,
  onCancelEdit,
  onClose,
  onEditingDraftChange,
  onSubmitEdit,
  thread,
  title
}: {
  editingCommentId: string | undefined;
  editingDraft: string;
  number: number | undefined;
  onBeginEdit: (message: ArtifactReviewMessage) => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onEditingDraftChange: (value: string) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>, commentId: string) => void;
  thread: ArtifactReviewThread;
  title: string;
}) {
  return (
    <aside className="ak-comment-target-popover" role="dialog">
      <div className="ak-comment-form-header">
        <span className="ak-comment-target-label">#{number ?? "?"}</span>
        <InlineText as="span" text={title} variant="label" />
        <button aria-label="Close comments" className="ak-comment-close-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <ThreadMessageList
        editingCommentId={editingCommentId}
        editingDraft={editingDraft}
        number={number}
        onBeginEdit={onBeginEdit}
        onCancelEdit={onCancelEdit}
        onEditingDraftChange={onEditingDraftChange}
        onSubmitEdit={onSubmitEdit}
        thread={thread}
      />
    </aside>
  );
}

function ThreadMessageList({
  editingCommentId,
  editingDraft,
  number,
  onBeginEdit,
  onCancelEdit,
  onEditingDraftChange,
  onSubmitEdit,
  thread
}: {
  editingCommentId: string | undefined;
  editingDraft: string;
  number: number | undefined;
  onBeginEdit: (message: ArtifactReviewMessage) => void;
  onCancelEdit: () => void;
  onEditingDraftChange: (value: string) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>, commentId: string) => void;
  thread: ArtifactReviewThread;
}) {
  return (
    <ul className="ak-comment-list">
      {thread.messages.map((message, index) => (
        <li className={classNames("ak-comment-item", `ak-comment-item-${message.role}`)} key={message.id}>
          <span className="ak-comment-item-number">#{number ?? "?"}.{index + 1}</span>
          <span className="ak-comment-role-label">{message.role === "assistant" ? "Agent" : "User"}</span>
          {editingCommentId === message.id ? (
            <form className="ak-comment-edit-form" onSubmit={(event) => onSubmitEdit(event, message.id)}>
              <textarea
                aria-label={`Edit comment ${number ?? "?"}.${index + 1}`}
                className="ak-comment-input ak-comment-edit-input"
                onChange={(event) => onEditingDraftChange(event.currentTarget.value)}
                value={editingDraft}
              />
              <div className="ak-comment-form-actions">
                <button className="ak-button" onClick={onCancelEdit} type="button">
                  Cancel
                </button>
                <button className="ak-button ak-button-primary" disabled={!editingDraft.trim()} type="submit">
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <p>{message.body}</p>
              <div className="ak-comment-item-footer">
                {message.createdAt ? <time dateTime={message.createdAt}>{message.createdAt}</time> : <span />}
                {message.role === "user" ? (
                  <button className="ak-comment-edit-button" onClick={() => onBeginEdit(message)} type="button">
                    Edit
                  </button>
                ) : null}
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function CommentReviewRail({ side }: { side: "left" | "right" }) {
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | undefined>();
  const [editingDraft, setEditingDraft] = useState("");
  const [panelHeights, setPanelHeights] = useState<Record<string, number>>({});
  const [railTop, setRailTop] = useState(0);
  const context = useCommentLayer("CommentReviewRail");
  const activeTarget = context.getActiveTarget();
  const panels = context.getPanels().filter((panel) => panel.side === side);
  const positionedPanels = positionReviewPanels(panels, panelHeights, railTop);
  const panelSignature = panels
    .map((panel) => `${panel.targetId}:${panel.thread?.messages.length ?? 0}:${panel.isActive ? "active" : "idle"}`)
    .join("|");
  const railRef = useRef<HTMLElement | null>(null);
  const panelRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    function measurePanels() {
      const nextHeights: Record<string, number> = {};
      panelRefs.current.forEach((element, targetId) => {
        nextHeights[targetId] = element.offsetHeight;
      });

      const nextRailTop = railRef.current
        ? railRef.current.getBoundingClientRect().top + window.scrollY
        : 0;

      setPanelHeights((current) => (samePanelHeights(current, nextHeights) ? current : nextHeights));
      setRailTop((current) => (Math.round(current) === Math.round(nextRailTop) ? current : nextRailTop));
    }

    measurePanels();

    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measurePanels);
    if (railRef.current) {
      observer?.observe(railRef.current);
    }
    panelRefs.current.forEach((element) => observer?.observe(element));
    window.addEventListener("resize", measurePanels);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measurePanels);
    };
  }, [editingCommentId, panelSignature]);

  useEffect(() => {
    setDraft("");
    setEditingCommentId(undefined);
    setEditingDraft("");
  }, [context.activeTargetId]);

  function setPanelRef(targetId: string) {
    return (element: HTMLElement | null) => {
      if (element) {
        panelRefs.current.set(targetId, element);
      } else {
        panelRefs.current.delete(targetId);
      }
    };
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTarget) {
      return;
    }

    if (!draft.trim()) {
      return;
    }

    context.addComment({
      blockId: activeTarget.targetId,
      blockTitle: activeTarget.title,
      blockDescription: activeTarget.description,
      comment: draft
    });
    setDraft("");
    context.closeTarget();
  }

  function beginEdit(message: ArtifactReviewMessage) {
    setEditingCommentId(message.id);
    setEditingDraft(message.body);
  }

  function submitEdit(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    context.updateComment(commentId, editingDraft);
    setEditingCommentId(undefined);
    setEditingDraft("");
  }

  return (
    <aside className={`ak-review-rail ak-review-rail-${side}`} ref={railRef}>
      {positionedPanels.map((panel) => {
        const isActive = panel.targetId === context.activeTargetId;
        return (
          <section
            className={classNames("ak-comment-panel", isActive ? "ak-comment-panel-active" : undefined)}
            key={panel.targetId}
            ref={setPanelRef(panel.targetId)}
            style={commentPanelStyle(panel.top)}
          >
            <div className="ak-comment-form-header">
              <span className="ak-comment-target-label">#{panel.number}</span>
              <InlineText as="span" text={panel.title} variant="label" />
              <button
                aria-label={`Close comments on ${panel.title}`}
                className="ak-comment-close-button"
                onClick={() => context.closePanel(panel.targetId)}
                type="button"
              >
                Close
              </button>
            </div>
            {isActive && !panel.thread ? (
              <form className="ak-comment-form" onSubmit={submitComment}>
                <textarea
                  aria-label={`Comment on ${panel.title}`}
                  className="ak-comment-input"
                  onChange={(event) => setDraft(event.currentTarget.value)}
                  placeholder="Write a block-level comment..."
                  value={draft}
                />
                <div className="ak-comment-form-actions">
                  <button className="ak-button ak-button-primary" disabled={!draft.trim()} type="submit">
                    Add comment
                  </button>
                </div>
              </form>
            ) : null}
            {panel.thread ? (
              <ThreadMessageList
                editingCommentId={editingCommentId}
                editingDraft={editingDraft}
                number={panel.number}
                onBeginEdit={beginEdit}
                onCancelEdit={() => {
                  setEditingCommentId(undefined);
                  setEditingDraft("");
                }}
                onEditingDraftChange={setEditingDraft}
                onSubmitEdit={submitEdit}
                thread={panel.thread}
              />
            ) : null}
          </section>
        );
      })}
    </aside>
  );
}

function UnplacedReviewDock() {
  const context = useCommentLayer("UnplacedReviewDock");
  const panels = context.getUnplacedPanels();
  const [isOpen, setOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | undefined>();
  const [editingDraft, setEditingDraft] = useState("");

  useEffect(() => {
    if (panels.length === 0) {
      setOpen(false);
    }
  }, [panels.length]);

  if (panels.length === 0) {
    return null;
  }

  function beginEdit(message: ArtifactReviewMessage) {
    setEditingCommentId(message.id);
    setEditingDraft(message.body);
  }

  function cancelEdit() {
    setEditingCommentId(undefined);
    setEditingDraft("");
  }

  function submitEdit(event: FormEvent<HTMLFormElement>, commentId: string) {
    event.preventDefault();
    context.updateComment(commentId, editingDraft);
    cancelEdit();
  }

  return (
    <aside className="ak-unplaced-review-dock" aria-label="Unplaced comments">
      <button className="ak-unplaced-review-trigger" onClick={() => setOpen((current) => !current)} type="button">
        Unplaced · {panels.length}
      </button>
      {isOpen ? (
        <div className="ak-unplaced-review-sheet" role="dialog">
          <div className="ak-section-header ak-unplaced-review-header">
            <div>
              <p className="ak-eyebrow">Review</p>
              <InlineText as="h2" text="Unplaced comments" variant="title" />
            </div>
            <button className="ak-button" onClick={() => setOpen(false)} type="button">
              Close
            </button>
          </div>
          <div className="ak-unplaced-review-list">
            {panels.map((panel) => (
              <section className="ak-unplaced-review-card" key={panel.targetId}>
                <div className="ak-comment-form-header">
                  <span className="ak-comment-target-label">#{panel.number}</span>
                  <InlineText as="span" text={panel.title} variant="label" />
                </div>
                <p className="ak-unplaced-review-anchor">Missing anchor: {panel.targetId}</p>
                {panel.thread ? (
                  <ThreadMessageList
                    editingCommentId={editingCommentId}
                    editingDraft={editingDraft}
                    number={panel.number}
                    onBeginEdit={beginEdit}
                    onCancelEdit={cancelEdit}
                    onEditingDraftChange={setEditingDraft}
                    onSubmitEdit={submitEdit}
                    thread={panel.thread}
                  />
                ) : null}
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function CommentExport({ title = "Export Comments", formats = ["markdown", "json"] }: CommentExportProps) {
  const layer = useCommentLayer("CommentExport");
  const [format, setFormat] = useState<CommentExportFormat>(formats[0] ?? "markdown");
  const [isOpen, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportValue: CommentExportValue = { comments: createCommentsFromThreads(layer.threads), threads: layer.threads };
  const output = format === "json" ? JSON.stringify(exportValue, null, 2) : serializeCommentsToMarkdown(exportValue);

  async function copyOutput() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(output);
    } else {
      fallbackCopy(output);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <aside className="ak-export-dock ak-comment-export" aria-label={title}>
      <button className="ak-export-dock-trigger" onClick={() => setOpen((current) => !current)} type="button">
        Comments
      </button>
      {isOpen ? (
        <div className="ak-export-drawer ak-comment-export-drawer" role="dialog">
          <div className="ak-section-header ak-export-header">
            <div>
              <p className="ak-eyebrow">Comments</p>
              <InlineText as="h2" text={title} variant="title" />
            </div>
            <button className="ak-button ak-comment-export-close" onClick={() => setOpen(false)} type="button">
              Close
            </button>
          </div>
          <div className="ak-export-toolbar">
            <Tabs.Root
              className="ak-format-tabs"
              onValueChange={(value) => setFormat(value as CommentExportFormat)}
              value={format}
            >
              <Tabs.List aria-label="Comment export format" className="ak-format-tabs-list">
                {formats.map((item) => (
                  <Tabs.Trigger className="ak-format-trigger" key={item} value={item}>
                    {item}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
            <button className="ak-button ak-button-primary" onClick={copyOutput} type="button">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="ak-export-output">{output}</pre>
        </div>
      ) : null}
    </aside>
  );
}

export function useOptionalCommentExportValue(): CommentExportValue | undefined {
  const layer = useOptionalCommentLayer();
  return layer ? { comments: createCommentsFromThreads(layer.threads), threads: layer.threads } : undefined;
}

export function serializeCommentsToMarkdown(value: CommentExportValue) {
  const threads = value.threads ?? createThreadsFromComments(value.comments ?? []);
  if (threads.length === 0) {
    return "# Artifact comments\n\nNo comments yet.";
  }

  return [
    "# Artifact comments",
    "",
    ...threads.flatMap((thread) => [
      `## ${thread.blockTitle}`,
      `- blockId: ${thread.blockId}`,
      `- status: ${thread.status}`,
      thread.blockDescription ? `- description: ${thread.blockDescription}` : undefined,
      "",
      "### Messages",
      "",
      ...thread.messages.map((message) => {
        const createdAt = message.createdAt ? ` (${message.createdAt})` : "";
        return `- ${message.role}${createdAt}: ${message.body}`;
      }),
      ""
    ].filter(Boolean) as string[])
  ].join("\n").trimEnd();
}

export function createArtifactComment(input: AddCommentInput, id: string, createdAt: string): ArtifactComment | null {
  const normalized = input.comment.trim();
  if (!normalized) {
    return null;
  }

  return {
    id,
    blockId: input.blockId,
    blockTitle: input.blockTitle,
    blockDescription: input.blockDescription,
    comment: normalized,
    createdAt
  };
}

export function createArtifactThread(
  input: AddCommentInput,
  threadId: string,
  messageId: string,
  createdAt: string
): ArtifactReviewThread | null {
  const comment = createArtifactComment(input, messageId, createdAt);
  if (!comment) {
    return null;
  }

  return {
    id: threadId,
    blockId: comment.blockId,
    blockTitle: comment.blockTitle,
    blockDescription: comment.blockDescription,
    status: "open",
    messages: [
      {
        id: comment.id,
        role: "user",
        body: comment.comment,
        createdAt: comment.createdAt
      }
    ]
  };
}

function replaceUserMessage(thread: ArtifactReviewThread, message: ArtifactReviewMessage | undefined) {
  if (!message) {
    return thread;
  }

  const hasUserMessage = thread.messages.some((item) => item.role === "user");
  return {
    ...thread,
    messages: hasUserMessage
      ? thread.messages.map((item) => (item.role === "user" ? { ...item, body: message.body } : item))
      : [message, ...thread.messages]
  };
}

function createCommentsFromThreads(threads: ArtifactReviewThread[]): ArtifactComment[] {
  return threads.flatMap((thread) => {
    const userMessage = thread.messages.find((message) => message.role === "user");
    if (!userMessage) {
      return [];
    }

    return [
      {
        id: userMessage.id,
        blockId: thread.blockId,
        blockTitle: thread.blockTitle,
        blockDescription: thread.blockDescription,
        comment: userMessage.body,
        createdAt: userMessage.createdAt ?? ""
      }
    ];
  });
}

function createThreadsFromComments(comments: ArtifactComment[]): ArtifactReviewThread[] {
  return comments.flatMap((comment) => {
    const thread = createArtifactThread(
      {
        blockId: comment.blockId,
        blockTitle: comment.blockTitle,
        blockDescription: comment.blockDescription,
        comment: comment.comment
      },
      `thread-${comment.id}`,
      comment.id,
      comment.createdAt
    );
    return thread ? [thread] : [];
  });
}

function createReviewPanels(
  activeTargetId: string | undefined,
  threads: ArtifactReviewThread[],
  openTargetIds: string[],
  targetIds: string[],
  targets: Record<string, CommentTargetAnchor>
) {
  const panelMap = new Map<
    string,
    {
      number: number;
      side: "left" | "right";
      targetId: string;
      thread?: ArtifactReviewThread;
      title: string;
      top: number;
      isActive?: boolean;
    }
  >();

  for (const thread of threads) {
    if (!openTargetIds.includes(thread.blockId) && activeTargetId !== thread.blockId) {
      continue;
    }

    const target = targets[thread.blockId];
    if (!target) {
      continue;
    }

    const number = targetIds.indexOf(thread.blockId) + 1 || panelMap.size + 1;
    panelMap.set(thread.blockId, {
      number,
      side: panelMap.get(thread.blockId)?.side ?? target.side,
      targetId: thread.blockId,
      thread,
      title: thread.blockTitle,
      top: panelMap.get(thread.blockId)?.top ?? target.top,
      isActive: activeTargetId === thread.blockId
    });
  }

  if (activeTargetId && targets[activeTargetId]) {
    const activeTarget = targets[activeTargetId];
    const current = panelMap.get(activeTargetId);
    panelMap.set(activeTargetId, {
      number: targetIds.indexOf(activeTargetId) + 1 || panelMap.size + 1,
      side: activeTarget.side,
      targetId: activeTargetId,
      thread: current?.thread,
      title: activeTarget.title,
      top: activeTarget.top,
      isActive: true
    });
  }

  return Array.from(panelMap.values());
}

function createUnplacedReviewPanels(
  threads: ArtifactReviewThread[],
  targetIds: string[],
  targets: Record<string, CommentTargetAnchor>
) {
  const placedThreadIds = new Set(targetIds);
  const placedCount = targetIds.length;
  let unplacedCount = 0;

  return threads.flatMap<CommentReviewPanel>((thread) => {
    if (targets[thread.blockId] || placedThreadIds.has(thread.blockId)) {
      return [];
    }

    unplacedCount += 1;
    return [
      {
        number: placedCount + unplacedCount,
        side: "right",
        targetId: thread.blockId,
        thread,
        title: thread.blockTitle,
        top: 0
      }
    ];
  });
}

function positionReviewPanels<T extends CommentReviewPanel>(
  panels: T[],
  panelHeights: Record<string, number>,
  railTop: number
) {
  let nextTop = 16;
  return [...panels].sort((first, second) => first.top - second.top).map((panel) => {
    const preferredTop = Math.max(0, panel.top - railTop);
    const top = Math.max(preferredTop, nextTop);
    nextTop = top + (panelHeights[panel.targetId] ?? estimatePanelHeight(panel)) + 12;
    return { ...panel, top };
  });
}

function estimatePanelHeight(panel: { thread?: ArtifactReviewThread; isActive?: boolean }) {
  return 54 + (panel.isActive ? 150 : 0) + (panel.thread?.messages.length ?? 0) * 96;
}

function anchorFromRect(input: RegisterCommentTargetInput): CommentTargetAnchor {
  const side = choosePanelSide(input.rect, input.contentRect);
  return {
    targetId: input.targetId,
    title: input.title,
    description: input.description,
    top: Math.max(0, input.rect.top + window.scrollY),
    side
  };
}

function sameAnchor(previous: CommentTargetAnchor, next: CommentTargetAnchor) {
  return (
    previous.title === next.title &&
    previous.description === next.description &&
    previous.side === next.side &&
    Math.round(previous.top) === Math.round(next.top)
  );
}

function samePanelHeights(first: Record<string, number>, second: Record<string, number>) {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);
  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  return firstKeys.every((key) => Math.round(first[key] ?? 0) === Math.round(second[key] ?? 0));
}

function sameReviewThreads(first: ArtifactReviewThread[], second: ArtifactReviewThread[]) {
  return JSON.stringify(first) === JSON.stringify(second);
}

function isCompactReviewLayout() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1548px)").matches;
}

function choosePanelSide(rect: DOMRect, contentRect: DOMRect | undefined): "left" | "right" {
  if (!contentRect) {
    const rightSpace = window.innerWidth - rect.right;
    const leftSpace = rect.left;
    return rightSpace >= 320 || rightSpace >= leftSpace ? "right" : "left";
  }

  const relativeCenter = rect.left + rect.width / 2 - contentRect.left;
  const leftBand = contentRect.width / 3;
  return relativeCenter <= leftBand ? "left" : "right";
}

function findReviewContentRect(element: HTMLElement | null) {
  return element?.closest(".ak-review-content")?.getBoundingClientRect();
}

function useCommentLayer(componentName: string) {
  const context = useContext(CommentContext);
  if (!context) {
    throw new Error(`${componentName} must be used inside CommentLayer.`);
  }
  return context;
}

function useOptionalCommentLayer() {
  return useContext(CommentContext);
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function commentPanelStyle(top: number) {
  return { "--ak-comment-panel-top": `${top}px` } as CSSProperties;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}
