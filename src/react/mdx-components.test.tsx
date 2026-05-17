import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArtifactCodePre } from "./mdx-components";

describe("Artifact MDX components", () => {
  it("renders native fenced code through the shared code block view", () => {
    const html = renderToStaticMarkup(
      <ArtifactCodePre>
        <code className="language-ts">{"const value = 1;\nconst next = 2;\n"}</code>
      </ArtifactCodePre>
    );

    expect(html).toContain("ak-code-block");
    expect(html).toContain("language-ts");
    expect(html).toContain("ak-code-line-number");
    expect(html).toContain("ak-code-copy");
    expect(html).toContain("const value = 1;");
    expect(html).toContain("const next = 2;");
  });

  it("keeps non-code pre blocks unchanged", () => {
    const html = renderToStaticMarkup(<ArtifactCodePre data-kind="raw">raw pre content</ArtifactCodePre>);

    expect(html).toContain("<pre");
    expect(html).toContain("raw pre content");
    expect(html).not.toContain("ak-code-block");
  });
});
