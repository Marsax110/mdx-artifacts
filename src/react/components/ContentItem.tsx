import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { CommentTarget } from "./Comments";
import { InlineText } from "../primitives/inline-text/InlineText";

export type ContentItemTone = "neutral" | "info" | "positive" | "warning" | "danger" | "accent";
export type ContentItemEmphasis = "default" | "primary" | "subtle";
export type ContentSetLayout = "grid" | "stack";
export type ContentSetColumns = 2 | 3 | 4 | 5;
export type ContentSetSurface = "plain" | "subtle" | "outlined";

export type ContentItemProps = {
  id?: string;
  title: string;
  badge?: string;
  summary?: string;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
  children?: ReactNode;
  className?: string;
};

export type ContentSetProps = {
  id?: string;
  title: string;
  children?: ReactNode;
  layout?: ContentSetLayout;
  columns?: ContentSetColumns;
  surface?: ContentSetSurface;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
  className?: string;
};

export type ContentSetItemProps = ContentItemProps;

const ContentSetContext = createContext<{
  id?: string;
  title: string;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
} | null>(null);

export function ContentItem({
  id,
  title,
  badge,
  summary,
  tone = "neutral",
  emphasis = "default",
  children,
  className
}: ContentItemProps) {
  return (
    <ContentItemCard
      badge={badge}
      className={className}
      description="ContentItem component"
      emphasis={emphasis}
      summary={summary}
      targetId={id ?? `content:${slugify(title)}`}
      title={title}
      tone={tone}
    >
      {children}
    </ContentItemCard>
  );
}

function ContentSetRoot({
  id,
  title,
  children,
  layout = "grid",
  columns = 3,
  surface = "plain",
  tone,
  emphasis,
  className
}: ContentSetProps) {
  const targetId = id ?? `content-set:${slugify(title)}`;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="ContentSet component"
      targetId={targetId}
      title={title}
    >
      <section
        className={classNames(
          "ak-section",
          "ak-content-set",
          `ak-content-set-${layout}`,
          `ak-content-set-surface-${surface}`
        )}
      >
        <div className="ak-section-header">
          <p className="ak-eyebrow">Content Set</p>
          <InlineText as="h2" variant="title">
            {title}
          </InlineText>
        </div>
        <div
          className={classNames("ak-content-set-items", `ak-content-set-items-${layout}`)}
          style={cssVars({ "--ak-content-set-columns": String(columns) })}
        >
          <ContentSetContext.Provider value={{ id, title, tone, emphasis }}>{children}</ContentSetContext.Provider>
        </div>
      </section>
    </CommentTarget>
  );
}

function ContentSetItem({
  id,
  title,
  badge,
  summary,
  tone,
  emphasis,
  children,
  className
}: ContentSetItemProps) {
  const context = useContext(ContentSetContext);
  const resolvedTone = tone ?? context?.tone ?? "neutral";
  const resolvedEmphasis = emphasis ?? context?.emphasis ?? "default";
  const targetId = createItemTargetId(context?.id, context?.title, id, title);

  return (
    <ContentItemCard
      badge={badge}
      className={className}
      description={context ? `ContentSet item in ${context.title}` : "ContentSet item"}
      emphasis={resolvedEmphasis}
      summary={summary}
      targetId={targetId}
      title={title}
      tone={resolvedTone}
    >
      {children}
    </ContentItemCard>
  );
}

function ContentItemCard({
  badge,
  children,
  className,
  description,
  emphasis,
  summary,
  targetId,
  title,
  tone
}: {
  badge?: string;
  children?: ReactNode;
  className?: string;
  description: string;
  emphasis: ContentItemEmphasis;
  summary?: string;
  targetId: string;
  title: string;
  tone: ContentItemTone;
}) {
  return (
    <CommentTarget
      className={classNames("ak-comment-target-card", className)}
      description={description}
      targetId={targetId}
      title={title}
    >
      <article
        className={classNames(
          "ak-content-item",
          `ak-content-item-tone-${tone}`,
          `ak-content-item-emphasis-${emphasis}`
        )}
      >
        <div className="ak-content-item-header">
          <InlineText as="h3" variant="subtitle">
            {title}
          </InlineText>
          {badge ? <span className="ak-content-item-badge">{badge}</span> : null}
        </div>
        {summary ? (
          <InlineText as="p" className="ak-content-item-summary">
            {summary}
          </InlineText>
        ) : null}
        {children ? <div className="ak-content-item-body">{children}</div> : null}
      </article>
    </CommentTarget>
  );
}

export const ContentSet = Object.assign(ContentSetRoot, {
  Item: ContentSetItem
});

function createItemTargetId(
  parentId: string | undefined,
  parentTitle: string | undefined,
  itemId: string | undefined,
  itemTitle: string
) {
  if (parentId) {
    return `${parentId}.${itemId ?? slugify(itemTitle)}`;
  }

  if (parentTitle) {
    return itemId ?? `content-set:${slugify(parentTitle)}:${slugify(itemTitle)}`;
  }

  return itemId ?? `content:${slugify(itemTitle)}`;
}

function cssVars(values: Record<string, string>) {
  return values as CSSProperties;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || "item";
}
