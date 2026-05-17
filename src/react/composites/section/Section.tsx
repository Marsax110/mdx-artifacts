import { Children, isValidElement, type ReactNode } from "react";
import { CommentTarget } from "../../components/Comments";

export type SectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, children, className }: SectionProps) {
  const title = getFirstHeadingText(children) ?? id;

  return (
    <CommentTarget className={classNames("ak-comment-target-section", className)} targetId={id} title={title}>
      <div className="ak-section ak-content-section">{children}</div>
    </CommentTarget>
  );
}

function getFirstHeadingText(children: ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    const heading = getHeadingText(child);
    if (heading) {
      return heading;
    }
  }
  return undefined;
}

function getHeadingText(node: ReactNode): string | undefined {
  if (!isValidElement(node)) {
    return undefined;
  }

  if (typeof node.type === "string" && /^h[1-6]$/.test(node.type)) {
    return getTextContent((node.props as { children?: ReactNode }).children);
  }

  return undefined;
}

function getTextContent(node: ReactNode): string | undefined {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    const text = node.map(getTextContent).filter(Boolean).join(" ").trim();
    return text || undefined;
  }

  if (isValidElement(node)) {
    return getTextContent((node.props as { children?: ReactNode }).children);
  }

  return undefined;
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
