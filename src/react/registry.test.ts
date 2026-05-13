import { describe, expect, it } from "vitest";
import { componentRegistry } from "./registry";

const allowedContentTypes = new Set(["plainText", "inlineMarkdown", "blockMarkdown", "json", "code"]);

describe("componentRegistry", () => {
  it("uses unique component names", () => {
    const names = componentRegistry.map((component) => component.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("documents every component and prop", () => {
    for (const component of componentRegistry) {
      expect(component.description).toBeTruthy();
      expect(component.useWhen.length).toBeGreaterThan(0);
      expect(component.example).toContain(`<${component.name}`);

      for (const prop of component.props) {
        expect(prop.name).toBeTruthy();
        expect(prop.type).toBeTruthy();
        expect(prop.description).toBeTruthy();
      }
    }
  });

  it("uses supported content types", () => {
    for (const component of componentRegistry) {
      for (const prop of component.props) {
        if (prop.contentType) {
          expect(allowedContentTypes.has(prop.contentType)).toBe(true);
        }
      }
    }
  });

  it("registers first-stage text components with markdown content types", () => {
    const inlineText = componentRegistry.find((component) => component.name === "InlineText");
    const markdownBody = componentRegistry.find((component) => component.name === "MarkdownBody");

    expect(inlineText?.props.find((prop) => prop.name === "text")?.contentType).toBe("inlineMarkdown");
    expect(markdownBody?.props.find((prop) => prop.name === "body")?.contentType).toBe("blockMarkdown");
  });
});
