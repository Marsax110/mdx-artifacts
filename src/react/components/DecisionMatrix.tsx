import { createContext, useContext, type ReactNode } from "react";
import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";

export type DecisionMatrixOption = {
  id?: string;
  name: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  risks?: string[];
  confidence?: "low" | "medium" | "high";
  verdict?: string;
};

export type DecisionMatrixProps = {
  id?: string;
  question: string;
  options?: DecisionMatrixOption[];
  children?: ReactNode;
};

export type DecisionMatrixOptionProps = DecisionMatrixOption & {
  children?: ReactNode;
};

const DecisionMatrixContext = createContext<{ id?: string; question: string } | null>(null);

function DecisionMatrixRoot({ id, question, options = [], children }: DecisionMatrixProps) {
  const targetId = id ?? `decision:${slugify(question)}`;

  return (
    <CommentTarget
      className="ak-comment-target-section"
      description="DecisionMatrix component"
      targetId={targetId}
      title={question}
    >
      <section className="ak-section ak-decision-matrix">
        <div className="ak-section-header">
          <p className="ak-eyebrow">Decision Matrix</p>
          <InlineText as="h2" variant="title">
            {question}
          </InlineText>
        </div>
        <div className="ak-decision-grid">
          <DecisionMatrixContext.Provider value={{ id, question }}>
            {options.map((option, index) => (
              <DecisionMatrixOptionCard key={option.id ?? option.name} option={option} index={index} />
            ))}
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
  index,
  children
}: {
  option: DecisionMatrixOption;
  index?: number;
  children?: ReactNode;
}) {
  const context = useContext(DecisionMatrixContext);
  const question = context?.question ?? "DecisionMatrix";
  const optionTargetId = createOptionTargetId(context?.id, question, option, index);

  return (
    <CommentTarget
      className="ak-comment-target-card"
      description={`DecisionMatrix option in ${question}`}
      targetId={optionTargetId}
      title={option.name}
    >
      <article className="ak-card">
        <div className="ak-card-header">
          <InlineText as="h3" variant="subtitle">
            {option.name}
          </InlineText>
          {option.confidence ? (
            <span className={`ak-badge ak-badge-${option.confidence}`}>
              {option.confidence}
            </span>
          ) : null}
        </div>
        {option.summary ? (
          <InlineText as="p" className="ak-muted">
            {option.summary}
          </InlineText>
        ) : null}
        <ListBlock title="Pros" items={option.pros} />
        <ListBlock title="Cons" items={option.cons} />
        <ListBlock title="Risks" items={option.risks} />
        {children ? <div className="ak-card-body">{children}</div> : null}
        {option.verdict ? (
          <InlineText as="p" className="ak-verdict">
            {option.verdict}
          </InlineText>
        ) : null}
      </article>
    </CommentTarget>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="ak-list-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <InlineText>{item}</InlineText>
          </li>
        ))}
      </ul>
    </div>
  );
}

function createOptionTargetId(
  parentId: string | undefined,
  question: string,
  option: DecisionMatrixOption,
  index: number | undefined
) {
  if (parentId) {
    return `${parentId}.${option.id ?? (index === undefined ? slugify(option.name) : `${index + 1}`)}`;
  }

  if (index === undefined) {
    return option.id ?? `decision:${slugify(question)}:${slugify(option.name)}`;
  }

  return `decision:${slugify(question)}:${index + 1}:${slugify(option.name)}`;
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
