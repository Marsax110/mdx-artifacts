import type { Meta, StoryObj } from "@storybook/react-vite";
import { DiffBlock } from "./DiffBlock";

const meta = {
  title: "Content Primitives/DiffBlock",
  component: DiffBlock,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "DiffBlock renders compact added, removed, and context lines for code review or implementation notes."
      }
    }
  }
} satisfies Meta<typeof DiffBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    filename: "src/exporter.ts",
    language: "ts",
    lines: [
      { type: "context", oldLine: 12, newLine: 12, content: "export function serialize(value: unknown) {" },
      { type: "remove", oldLine: 13, content: '  return JSON.stringify(value);' },
      { type: "add", newLine: 13, content: "  return JSON.stringify(value, null, 2);" },
      { type: "context", oldLine: 14, newLine: 14, content: "}" }
    ]
  },
  render: (args) => <DiffBlock {...args} />
};
