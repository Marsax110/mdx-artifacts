import { afterEach, describe, expect, it, vi } from "vitest";
import { componentsCommand } from "./components";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("componentsCommand", () => {
  it("prints inline markdown content type metadata", () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value = "") => output.push(String(value)));

    componentsCommand("InlineText");

    expect(output.join("\n")).toContain("content type: inlineMarkdown");
  });

  it("prints the Markdown-native authoring rule in the component list", () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value = "") => output.push(String(value)));

    componentsCommand();

    const text = output.join("\n");
    expect(text).toContain("prefer MDX children for human-readable content");
    expect(text).toContain("props for stable ids");
    expect(text).not.toContain("DecisionMatrix");
    expect(text).not.toContain("OptionGrid");
  });

  it("prints block markdown content type metadata", () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value = "") => output.push(String(value)));

    componentsCommand("MarkdownBody");

    expect(output.join("\n")).toContain("content type: blockMarkdown");
  });

  it("prints nested type metadata for complex props", () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value = "") => output.push(String(value)));

    componentsCommand("AnnotatedCode");

    const text = output.join("\n");
    expect(text).toContain("Nested types:");
    expect(text).toContain("CodeAnnotation");
    expect(text).toContain("- line (required): number");
    expect(text).toContain("- body (required): string");
    expect(text).toContain("content type: blockMarkdown");
  });

  it("prints authoring guidance for a component", () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value = "") => output.push(String(value)));

    componentsCommand("ContentSet");

    const text = output.join("\n");
    expect(text).toContain("Authoring: content-block");
    expect(text).toContain("Use title, badge, and summary for short visible display slots.");
    expect(text).toContain("Use MDX children for long explanations");
  });

  it("prints migration guidance for a deprecated compatibility component", () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value = "") => output.push(String(value)));

    componentsCommand("DecisionMatrix");

    const text = output.join("\n");
    expect(text).toContain("Deprecated: use ContentSet for new artifacts.");
    expect(text).toContain("runtime compatibility shim");
    expect(text).toContain("Replacement example:");
    expect(text).toContain("<ContentSet");
    expect(text).not.toContain("\nProps:");
  });
});
