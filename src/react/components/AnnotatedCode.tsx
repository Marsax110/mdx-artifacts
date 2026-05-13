import { CodeBlock } from "./CodeBlock";
import { CommentTarget } from "./Comments";
import { InlineText } from "./InlineText";
import { MarkdownBody } from "./MarkdownBody";
import { SeverityBadge, type SeverityLevel } from "./SeverityBadge";

export type CodeAnnotation = {
  line: number;
  body: string;
  title?: string;
  severity?: SeverityLevel;
};

export type AnnotatedCodeProps = {
  code: string;
  annotations: CodeAnnotation[];
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
};

export function AnnotatedCode({
  code,
  annotations,
  language,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className
}: AnnotatedCodeProps) {
  const annotationLines = annotations.map((annotation) => annotation.line);
  const highlighted = Array.from(new Set([...highlightLines, ...annotationLines])).sort((a, b) => a - b);
  const title = filename ?? (language ? `${language} annotated code` : "Annotated code");

  return (
    <CommentTarget
      className={classNames("ak-comment-target-section", className)}
      description="AnnotatedCode component"
      targetId={`annotated-code:${slugify(filename ?? language ?? code)}`}
      title={title}
    >
      <section className="ak-annotated-code">
        <CodeBlock
          code={code}
          filename={filename}
          highlightLines={highlighted}
          language={language}
          showLineNumbers={showLineNumbers}
        />
        {annotations.length > 0 ? (
          <div className="ak-annotation-list">
            {annotations.map((annotation) => (
              <CommentTarget
                className="ak-comment-target-section"
                description={`Annotation for line ${annotation.line}`}
                key={`${annotation.line}-${annotation.title ?? annotation.body}`}
                targetId={`annotation:${slugify(title)}:${annotation.line}:${slugify(annotation.title ?? annotation.body)}`}
                title={annotation.title ?? `Line ${annotation.line}`}
              >
                <article className="ak-annotation" data-line={annotation.line}>
                  <div className="ak-annotation-header">
                    <span className="ak-annotation-line">Line {annotation.line}</span>
                    <SeverityBadge level={annotation.severity ?? "info"} />
                  </div>
                  {annotation.title ? <InlineText as="h3" text={annotation.title} variant="subtitle" /> : null}
                  <MarkdownBody body={annotation.body} variant="compact" />
                </article>
              </CommentTarget>
            ))}
          </div>
        ) : null}
      </section>
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
