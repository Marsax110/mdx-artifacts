import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("renders code with optional metadata", () => {
    const html = renderToStaticMarkup(<CodeBlock code={"const value = 1;"} filename="example.ts" language="ts" />);

    expect(html).toContain("example.ts");
    expect(html).toContain("ts");
    expect(html).toContain("const value = 1;");
    expect(html).toContain("language-ts");
  });

  it("renders line numbers and highlighted lines", () => {
    const html = renderToStaticMarkup(
      <CodeBlock code={"first\nsecond"} highlightLines={[2]} showLineNumbers />
    );

    expect(html).toContain("ak-code-line-number");
    expect(html).toContain("data-line=\"2\"");
    expect(html).toContain("ak-code-line-highlighted");
  });
});
