import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type InlineTextAs = "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type InlineTextVariant = "default" | "title" | "subtitle" | "label" | "caption";

export type InlineTextProps = {
  text: string;
  as?: InlineTextAs;
  variant?: InlineTextVariant;
  className?: string;
};

const inlineAllowedElements = ["p", "strong", "em", "del", "code", "a", "br"];

const inlineComponents: Components = {
  p({ children }) {
    return <>{children}</>;
  },
  a({ children, href }) {
    return (
      <a href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }
};

export function InlineText({ text, as: Component = "span", variant = "default", className }: InlineTextProps) {
  return (
    <Component className={classNames("ak-inline-text", `ak-inline-text--${variant}`, className)}>
      <ReactMarkdown
        allowedElements={inlineAllowedElements}
        components={inlineComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
        unwrapDisallowed
      >
        {text}
      </ReactMarkdown>
    </Component>
  );
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
