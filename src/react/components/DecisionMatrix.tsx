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
        <h2>{question}</h2>
      </div>
      <div className="ak-decision-grid">
        {options.map((option) => (
          <article className="ak-card" key={option.name}>
            <div className="ak-card-header">
              <h3>{option.name}</h3>
              {option.confidence ? (
                <span className={`ak-badge ak-badge-${option.confidence}`}>
                  {option.confidence}
                </span>
              ) : null}
            </div>
            {option.summary ? <p className="ak-muted">{option.summary}</p> : null}
            <ListBlock title="Pros" items={option.pros} />
            <ListBlock title="Cons" items={option.cons} />
            <ListBlock title="Risks" items={option.risks} />
            {option.verdict ? <p className="ak-verdict">{option.verdict}</p> : null}
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
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
