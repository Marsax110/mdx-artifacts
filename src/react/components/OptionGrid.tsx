import { InlineText } from "./InlineText";

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
        <InlineText as="h2" text={title} variant="title" />
      </div>
      <div className="ak-option-grid">
        {options.map((option) => (
          <article className="ak-card" key={option.name}>
            <InlineText as="h3" text={option.name} variant="subtitle" />
            {option.intent ? <InlineText as="p" className="ak-intent" text={option.intent} /> : null}
            {option.description ? <InlineText as="p" text={option.description} /> : null}
            {option.tradeoffs?.length ? (
              <ul>
                {option.tradeoffs.map((tradeoff) => (
                  <li key={tradeoff}>
                    <InlineText text={tradeoff} />
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
