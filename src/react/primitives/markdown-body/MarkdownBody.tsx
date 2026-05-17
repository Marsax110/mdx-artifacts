import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownBodyVariant = "default" | "compact";

export type MarkdownBodyProps = {
  body?: string;
  children?: ReactNode;
  variant?: MarkdownBodyVariant;
  className?: string;
};

const blockAllowedElements = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "em",
  "del",
  "code",
  "a",
  "br",
  "ul",
  "ol",
  "li",
  "blockquote"
];

const blockComponents: Components = {
  a({ children, href }) {
    return (
      <a href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }
};

export function MarkdownBody({ body, children, variant = "default", className }: MarkdownBodyProps) {
  const classNamesValue = classNames("ak-markdown-body", `ak-markdown-body--${variant}`, className);

  if (hasRenderableChildren(children)) {
    if (typeof children === "string") {
      return <MarkdownBodyFromString body={children} className={classNamesValue} />;
    }

    return <div className={classNamesValue}>{children}</div>;
  }

  if (!body?.trim()) {
    return null;
  }

  return <MarkdownBodyFromString body={body} className={classNamesValue} />;
}

function MarkdownBodyFromString({ body, className }: { body: string; className: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        allowedElements={blockAllowedElements}
        components={blockComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
        unwrapDisallowed
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hasRenderableChildren(children: ReactNode) {
  return children !== undefined && children !== null && children !== false;
}
