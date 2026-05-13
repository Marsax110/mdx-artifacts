import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";
import { MarkdownBody } from "./MarkdownBody";

export type CalloutTone = "info" | "success" | "warning" | "danger";

export type CalloutProps = {
  body: string;
  title?: string;
  tone?: CalloutTone;
  className?: string;
};

export function Callout({ body, title, tone = "info", className }: CalloutProps) {
  const displayTitle = title ?? `${tone} callout`;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="Callout component"
      targetId={`callout:${slugify(displayTitle)}:${slugify(body)}`}
      title={displayTitle}
    >
      <aside className={classNames("ak-callout", `ak-callout-${tone}`)}>
        {title ? <InlineText as="h3" text={title} variant="subtitle" /> : null}
        <MarkdownBody body={body} variant="compact" />
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
