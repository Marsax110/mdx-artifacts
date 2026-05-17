import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiffBlock } from "./DiffBlock";

describe("DiffBlock", () => {
  it("renders structured diff lines", () => {
    const html = renderToStaticMarkup(
      <DiffBlock
        filename="example.ts"
        language="ts"
        lines={[
          { type: "context", oldLine: 1, newLine: 1, content: "const a = 1;" },
          { type: "remove", oldLine: 2, content: "const b = 2;" },
          { type: "add", newLine: 2, content: "const b = 3;" }
        ]}
      />
    );

    expect(html).toContain("example.ts");
    expect(html).toContain("ak-diff-line-context");
    expect(html).toContain("ak-diff-line-remove");
    expect(html).toContain("ak-diff-line-add");
    expect(html).toContain("const b = 3;");
  });
});
