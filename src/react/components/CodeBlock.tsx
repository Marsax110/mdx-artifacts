import { CommentTarget } from "./Comments";

export type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
};

export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = false,
  highlightLines = [],
  className
}: CodeBlockProps) {
  const lines = splitCodeLines(code);
  const highlighted = new Set(highlightLines);
  const title = filename ?? (language ? `${language} code block` : "Code block");

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="CodeBlock component"
      targetId={`code:${slugify(filename ?? language ?? code)}`}
      title={title}
    >
      <figure className="ak-code-block">
        {(filename || language) && (
          <figcaption className="ak-code-header">
            {filename && <span className="ak-code-filename">{filename}</span>}
            {language && <span className="ak-code-language">{language}</span>}
          </figcaption>
        )}
        <pre className="ak-code-pre">
          <code className={language ? `language-${language}` : undefined}>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              return (
                <span
                  className={classNames(
                    "ak-code-line",
                    showLineNumbers ? "ak-code-line-numbered" : undefined,
                    highlighted.has(lineNumber) ? "ak-code-line-highlighted" : undefined
                  )}
                  data-line={lineNumber}
                  key={lineNumber}
                >
                  {showLineNumbers && <span className="ak-code-line-number">{lineNumber}</span>}
                  <span className="ak-code-line-content">{line || "\u00a0"}</span>
                </span>
              );
            })}
          </code>
        </pre>
      </figure>
    </CommentTarget>
  );
}

function splitCodeLines(code: string) {
  const normalized = code.endsWith("\n") ? code.slice(0, -1) : code;
  return normalized.split("\n");
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
