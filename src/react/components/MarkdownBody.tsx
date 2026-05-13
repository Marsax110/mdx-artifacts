import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type MarkdownBodyVariant = "default" | "compact";

export type MarkdownBodyProps = {
  body: string;
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

export function MarkdownBody({ body, variant = "default", className }: MarkdownBodyProps) {
  if (!body.trim()) {
    return null;
  }

  return (
    <div className={classNames("ak-markdown-body", `ak-markdown-body--${variant}`, className)}>
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
