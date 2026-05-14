import type { CSSProperties, FormEvent, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  createArtifactCommentsFromState as createCommentsFromState,
  useOptionalArtifactState
} from "./ArtifactState";
import { InlineText } from "./InlineText";

export { createArtifactCommentsFromState } from "./ArtifactState";

export type ArtifactComment = {
  id: string;
  blockId: string;
  blockTitle: string;
  blockDescription?: string;
  comment: string;
  createdAt: string;
};

export type CommentExportValue = {
  comments: ArtifactComment[];
};

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
  comments: ArtifactComment[];
  addComment: (input: AddCommentInput) => void;
  closePanel: (targetId: string) => void;
  closeTarget: () => void;
  getActiveTarget: () => CommentTargetAnchor | undefined;
  getPanels: () => CommentReviewPanel[];
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
  comments: ArtifactComment[];
  isActive?: boolean;
  number: number;
  side: "left" | "right";
  targetId: string;
  title: string;
  top: number;
};

const CommentContext = createContext<CommentLayerValue | null>(null);

export function CommentLayer({ children }: CommentLayerProps) {
  const artifactState = useOptionalArtifactState();
  const [activeTargetId, setActiveTargetId] = useState<string | undefined>();
  const [comments, setComments] = useState<ArtifactComment[]>([]);
  const [openTargetIds, setOpenTargetIds] = useState<string[]>([]);
  const [targets, setTargets] = useState<Record<string, CommentTargetAnchor>>({});
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const nextId = useRef(1);
  const pendingPersistComments = useRef<ArtifactComment[] | undefined>(undefined);
  const didHydrateState = useRef(false);
  const panels = createReviewPanels(activeTargetId, comments, openTargetIds, targetIds, targets);

  useEffect(() => {
    if (didHydrateState.current || !artifactState?.state) {
      return;
    }

    didHydrateState.current = true;
    const savedComments = createCommentsFromState(artifactState.state);
    if (savedComments.length === 0) {
      return;
    }

    setComments((current) => (current.length > 0 ? current : savedComments));
    setOpenTargetIds((current) =>
      current.length > 0 ? current : uniqueValues(savedComments.map((comment) => comment.blockId))
    );
  }, [artifactState?.state]);

  useEffect(() => {
    if (!artifactState || pendingPersistComments.current !== comments) {
      return;
    }

    pendingPersistComments.current = undefined;
    void artifactState.actions.saveComments(comments);
  }, [artifactState, comments]);

  const value = useMemo<CommentLayerValue>(
    () => ({
      activeTargetId,
      comments,
      addComment(input) {
        const comment = createArtifactComment(input, `comment-${nextId.current}`, new Date().toISOString());
        if (!comment) {
          return;
        }

        const nextComments = comments.some((item) => item.blockId === comment.blockId)
          ? comments.map((item) => (item.blockId === comment.blockId ? { ...item, comment: comment.comment } : item))
          : [...comments, comment];

        nextId.current += 1;
        pendingPersistComments.current = nextComments;
        setComments(nextComments);
        setOpenTargetIds((current) => (current.includes(comment.blockId) ? current : [...current, comment.blockId]));
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

        const nextComments = comments.map((item) => (item.id === commentId ? { ...item, comment: normalized } : item));
        pendingPersistComments.current = nextComments;
        setComments(nextComments);
      }
    }),
    [activeTargetId, comments, panels, targetIds, targets]
  );

  const isReviewLayoutActive = activeTargetId !== undefined || openTargetIds.length > 0;

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
  const blockComments = layer?.comments.filter((comment) => comment.blockId === targetId) ?? [];
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

  function beginCompactEdit(comment: ArtifactComment) {
    setCompactEditingCommentId(comment.id);
    setCompactEditingDraft(comment.comment);
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
        blockComments.length > 0 ? "ak-comment-target-has-comments" : undefined,
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
      {blockComments.length > 0 ? (
        <span className="ak-comment-marker-anchor">
          <button
            aria-label={`Show comments on ${title}`}
            className="ak-comment-marker"
            onClick={handleMarkerClick}
            type="button"
          >
            #{targetNumber ?? "?"} · {blockComments.length}
          </button>
          <CommentTargetPopover
            comments={blockComments}
            editingCommentId={compactEditingCommentId}
            editingDraft={compactEditingDraft}
            number={targetNumber}
            onBeginEdit={beginCompactEdit}
            onCancelEdit={cancelCompactEdit}
            onClose={closeCompactPopover}
            onEditingDraftChange={setCompactEditingDraft}
            onSubmitEdit={submitCompactEdit}
            title={title}
          />
        </span>
      ) : null}
      {blockComments.length === 0 ? (
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
  comments,
  editingCommentId,
  editingDraft,
  number,
  onBeginEdit,
  onCancelEdit,
  onClose,
  onEditingDraftChange,
  onSubmitEdit,
  title
}: {
  comments: ArtifactComment[];
  editingCommentId: string | undefined;
  editingDraft: string;
  number: number | undefined;
  onBeginEdit: (comment: ArtifactComment) => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onEditingDraftChange: (value: string) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>, commentId: string) => void;
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
      <CommentList
        comments={comments}
        editingCommentId={editingCommentId}
        editingDraft={editingDraft}
        number={number}
        onBeginEdit={onBeginEdit}
        onCancelEdit={onCancelEdit}
        onEditingDraftChange={onEditingDraftChange}
        onSubmitEdit={onSubmitEdit}
      />
    </aside>
  );
}

function CommentList({
  comments,
  editingCommentId,
  editingDraft,
  number,
  onBeginEdit,
  onCancelEdit,
  onEditingDraftChange,
  onSubmitEdit
}: {
  comments: ArtifactComment[];
  editingCommentId: string | undefined;
  editingDraft: string;
  number: number | undefined;
  onBeginEdit: (comment: ArtifactComment) => void;
  onCancelEdit: () => void;
  onEditingDraftChange: (value: string) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>, commentId: string) => void;
}) {
  return (
    <ul className="ak-comment-list">
      {comments.map((comment, index) => (
        <li className="ak-comment-item" key={comment.id}>
          <span className="ak-comment-item-number">#{number ?? "?"}.{index + 1}</span>
          {editingCommentId === comment.id ? (
            <form className="ak-comment-edit-form" onSubmit={(event) => onSubmitEdit(event, comment.id)}>
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
              <p>{comment.comment}</p>
              <div className="ak-comment-item-footer">
                <time dateTime={comment.createdAt}>{comment.createdAt}</time>
                <button className="ak-comment-edit-button" onClick={() => onBeginEdit(comment)} type="button">
                  Edit
                </button>
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
    .map((panel) => `${panel.targetId}:${panel.comments.length}:${panel.isActive ? "active" : "idle"}`)
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

  function beginEdit(comment: ArtifactComment) {
    setEditingCommentId(comment.id);
    setEditingDraft(comment.comment);
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
            {isActive && panel.comments.length === 0 ? (
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
            {panel.comments.length > 0 ? (
              <CommentList
                comments={panel.comments}
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
              />
            ) : null}
          </section>
        );
      })}
    </aside>
  );
}

export function CommentExport({ title = "Export Comments", formats = ["markdown", "json"] }: CommentExportProps) {
  const layer = useCommentLayer("CommentExport");
  const [format, setFormat] = useState<CommentExportFormat>(formats[0] ?? "markdown");
  const [isOpen, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportValue: CommentExportValue = { comments: layer.comments };
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
  return layer ? { comments: layer.comments } : undefined;
}

export function serializeCommentsToMarkdown(value: CommentExportValue) {
  if (value.comments.length === 0) {
    return "# Artifact comments\n\nNo comments yet.";
  }

  return [
    "# Artifact comments",
    "",
    ...value.comments.flatMap((comment) => [
      `## ${comment.blockTitle}`,
      `- blockId: ${comment.blockId}`,
      comment.blockDescription ? `- description: ${comment.blockDescription}` : undefined,
      `- createdAt: ${comment.createdAt}`,
      `- comment: ${comment.comment}`,
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

function createReviewPanels(
  activeTargetId: string | undefined,
  comments: ArtifactComment[],
  openTargetIds: string[],
  targetIds: string[],
  targets: Record<string, CommentTargetAnchor>
) {
  const panelMap = new Map<
    string,
    {
      comments: ArtifactComment[];
      number: number;
      side: "left" | "right";
      targetId: string;
      title: string;
      top: number;
      isActive?: boolean;
    }
  >();

  for (const comment of comments) {
    if (!openTargetIds.includes(comment.blockId) && activeTargetId !== comment.blockId) {
      continue;
    }

    const number = targetIds.indexOf(comment.blockId) + 1 || panelMap.size + 1;
    const target = targets[comment.blockId];
    panelMap.set(comment.blockId, {
      comments: [...(panelMap.get(comment.blockId)?.comments ?? []), comment],
      number,
      side: panelMap.get(comment.blockId)?.side ?? target?.side ?? "right",
      targetId: comment.blockId,
      title: comment.blockTitle,
      top: panelMap.get(comment.blockId)?.top ?? target?.top ?? 16,
      isActive: activeTargetId === comment.blockId
    });
  }

  if (activeTargetId && targets[activeTargetId]) {
    const activeTarget = targets[activeTargetId];
    const current = panelMap.get(activeTargetId);
    panelMap.set(activeTargetId, {
      comments: current?.comments ?? [],
      number: targetIds.indexOf(activeTargetId) + 1 || panelMap.size + 1,
      side: activeTarget.side,
      targetId: activeTargetId,
      title: activeTarget.title,
      top: activeTarget.top,
      isActive: true
    });
  }

  return Array.from(panelMap.values());
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

function estimatePanelHeight(panel: { comments: ArtifactComment[]; isActive?: boolean }) {
  return 54 + (panel.isActive ? 150 : 0) + panel.comments.length * 96;
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
