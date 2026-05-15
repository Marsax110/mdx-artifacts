import { createContext, useContext, type ReactNode } from "react";
import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";

export type OptionGridItem = {
  id?: string;
  name: string;
  intent?: string;
  description?: string;
  tradeoffs?: string[];
};

export type OptionGridProps = {
  id?: string;
  title: string;
  options?: OptionGridItem[];
  children?: ReactNode;
};

export type OptionGridItemProps = OptionGridItem & {
  children?: ReactNode;
};

const OptionGridContext = createContext<{ id?: string; title: string } | null>(null);

function OptionGridRoot({ id, title, options = [], children }: OptionGridProps) {
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
            {options.map((option, index) => (
              <OptionGridItemCard key={option.id ?? option.name} option={option} index={index} />
            ))}
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
  index,
  children
}: {
  option: OptionGridItem;
  index?: number;
  children?: ReactNode;
}) {
  const context = useContext(OptionGridContext);
  const title = context?.title ?? "OptionGrid";
  const optionTargetId = createOptionTargetId(context?.id, title, option, index);

  return (
    <CommentTarget
      className="ak-comment-target-card"
      description={`OptionGrid item in ${title}`}
      targetId={optionTargetId}
      title={option.name}
    >
      <article className="ak-card">
        <InlineText as="h3" variant="subtitle">
          {option.name}
        </InlineText>
        {option.intent ? (
          <InlineText as="p" className="ak-intent">
            {option.intent}
          </InlineText>
        ) : null}
        {option.description ? <InlineText as="p">{option.description}</InlineText> : null}
        {option.tradeoffs?.length ? (
          <ul>
            {option.tradeoffs.map((tradeoff) => (
              <li key={tradeoff}>
                <InlineText>{tradeoff}</InlineText>
              </li>
            ))}
          </ul>
        ) : null}
        {children ? <div className="ak-card-body">{children}</div> : null}
      </article>
    </CommentTarget>
  );
}

function createOptionTargetId(
  parentId: string | undefined,
  title: string,
  option: OptionGridItem,
  index: number | undefined
) {
  if (parentId) {
    return `${parentId}.${option.id ?? (index === undefined ? slugify(option.name) : `${index + 1}`)}`;
  }

  if (index === undefined) {
    return option.id ?? `option:${slugify(title)}:${slugify(option.name)}`;
  }

  return `option:${slugify(title)}:${index + 1}:${slugify(option.name)}`;
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
