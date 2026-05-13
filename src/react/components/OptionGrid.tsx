import { CommentTarget } from "./Comments";
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
    <CommentTarget
      className="ak-comment-target-section"
      description="OptionGrid component"
      targetId={`option:${slugify(title)}`}
      title={title}
    >
      <section className="ak-section">
        <div className="ak-section-header">
          <p className="ak-eyebrow">Option Grid</p>
          <InlineText as="h2" text={title} variant="title" />
        </div>
        <div className="ak-option-grid">
          {options.map((option, index) => {
            const targetId = `option:${slugify(title)}:${index + 1}:${slugify(option.name)}`;
            return (
              <CommentTarget
                className="ak-comment-target-card"
                description={`OptionGrid item in ${title}`}
                key={option.name}
                targetId={targetId}
                title={option.name}
              >
                <article className="ak-card">
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
              </CommentTarget>
            );
          })}
        </div>
      </section>
    </CommentTarget>
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
