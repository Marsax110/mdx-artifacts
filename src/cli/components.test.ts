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
});
