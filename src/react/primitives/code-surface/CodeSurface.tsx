import { useState, type ReactNode } from "react";

export type CodeSurfaceProps = {
  children: ReactNode;
  language?: string;
  filename?: string;
  copyable?: boolean;
  copyText?: string;
  className?: string;
  codeClassName?: string;
};

export function CodeSurface({
  children,
  language,
  filename,
  copyable = false,
  copyText,
  className,
  codeClassName
}: CodeSurfaceProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = copyable && copyText != null;

  async function copyCode() {
    if (copyText == null) {
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copyText);
    } else {
      fallbackCopy(copyText);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <figure className={classNames("ak-code-block", className)}>
      {(filename || language || canCopy) && (
        <figcaption className="ak-code-header">
          <span className="ak-code-meta">
            {filename && <span className="ak-code-filename">{filename}</span>}
            {language && <span className="ak-code-language">{language}</span>}
          </span>
          {canCopy ? (
            <button className="ak-code-copy" onClick={() => void copyCode()} type="button">
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
        </figcaption>
      )}
      <pre className="ak-code-pre">
        <code className={classNames(language ? `language-${language}` : undefined, codeClassName)}>{children}</code>
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

function classNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}
