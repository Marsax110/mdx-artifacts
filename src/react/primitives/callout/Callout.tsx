import type { ReactNode } from "react";
import { CommentTarget } from "../../interactions/comments/Comments";
import { InlineText } from "../inline-text/InlineText";
import { MarkdownBody } from "../markdown-body/MarkdownBody";

export type CalloutTone = "info" | "success" | "warning" | "danger";

export type CalloutProps = {
  id?: string;
  body?: string;
  children?: ReactNode;
  title?: string;
  tone?: CalloutTone;
  className?: string;
};

export function Callout({ id, body, children, title, tone = "info", className }: CalloutProps) {
  const displayTitle = title ?? `${tone} callout`;
  const targetId = id ?? `callout:${slugify(displayTitle)}:${slugify(body ?? textFromChildren(children) ?? displayTitle)}`;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="Callout component"
      targetId={targetId}
      title={displayTitle}
    >
      <aside className={classNames("ak-callout", `ak-callout-${tone}`)}>
        {title ? <InlineText as="h3" variant="subtitle">{title}</InlineText> : null}
        <MarkdownBody body={body} variant="compact">
          {children}
        </MarkdownBody>
      </aside>
    </CommentTarget>
  );
}

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

function textFromChildren(children: ReactNode) {
  return typeof children === "string" ? children : undefined;
}
