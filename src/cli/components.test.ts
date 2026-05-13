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
});
