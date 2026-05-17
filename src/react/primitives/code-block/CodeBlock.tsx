import { useState } from "react";
import { CommentTarget } from "../../interactions/comments/Comments";

export type CodeBlockProps = {
  id?: string;
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  copyable?: boolean;
  className?: string;
};

export type CodeBlockViewProps = {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  copyable?: boolean;
};

export function CodeBlock({
  id,
  code,
  language,
  filename,
  showLineNumbers = false,
  highlightLines = [],
  copyable = false,
  className
}: CodeBlockProps) {
  const title = filename ?? (language ? `${language} code block` : "Code block");
  const targetId = id ?? `code:${slugify(filename ?? language ?? code)}`;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="CodeBlock component"
      targetId={targetId}
      title={title}
    >
      <CodeBlockView
        code={code}
        copyable={copyable}
        filename={filename}
        highlightLines={highlightLines}
        language={language}
        showLineNumbers={showLineNumbers}
      />
    </CommentTarget>
  );
}

export function CodeBlockView({
  code,
  language,
  filename,
  showLineNumbers = false,
  highlightLines = [],
  copyable = false
}: CodeBlockViewProps) {
  const [copied, setCopied] = useState(false);
  const lines = splitCodeLines(code);
  const highlighted = new Set(highlightLines);

  async function copyCode() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    } else {
      fallbackCopy(code);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <figure className="ak-code-block">
      {(filename || language || copyable) && (
        <figcaption className="ak-code-header">
          <span className="ak-code-meta">
            {filename && <span className="ak-code-filename">{filename}</span>}
            {language && <span className="ak-code-language">{language}</span>}
          </span>
          {copyable ? (
            <button className="ak-code-copy" onClick={() => void copyCode()} type="button">
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
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
  );
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
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
