import { InlineText } from "./InlineText";

export type DecisionMatrixOption = {
  name: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  risks?: string[];
  confidence?: "low" | "medium" | "high";
  verdict?: string;
};

export type DecisionMatrixProps = {
  question: string;
  options: DecisionMatrixOption[];
};

export function DecisionMatrix({ question, options }: DecisionMatrixProps) {
  return (
    <section className="ak-section ak-decision-matrix">
      <div className="ak-section-header">
        <p className="ak-eyebrow">Decision Matrix</p>
        <InlineText as="h2" text={question} variant="title" />
      </div>
      <div className="ak-decision-grid">
        {options.map((option) => (
          <article className="ak-card" key={option.name}>
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
        ))}
      </div>
    </section>
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
