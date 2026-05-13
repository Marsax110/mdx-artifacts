import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Layout";
import { SeverityBadge } from "./SeverityBadge";

const meta = {
  title: "Semantic Primitives/SeverityBadge",
  component: SeverityBadge
} satisfies Meta<typeof SeverityBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Levels: Story = {
  render: () => (
    <Stack align="start" gap="sm">
      <SeverityBadge level="info" />
      <SeverityBadge level="low" />
      <SeverityBadge level="medium" />
      <SeverityBadge level="high" />
      <SeverityBadge level="critical" />
    </Stack>
  )
};

export const CustomLabel: Story = {
  args: {
    level: "high",
    label: "Regression risk"
  }
};
