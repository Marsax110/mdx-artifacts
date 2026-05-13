export type DiffLineType = "add" | "remove" | "context";

export type DiffLine = {
  type: DiffLineType;
  oldLine?: number;
  newLine?: number;
  content: string;
};

export type DiffBlockProps = {
  lines: DiffLine[];
  filename?: string;
  language?: string;
  className?: string;
};

const markers: Record<DiffLineType, string> = {
  add: "+",
  remove: "-",
  context: " "
};

export function DiffBlock({ lines, filename, language, className }: DiffBlockProps) {
  return (
    <figure className={classNames("ak-code-block ak-diff-block", className)}>
      {(filename || language) && (
        <figcaption className="ak-code-header">
          {filename && <span className="ak-code-filename">{filename}</span>}
          {language && <span className="ak-code-language">{language}</span>}
        </figcaption>
      )}
      <pre className="ak-code-pre">
        <code className={language ? `language-${language}` : undefined}>
          {lines.map((line, index) => (
            <span className={classNames("ak-diff-line", `ak-diff-line-${line.type}`)} key={`${line.type}-${index}`}>
              <span className="ak-diff-line-number">{line.newLine ?? line.oldLine ?? ""}</span>
              <span className="ak-diff-marker">{markers[line.type]}</span>
              <span className="ak-diff-line-content">{line.content || "\u00a0"}</span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
