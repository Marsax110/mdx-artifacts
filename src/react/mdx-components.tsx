import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { CodeBlockView } from "./primitives/code-block/CodeBlock";

export const artifactMdxComponents = {
  pre: ArtifactCodePre
};

export function ArtifactCodePre({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const codeChild = getSingleCodeChild(children);

  if (!codeChild) {
    return <pre {...props}>{children}</pre>;
  }

  const codeProps = codeChild.props as { children?: ReactNode; className?: string };
  const code = getTextContent(codeProps.children);

  if (code == null) {
    return <pre {...props}>{children}</pre>;
  }

  return <CodeBlockView code={code} copyable language={getLanguage(codeProps.className)} showLineNumbers />;
}

function getSingleCodeChild(children: ReactNode) {
  const child = Children.toArray(children).find((item) => isValidElement(item));

  if (!isValidElement(child) || child.type !== "code") {
    return undefined;
  }

  return child;
}

function getTextContent(node: ReactNode): string | undefined {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).filter((item): item is string => item != null).join("");
  }

  return undefined;
}

function getLanguage(className: string | undefined) {
  const languageClass = className?.split(/\s+/).find((item) => item.startsWith("language-"));
  return languageClass?.replace(/^language-/, "") || undefined;
}
