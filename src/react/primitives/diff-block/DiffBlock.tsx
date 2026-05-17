import { CommentTarget } from "../../interactions/comments/Comments";
import { CodeSurface } from "../code-surface/CodeSurface";

export type DiffLineType = "add" | "remove" | "context";

export type DiffLine = {
  type: DiffLineType;
  oldLine?: number;
  newLine?: number;
  content: string;
};

export type DiffBlockProps = {
  id?: string;
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

export function DiffBlock({ id, lines, filename, language, className }: DiffBlockProps) {
  const title = filename ?? (language ? `${language} diff block` : "Diff block");
  const targetId = id ?? `diff:${slugify(filename ?? language ?? lines.map((line) => line.content).join("-"))}`;

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="DiffBlock component"
      targetId={targetId}
      title={title}
    >
      <CodeSurface className="ak-diff-block" filename={filename} language={language}>
        {lines.map((line, index) => (
          <span className={classNames("ak-diff-line", `ak-diff-line-${line.type}`)} key={`${line.type}-${index}`}>
            <span className="ak-diff-line-number">{line.newLine ?? line.oldLine ?? ""}</span>
            <span className="ak-diff-marker">{markers[line.type]}</span>
            <span className="ak-diff-line-content">{line.content || "\u00a0"}</span>
          </span>
        ))}
      </CodeSurface>
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
