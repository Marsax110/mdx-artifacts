import { createContext, useContext, type ReactNode } from "react";
import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";

export type DecisionMatrixProps = {
  id?: string;
  title: string;
  children?: ReactNode;
};

export type DecisionMatrixOptionProps = {
  id?: string;
  title: string;
  badge?: string;
  summary?: string;
  children?: ReactNode;
};

const DecisionMatrixContext = createContext<{ id?: string; title: string } | null>(null);

function DecisionMatrixRoot({ id, title, children }: DecisionMatrixProps) {
  const targetId = id ?? `decision:${slugify(title)}`;

  return (
    <CommentTarget
      className="ak-comment-target-section"
      description="DecisionMatrix component"
      targetId={targetId}
      title={title}
    >
      <section className="ak-section ak-decision-matrix">
        <div className="ak-section-header">
          <p className="ak-eyebrow">Decision Matrix</p>
          <InlineText as="h2" variant="title">
            {title}
          </InlineText>
        </div>
        <div className="ak-decision-grid">
          <DecisionMatrixContext.Provider value={{ id, title }}>
            {children}
          </DecisionMatrixContext.Provider>
        </div>
      </section>
    </CommentTarget>
  );
}

function DecisionMatrixOptionComponent({ children, ...option }: DecisionMatrixOptionProps) {
  return <DecisionMatrixOptionCard option={option} children={children} />;
}

function DecisionMatrixOptionCard({
  option,
  children
}: {
  option: Omit<DecisionMatrixOptionProps, "children">;
  children?: ReactNode;
}) {
  const context = useContext(DecisionMatrixContext);
  const title = context?.title ?? "DecisionMatrix";
  const optionTargetId = createOptionTargetId(context?.id, title, option);

  return (
    <CommentTarget
      className="ak-comment-target-card"
      description={`DecisionMatrix option in ${title}`}
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
  option: Omit<DecisionMatrixOptionProps, "children">
) {
  if (parentId) {
    return `${parentId}.${option.id ?? slugify(option.title)}`;
  }

  return option.id ?? `decision:${slugify(title)}:${slugify(option.title)}`;
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

export const DecisionMatrix = Object.assign(DecisionMatrixRoot, {
  Option: DecisionMatrixOptionComponent
});
