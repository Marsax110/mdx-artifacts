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
  options: DecisionMatrixOption[];
};

export function DecisionMatrix({ id, question, options }: DecisionMatrixProps) {
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
          <InlineText as="h2" text={question} variant="title" />
        </div>
        <div className="ak-decision-grid">
          {options.map((option, index) => {
            const optionTargetId = id
              ? `${id}.${option.id ?? `${index + 1}`}`
              : `decision:${slugify(question)}:${index + 1}:${slugify(option.name)}`;
            return (
              <CommentTarget
                className="ak-comment-target-card"
                description={`DecisionMatrix option in ${question}`}
                key={option.name}
                targetId={optionTargetId}
                title={option.name}
              >
                <article className="ak-card">
                  <div className="ak-card-header">
                    <InlineText as="h3" text={option.name} variant="subtitle" />
                    {option.confidence ? (
                      <span className={`ak-badge ak-badge-${option.confidence}`}>
                        {option.confidence}
                      </span>
                    ) : null}
                  </div>
                  {option.summary ? <InlineText as="p" className="ak-muted" text={option.summary} /> : null}
                  <ListBlock title="Pros" items={option.pros} />
                  <ListBlock title="Cons" items={option.cons} />
                  <ListBlock title="Risks" items={option.risks} />
                  {option.verdict ? <InlineText as="p" className="ak-verdict" text={option.verdict} /> : null}
                </article>
              </CommentTarget>
            );
          })}
        </div>
      </section>
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
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
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
