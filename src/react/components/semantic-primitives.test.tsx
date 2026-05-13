import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnnotatedCode } from "./AnnotatedCode";
import { Callout } from "./Callout";
import { SeverityBadge } from "./SeverityBadge";

describe("Callout", () => {
  it("renders a titled markdown callout", () => {
    const html = renderToStaticMarkup(
      <Callout body="Check the **export path** before release." title="Review focus" tone="warning" />
    );

    expect(html).toContain("ak-callout-warning");
    expect(html).toContain("Review focus");
    expect(html).toContain("<strong>export path</strong>");
  });
});

describe("SeverityBadge", () => {
  it("renders default and custom severity labels", () => {
    const high = renderToStaticMarkup(<SeverityBadge level="high" />);
    const custom = renderToStaticMarkup(<SeverityBadge label="Regression risk" level="critical" />);

    expect(high).toContain("ak-severity-badge-high");
    expect(high).toContain("High");
    expect(custom).toContain("Regression risk");
  });
});

describe("AnnotatedCode", () => {
  it("renders code with annotation lines and severity", () => {
    const html = renderToStaticMarkup(
      <AnnotatedCode
        annotations={[
          {
            line: 2,
            severity: "high",
            title: "Fallback branch",
            body: "Keep this path available for local previews."
          }
        ]}
        code={"first\nsecond"}
        filename="example.ts"
        language="ts"
      />
    );

    expect(html).toContain("example.ts");
    expect(html).toContain("data-line=\"2\"");
    expect(html).toContain("ak-code-line-highlighted");
    expect(html).toContain("ak-severity-badge-high");
    expect(html).toContain("Fallback branch");
  });
});
