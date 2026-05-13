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
  return (
    <aside className={classNames("ak-callout", `ak-callout-${tone}`, className)}>
      {title ? <InlineText as="h3" text={title} variant="subtitle" /> : null}
      <MarkdownBody body={body} variant="compact" />
    </aside>
  );
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
