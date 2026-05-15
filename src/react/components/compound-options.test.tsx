import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommentLayer } from "./Comments";
import { DecisionMatrix } from "./DecisionMatrix";
import { OptionGrid } from "./OptionGrid";

describe("DecisionMatrix compound API", () => {
  it("renders option children with a stable child anchor", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <DecisionMatrix id="decision.api" question="Which API should carry long explanations?">
          <DecisionMatrix.Option id="children" name="Children-first option" confidence="high" verdict="Recommended">
            <p>Long explanations stay readable in MDX children.</p>
            <ul>
              <li>Readable source</li>
              <li>Cleaner diffs</li>
            </ul>
          </DecisionMatrix.Option>
        </DecisionMatrix>
      </CommentLayer>
    );

    expect(html).toContain('data-anchor-id="decision.api.children"');
    expect(html).toContain("Children-first option");
    expect(html).toContain("ak-badge-high");
    expect(html).toContain("<li>Readable source</li>");
    expect(html).toContain("Recommended");
  });
});

describe("OptionGrid compound API", () => {
  it("renders item children with a stable child anchor", () => {
    const html = renderToStaticMarkup(
      <CommentLayer>
        <OptionGrid id="option.api" title="Which authoring shape should examples use?">
          <OptionGrid.Item id="children" name="Children-first item" intent="Use for readable body content.">
            <p>Long option descriptions stay in normal MDX.</p>
            <ul>
              <li>Readable source</li>
              <li>Cleaner diffs</li>
            </ul>
          </OptionGrid.Item>
        </OptionGrid>
      </CommentLayer>
    );

    expect(html).toContain('data-anchor-id="option.api.children"');
    expect(html).toContain("Children-first item");
    expect(html).toContain("Use for readable body content.");
    expect(html).toContain("<li>Cleaner diffs</li>");
  });
});
