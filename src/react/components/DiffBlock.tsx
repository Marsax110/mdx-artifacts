import { CommentTarget } from "./Comments";

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
  const title = filename ?? (language ? `${language} diff block` : "Diff block");

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="DiffBlock component"
      targetId={`diff:${slugify(filename ?? language ?? lines.map((line) => line.content).join("-"))}`}
      title={title}
    >
      <figure className="ak-code-block ak-diff-block">
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
