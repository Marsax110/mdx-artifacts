import * as Tabs from "@radix-ui/react-tabs";
import { useMemo, useState } from "react";
import { serializeCommentsToMarkdown, useOptionalCommentExportValue } from "../../components/Comments";
import { InlineText } from "../../primitives/inline-text/InlineText";

export type ExportFormat = "markdown" | "json";

export type ExportPanelProps = {
  title?: string;
  formats?: ExportFormat[];
  value: unknown;
};

type ExportSource = "result" | "comments";

export function ExportPanel({ title = "Export Result", formats = ["markdown", "json"], value }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>(formats[0] ?? "markdown");
  const [source, setSource] = useState<ExportSource>("result");
  const [isOpen, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const comments = useOptionalCommentExportValue();
  const hasCommentsSource = Boolean(comments);
  const resolvedSource = source === "comments" && !hasCommentsSource ? "result" : source;

  const output = useMemo(() => {
    if (resolvedSource === "comments" && comments) {
      return format === "json" ? JSON.stringify(comments, null, 2) : serializeCommentsToMarkdown(comments);
    }

    return serialize(value, format);
  }, [comments, format, resolvedSource, value]);

  async function copyOutput() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(output);
    } else {
      fallbackCopy(output);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function updateSource(value: string) {
    setSource(value as ExportSource);
    setCopied(false);
  }

  function updateFormat(value: string) {
    setFormat(value as ExportFormat);
    setCopied(false);
  }

  return (
    <aside className="ak-export-dock" aria-label={title}>
      <button className="ak-export-dock-trigger" onClick={() => setOpen((current) => !current)} type="button">
        Export
      </button>
      {isOpen ? (
        <div className="ak-export-drawer" role="dialog">
          <div className="ak-section-header ak-export-header">
            <div>
              <p className="ak-eyebrow">Export</p>
              <InlineText as="h2" text={title} variant="title" />
            </div>
            <button className="ak-button" onClick={() => setOpen(false)} type="button">
              Close
            </button>
          </div>
          <div className="ak-export-toolbar">
            <Tabs.Root className="ak-format-tabs" onValueChange={updateSource} value={resolvedSource}>
              <Tabs.List aria-label="Export source" className="ak-format-tabs-list">
                <Tabs.Trigger className="ak-format-trigger" value="result">
                  Result
                </Tabs.Trigger>
                {hasCommentsSource ? (
                  <Tabs.Trigger className="ak-format-trigger" value="comments">
                    Comments
                  </Tabs.Trigger>
                ) : null}
              </Tabs.List>
            </Tabs.Root>
            <Tabs.Root className="ak-format-tabs" onValueChange={updateFormat} value={format}>
              <Tabs.List aria-label="Export format" className="ak-format-tabs-list">
                {formats.map((item) => (
                  <Tabs.Trigger className="ak-format-trigger" key={item} value={item}>
                    {item}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
            <button className="ak-button ak-button-primary" onClick={copyOutput} type="button">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="ak-export-output">{output}</pre>
        </div>
      ) : null}
    </aside>
  );
}

function serialize(value: unknown, format: ExportFormat) {
  if (format === "json") {
    return JSON.stringify(value, null, 2);
  }

  return toMarkdown(value);
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

function toMarkdown(value: unknown, depth = 0): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const rendered = toMarkdown(item, depth + 1);
        return `${"  ".repeat(depth)}- ${rendered.replace(/\n/g, `\n${"  ".repeat(depth + 1)}`)}`;
      })
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const rendered = toMarkdown(item, depth + 1);
        if (Array.isArray(item) || (item && typeof item === "object")) {
          return `${"  ".repeat(depth)}- **${key}**:\n${rendered}`;
        }
        return `${"  ".repeat(depth)}- **${key}**: ${rendered}`;
      })
      .join("\n");
  }

  return String(value);
}
