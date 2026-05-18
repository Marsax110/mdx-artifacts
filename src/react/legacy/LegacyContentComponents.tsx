import { type ReactNode } from "react";
import {
  ContentSet,
  type ContentItemEmphasis,
  type ContentItemTone,
  type ContentSetColumns,
  type ContentSetSurface
} from "../composites/content-set/ContentItem";

type LegacyListValue = ReactNode[] | readonly ReactNode[];

export type DecisionMatrixOptionProps = {
  id?: string;
  title?: string;
  name?: string;
  badge?: string;
  summary?: string;
  verdict?: string;
  confidence?: string;
  pros?: LegacyListValue;
  cons?: LegacyListValue;
  risks?: LegacyListValue;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
  children?: ReactNode;
};

export type DecisionMatrixProps = {
  id?: string;
  title?: string;
  question?: string;
  options?: DecisionMatrixOptionProps[];
  columns?: ContentSetColumns;
  surface?: ContentSetSurface;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
  className?: string;
  children?: ReactNode;
};

export type OptionGridItemProps = {
  id?: string;
  title?: string;
  name?: string;
  badge?: string;
  summary?: string;
  intent?: string;
  description?: string;
  tradeoffs?: LegacyListValue;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
  children?: ReactNode;
};

export type OptionGridProps = {
  id?: string;
  title: string;
  options?: OptionGridItemProps[];
  columns?: ContentSetColumns;
  surface?: ContentSetSurface;
  tone?: ContentItemTone;
  emphasis?: ContentItemEmphasis;
  className?: string;
  children?: ReactNode;
};

function DecisionMatrixRoot({
  id,
  title,
  question,
  options,
  columns = 3,
  surface,
  tone,
  emphasis,
  className,
  children
}: DecisionMatrixProps) {
  return (
    <ContentSet
      className={className}
      columns={columns}
      emphasis={emphasis}
      id={id}
      surface={surface}
      title={title ?? question ?? "Decision matrix"}
      tone={tone}
    >
      {options?.map((option, index) => (
        <DecisionMatrixOption key={option.id ?? option.title ?? option.name ?? index} {...option} />
      ))}
      {children}
    </ContentSet>
  );
}

function DecisionMatrixOption({
  id,
  title,
  name,
  badge,
  summary,
  verdict,
  confidence,
  pros,
  cons,
  risks,
  tone,
  emphasis,
  children
}: DecisionMatrixOptionProps) {
  return (
    <ContentSet.Item
      badge={badge ?? confidence}
      emphasis={emphasis}
      id={id}
      summary={summary ?? verdict}
      title={title ?? name ?? "Option"}
      tone={tone}
    >
      {children}
      <LegacyList title="Pros" values={pros} />
      <LegacyList title="Cons" values={cons} />
      <LegacyList title="Risks" values={risks} />
    </ContentSet.Item>
  );
}

function OptionGridRoot({
  id,
  title,
  options,
  columns = 3,
  surface,
  tone,
  emphasis,
  className,
  children
}: OptionGridProps) {
  return (
    <ContentSet
      className={className}
      columns={columns}
      emphasis={emphasis}
      id={id}
      surface={surface}
      title={title}
      tone={tone}
    >
      {options?.map((option, index) => (
        <OptionGridItem key={option.id ?? option.title ?? option.name ?? index} {...option} />
      ))}
      {children}
    </ContentSet>
  );
}

function OptionGridItem({
  id,
  title,
  name,
  badge,
  summary,
  intent,
  description,
  tradeoffs,
  tone,
  emphasis,
  children
}: OptionGridItemProps) {
  return (
    <ContentSet.Item
      badge={badge}
      emphasis={emphasis}
      id={id}
      summary={summary ?? intent}
      title={title ?? name ?? "Option"}
      tone={tone}
    >
      {description ? <p>{description}</p> : null}
      {children}
      <LegacyList title="Tradeoffs" values={tradeoffs} />
    </ContentSet.Item>
  );
}

function LegacyList({ title, values }: { title: string; values?: LegacyListValue }) {
  if (!values?.length) {
    return null;
  }

  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {values.map((value, index) => (
          <li key={index}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

export const DecisionMatrix = Object.assign(DecisionMatrixRoot, {
  Option: DecisionMatrixOption
});

export const OptionGrid = Object.assign(OptionGridRoot, {
  Item: OptionGridItem
});
