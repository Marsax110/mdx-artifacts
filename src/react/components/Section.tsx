import type { ReactNode } from "react";
import { CommentTarget } from "./Comments";
import { InlineText, type InlineTextAs } from "./InlineText";

export type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  level?: SectionLevel;
  description?: string;
  className?: string;
};

export function Section({ id, title, children, level = 2, description, className }: SectionProps) {
  const heading = `h${level}` as InlineTextAs;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description={description}
      targetId={id}
      title={title}
    >
      <div className="ak-section ak-content-section">
        <div className="ak-section-header">
          <InlineText as={heading} text={title} variant={level <= 2 ? "title" : "subtitle"} />
        </div>
        <div className="ak-content-section-body">{children}</div>
      </div>
    </CommentTarget>
  );
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
