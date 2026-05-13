import type { ReactNode } from "react";
import { Grid, type AkCollapseAt, type AkGap } from "./Layout";
import { InlineText } from "./InlineText";

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
    <section className={classNames("ak-section ak-comparison-set", className)}>
      <div className="ak-section-header">
        <p className="ak-eyebrow">Comparison Set</p>
        <InlineText as="h2" text={title} variant="title" />
      </div>
      <Grid collapseAt={collapseAt} columns={columns} gap={gap}>
        {children}
      </Grid>
    </section>
  );
}

function ComparisonSetItem({ title, children, value, className }: ComparisonSetItemProps) {
  return (
    <article
      className={classNames("ak-frame ak-surface-outlined ak-padding-md ak-comparison-item", className)}
      data-value={value}
    >
      <InlineText as="h3" text={title} variant="subtitle" />
      <div className="ak-comparison-item-body">{children}</div>
    </article>
  );
}

export const ComparisonSet = Object.assign(ComparisonSetRoot, {
  Item: ComparisonSetItem
});

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
