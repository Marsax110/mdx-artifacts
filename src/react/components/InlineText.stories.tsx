import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineText } from "./InlineText";

const meta = {
  title: "Text Components/InlineText",
  component: InlineText
} satisfies Meta<typeof InlineText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    text: "Use **MDX** for source, ~~raw HTML~~ only as fallback, and `ExportPanel` for handoff.",
    as: "p"
  }
};

export const AsHeading: Story = {
  args: {
    text: "**Stage one** component naming",
    as: "h2",
    variant: "title"
  }
};
