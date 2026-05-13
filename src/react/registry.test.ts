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

      for (const type of component.types ?? []) {
        expect(type.name).toBeTruthy();
        expect(type.fields.length).toBeGreaterThan(0);

        for (const field of type.fields) {
          expect(field.name).toBeTruthy();
          expect(field.type).toBeTruthy();
          expect(field.description).toBeTruthy();
        }
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

      for (const type of component.types ?? []) {
        for (const field of type.fields) {
          if (field.contentType) {
            expect(allowedContentTypes.has(field.contentType)).toBe(true);
          }
        }
      }
    }
  });

  it("documents nested object props with queryable types", () => {
    const complexProps = componentRegistry.flatMap((component) =>
      component.props
        .filter((prop) => /^[A-Z][A-Za-z0-9.]*\[]$/.test(prop.type))
        .map((prop) => ({
          component,
          prop,
          typeName: prop.type.slice(0, -2)
        }))
    );

    expect(complexProps.length).toBeGreaterThan(0);

    for (const { component, prop, typeName } of complexProps) {
      expect(component.types?.some((type) => type.name === typeName), `${component.name}.${prop.name}`).toBe(true);
    }
  });

  it("registers first-stage text components with markdown content types", () => {
    const inlineText = componentRegistry.find((component) => component.name === "InlineText");
    const markdownBody = componentRegistry.find((component) => component.name === "MarkdownBody");

    expect(inlineText?.props.find((prop) => prop.name === "text")?.contentType).toBe("inlineMarkdown");
    expect(markdownBody?.props.find((prop) => prop.name === "body")?.contentType).toBe("blockMarkdown");
  });
});
