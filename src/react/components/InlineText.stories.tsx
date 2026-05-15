import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineText } from "./InlineText";

const meta = {
  title: "Text Components/InlineText",
  component: InlineText
} satisfies Meta<typeof InlineText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <InlineText as="p">
      Use **MDX** for source, ~~raw HTML~~ only as fallback, and `ExportPanel` for handoff.
    </InlineText>
  )
};

export const AsHeading: Story = {
  render: () => (
    <InlineText as="h2" variant="title">
      **Stage one** component naming
    </InlineText>
  )
};
