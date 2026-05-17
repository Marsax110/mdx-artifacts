import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownBody } from "./MarkdownBody";

const meta = {
  title: "Text Components/MarkdownBody",
  component: MarkdownBody,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "MarkdownBody renders a constrained Markdown subset for readable body text inside semantic components."
      }
    }
  }
} satisfies Meta<typeof MarkdownBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <MarkdownBody>{`This body supports controlled block Markdown:

- **Bold** and *emphasis*
- ~~Removed options~~
- \`inline code\`

> Headings, tables, HTML, code blocks, and math are intentionally not part of MarkdownBody.`}</MarkdownBody>
  )
};

export const Compact: Story = {
  render: () => (
    <MarkdownBody variant="compact">{`Use compact body text when a component needs a short explanation:

1. Keep it readable.
2. Keep the component layout predictable.`}</MarkdownBody>
  )
};
