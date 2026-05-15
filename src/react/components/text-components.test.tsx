import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InlineText } from "./InlineText";
import { MarkdownBody } from "./MarkdownBody";

describe("InlineText", () => {
  it("renders controlled inline markdown", () => {
    const html = renderToStaticMarkup(
      <InlineText text="Use **bold**, *emphasis*, ~~removed~~, and `code`." />
    );

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain("<del>removed</del>");
    expect(html).toContain("<code>code</code>");
  });

  it("renders inline markdown from children", () => {
    const html = renderToStaticMarkup(
      <InlineText>Use **bold** text from children.</InlineText>
    );

    expect(html).toContain("<strong>bold</strong>");
  });

  it("does not let markdown headings control semantic level", () => {
    const html = renderToStaticMarkup(<InlineText as="p" text="# Hidden heading" />);

    expect(html).toContain("<p");
    expect(html).not.toContain("<h1");
    expect(html).toContain("Hidden heading");
  });

  it("skips raw html", () => {
    const html = renderToStaticMarkup(<InlineText text="<em>unsafe</em> **safe**" />);

    expect(html).not.toContain("<em>unsafe</em>");
    expect(html).toContain("unsafe");
    expect(html).toContain("<strong>safe</strong>");
  });
});

describe("MarkdownBody", () => {
  it("renders controlled block markdown", () => {
    const html = renderToStaticMarkup(
      <MarkdownBody
        body={`Body copy:

- **Readable** item
- \`inline code\`

> A compact note.`}
      />
    );

    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>Readable</strong>");
    expect(html).toContain("<code>inline code</code>");
    expect(html).toContain("<blockquote>");
  });

  it("renders block markdown from children", () => {
    const html = renderToStaticMarkup(
      <MarkdownBody>{`Body copy:

- **Readable** item
- \`inline code\``}</MarkdownBody>
    );

    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>Readable</strong>");
    expect(html).toContain("<code>inline code</code>");
  });

  it("renders markdown headings inside body copy", () => {
    const html = renderToStaticMarkup(<MarkdownBody body={`# Main

### Local section`} />);

    expect(html).toContain("<h1>Main</h1>");
    expect(html).toContain("<h3>Local section</h3>");
  });

  it("skips raw html", () => {
    const html = renderToStaticMarkup(<MarkdownBody body="<strong>unsafe</strong>\n\n**safe**" />);

    expect(html).not.toContain("<strong>unsafe</strong>");
    expect(html).toContain("unsafe");
    expect(html).toContain("<strong>safe</strong>");
  });
});
