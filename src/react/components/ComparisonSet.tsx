import type { ReactNode } from "react";
import { Grid, type AkCollapseAt, type AkGap } from "./Layout";
import { InlineText } from "./InlineText";
import { CommentTarget } from "./Comments";

export type ComparisonSetProps = {
  title: string;
  children: ReactNode;
  columns?: 2 | 3 | 4;
  gap?: AkGap;
  collapseAt?: AkCollapseAt;
  className?: string;
};

export type ComparisonSetItemProps = {
  title: string;
  children: ReactNode;
  value?: string;
  className?: string;
};

function ComparisonSetRoot({ title, children, columns = 2, gap = "md", collapseAt = "md", className }: ComparisonSetProps) {
  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="ComparisonSet component"
      targetId={`comparison:${slugify(title)}`}
      title={title}
    >
      <section className="ak-section ak-comparison-set">
        <div className="ak-section-header">
          <p className="ak-eyebrow">Comparison Set</p>
          <InlineText as="h2" text={title} variant="title" />
        </div>
        <Grid collapseAt={collapseAt} columns={columns} gap={gap}>
          {children}
        </Grid>
      </section>
    </CommentTarget>
  );
}

function ComparisonSetItem({ title, children, value, className }: ComparisonSetItemProps) {
  const targetId = `comparison:${slugify(value ?? title)}`;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-card", className)}
      description="ComparisonSet item"
      targetId={targetId}
      title={title}
    >
      <article
        className="ak-frame ak-surface-outlined ak-padding-md ak-comparison-item"
        data-value={value}
      >
        <InlineText as="h3" text={title} variant="subtitle" />
        <div className="ak-comparison-item-body">{children}</div>
      </article>
    </CommentTarget>
  );
}

export const ComparisonSet = Object.assign(ComparisonSetRoot, {
  Item: ComparisonSetItem
});

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
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
