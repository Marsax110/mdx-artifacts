import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentLayer } from "../../interactions/comments/Comments";
import { ArtifactCodePre } from "../../mdx-components";
import { Section } from "./Section";

const meta = {
  title: "Artifact Components/Section",
  component: Section,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Section wraps native MDX prose in a stable artifact region that can be targeted by comments."
      }
    }
  }
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

const basicSectionSource = `<CommentLayer>
  <Section id="section.context">

## Context

This section keeps **native MDX prose** under one stable review anchor. Use _emphasis_, \`inline code\`, and [links](https://example.com) directly in the document flow.

> Section is for reviewable document regions. It should preserve Markdown authoring instead of turning prose into string props.

- Native heading authored inside the section
- Stable id for comment state
- Native prose remains authored as MDX children

1. Keep the heading inside the section.
2. Keep long explanations as Markdown.
3. Use semantic components only when structure needs it.

\`\`\`mdx
<Section id="section.context">

## Context

This Markdown heading becomes the section title.

</Section>
\`\`\`

  </Section>
</CommentLayer>`;

export const Basic: Story = {
  args: {
    id: "section.context",
    children: null
  },
  parameters: {
    docs: {
      source: {
        code: basicSectionSource
      }
    }
  },
  render: () => (
    <CommentLayer>
      <Section id="section.context">
        <h2>Context</h2>
        <p>
          This section keeps <strong>native MDX prose</strong> under one stable review anchor. Use <em>emphasis</em>,{" "}
          <code>inline code</code>, and <a href="https://example.com">links</a> directly in the document flow.
        </p>
        <blockquote>
          <p>
            Section is for reviewable document regions. It should preserve Markdown authoring instead of turning prose
            into string props.
          </p>
        </blockquote>
        <ul>
          <li>Native heading authored inside the section</li>
          <li>Stable id for comment state</li>
          <li>Native prose remains authored as MDX children</li>
        </ul>
        <ol>
          <li>Keep the heading inside the section.</li>
          <li>Keep long explanations as Markdown.</li>
          <li>Use semantic components only when structure needs it.</li>
        </ol>
        <ArtifactCodePre>
          <code className="language-mdx">{`<Section id="section.context">

## Context

This Markdown heading becomes the section title.

</Section>`}</code>
        </ArtifactCodePre>
      </Section>
    </CommentLayer>
  )
};
