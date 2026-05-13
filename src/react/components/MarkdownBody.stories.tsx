import type { Meta, StoryObj } from "@storybook/react-vite";
import { MarkdownBody } from "./MarkdownBody";

const meta = {
  title: "Text Components/MarkdownBody",
  component: MarkdownBody
} satisfies Meta<typeof MarkdownBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    body: `This body supports controlled block Markdown:

- **Bold** and *emphasis*
- ~~Removed options~~
- \`inline code\`

> Headings, tables, HTML, code blocks, and math are intentionally not part of MarkdownBody.`
  }
};

export const Compact: Story = {
  args: {
    body: `Use compact body text when a component needs a short explanation:

1. Keep it readable.
2. Keep the component layout predictable.`,
    variant: "compact"
  }
};
