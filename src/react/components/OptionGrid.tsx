import { createContext, useContext, type ReactNode } from "react";
import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";

export type OptionGridProps = {
  id?: string;
  title: string;
  children?: ReactNode;
};

export type OptionGridItemProps = {
  id?: string;
  title: string;
  badge?: string;
  summary?: string;
  children?: ReactNode;
};

const OptionGridContext = createContext<{ id?: string; title: string } | null>(null);

function OptionGridRoot({ id, title, children }: OptionGridProps) {
  const targetId = id ?? `option:${slugify(title)}`;

  return (
    <CommentTarget
      className="ak-comment-target-section"
      description="OptionGrid component"
      targetId={targetId}
      title={title}
    >
      <section className="ak-section">
        <div className="ak-section-header">
          <p className="ak-eyebrow">Option Grid</p>
          <InlineText as="h2" variant="title">
            {title}
          </InlineText>
        </div>
        <div className="ak-option-grid">
          <OptionGridContext.Provider value={{ id, title }}>
            {children}
          </OptionGridContext.Provider>
        </div>
      </section>
    </CommentTarget>
  );
}

function OptionGridItemComponent({ children, ...option }: OptionGridItemProps) {
  return <OptionGridItemCard option={option} children={children} />;
}

function OptionGridItemCard({
  option,
  children
}: {
  option: Omit<OptionGridItemProps, "children">;
  children?: ReactNode;
}) {
  const context = useContext(OptionGridContext);
  const title = context?.title ?? "OptionGrid";
  const optionTargetId = createOptionTargetId(context?.id, title, option);

  return (
    <CommentTarget
      className="ak-comment-target-card"
      description={`OptionGrid item in ${title}`}
      targetId={optionTargetId}
      title={option.title}
    >
      <article className="ak-card">
        <div className="ak-card-header">
          <InlineText as="h3" variant="subtitle">
            {option.title}
          </InlineText>
          {option.badge ? (
            <span className="ak-badge ak-badge-default">
              {option.badge}
            </span>
          ) : null}
        </div>
        {option.summary ? (
          <InlineText as="p" className="ak-muted">
            {option.summary}
          </InlineText>
        ) : null}
        {children ? <div className="ak-card-body">{children}</div> : null}
      </article>
    </CommentTarget>
  );
}

function createOptionTargetId(
  parentId: string | undefined,
  title: string,
  option: Omit<OptionGridItemProps, "children">
) {
  if (parentId) {
    return `${parentId}.${option.id ?? slugify(option.title)}`;
  }

  return option.id ?? `option:${slugify(title)}:${slugify(option.title)}`;
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

export const OptionGrid = Object.assign(OptionGridRoot, {
  Item: OptionGridItemComponent
});
