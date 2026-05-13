import { CodeBlock } from "./CodeBlock";
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

  return (
    <section className={classNames("ak-annotated-code", className)}>
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
            <article className="ak-annotation" data-line={annotation.line} key={`${annotation.line}-${annotation.title ?? annotation.body}`}>
              <div className="ak-annotation-header">
                <span className="ak-annotation-line">Line {annotation.line}</span>
                <SeverityBadge level={annotation.severity ?? "info"} />
              </div>
              {annotation.title ? <InlineText as="h3" text={annotation.title} variant="subtitle" /> : null}
              <MarkdownBody body={annotation.body} variant="compact" />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
