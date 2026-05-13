export type OptionGridItem = {
  name: string;
  intent?: string;
  description?: string;
  tradeoffs?: string[];
};

export type OptionGridProps = {
  title: string;
  options: OptionGridItem[];
};

export function OptionGrid({ title, options }: OptionGridProps) {
  return (
    <section className="ak-section">
      <div className="ak-section-header">
        <p className="ak-eyebrow">Option Grid</p>
        <h2>{title}</h2>
      </div>
      <div className="ak-option-grid">
        {options.map((option) => (
          <article className="ak-card" key={option.name}>
            <h3>{option.name}</h3>
            {option.intent ? <p className="ak-intent">{option.intent}</p> : null}
            {option.description ? <p>{option.description}</p> : null}
            {option.tradeoffs?.length ? (
              <ul>
                {option.tradeoffs.map((tradeoff) => (
                  <li key={tradeoff}>{tradeoff}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
