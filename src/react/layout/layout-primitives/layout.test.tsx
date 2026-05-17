import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Columns, Frame, Grid, SplitPane, Stack } from "./Layout";

describe("layout primitives", () => {
  it("renders Stack with controlled spacing and alignment classes", () => {
    const html = renderToStaticMarkup(
      <Stack align="center" gap="lg">
        <span>Item</span>
      </Stack>
    );

    expect(html).toContain("ak-stack");
    expect(html).toContain("ak-gap-lg");
    expect(html).toContain("ak-stack-align-center");
  });

  it("renders Columns with a ratio CSS variable", () => {
    const html = renderToStaticMarkup(
      <Columns ratio="3:1:1">
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Columns>
    );

    expect(html).toContain("ak-columns");
    expect(html).toContain("--ak-layout-columns:3fr 1fr 1fr");
  });

  it("renders Grid with equal column count", () => {
    const html = renderToStaticMarkup(
      <Grid columns={3}>
        <span>A</span>
      </Grid>
    );

    expect(html).toContain("ak-grid");
    expect(html).toContain("--ak-layout-columns:repeat(3, minmax(0, 1fr))");
  });

  it("renders SplitPane with a controlled ratio", () => {
    const html = renderToStaticMarkup(
      <SplitPane ratio="1:3">
        <span>Main</span>
        <span>Side</span>
      </SplitPane>
    );

    expect(html).toContain("ak-split-pane");
    expect(html).toContain("--ak-layout-columns:1fr 3fr");
  });

  it("renders Frame with surface and padding classes", () => {
    const html = renderToStaticMarkup(
      <Frame padding="sm" surface="subtle">
        Content
      </Frame>
    );

    expect(html).toContain("ak-frame");
    expect(html).toContain("ak-surface-subtle");
    expect(html).toContain("ak-padding-sm");
  });
});
