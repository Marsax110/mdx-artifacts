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

  return (
    <figure className={classNames("ak-code-block", className)}>
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
  );
}

function splitCodeLines(code: string) {
  const normalized = code.endsWith("\n") ? code.slice(0, -1) : code;
  return normalized.split("\n");
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
