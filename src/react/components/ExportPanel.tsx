import * as Tabs from "@radix-ui/react-tabs";
import { useMemo, useState } from "react";
import { InlineText } from "./InlineText";

export type ExportFormat = "markdown" | "json";

export type ExportPanelProps = {
  title?: string;
  formats?: ExportFormat[];
  value: unknown;
};

export function ExportPanel({ title = "Export Result", formats = ["markdown", "json"], value }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>(formats[0] ?? "markdown");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => serialize(value, format), [format, value]);

  async function copyOutput() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(output);
    } else {
      fallbackCopy(output);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className="ak-section ak-export-panel">
      <div className="ak-section-header ak-export-header">
        <div>
          <p className="ak-eyebrow">Export</p>
          <InlineText as="h2" text={title} variant="title" />
        </div>
        <div className="ak-actions">
          <Tabs.Root
            className="ak-format-tabs"
            onValueChange={(value) => setFormat(value as ExportFormat)}
            value={format}
          >
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
      </div>
      <pre className="ak-export-output">{output}</pre>
    </section>
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
