import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComparisonSet } from "./ComparisonSet";
import { MarkdownBody } from "../../primitives/markdown-body/MarkdownBody";

describe("ComparisonSet", () => {
  it("renders compound items with arbitrary children", () => {
    const html = renderToStaticMarkup(
      <ComparisonSet title="Compare forms">
        <ComparisonSet.Item title="Markdown" value="markdown">
          <MarkdownBody body="Use **Markdown** for prose." />
        </ComparisonSet.Item>
      </ComparisonSet>
    );

    expect(html).toContain("ak-comparison-set");
    expect(html).toContain("Compare forms");
    expect(html).toContain("data-value=\"markdown\"");
    expect(html).toContain("<strong>Markdown</strong>");
  });
});
