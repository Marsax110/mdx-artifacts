import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid } from "./Layout";
import { Callout } from "./Callout";

const meta = {
  title: "Semantic Primitives/Callout",
  component: Callout
} satisfies Meta<typeof Callout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Review focus",
    body: "Check the **export path** before treating this artifact as complete.",
    tone: "info"
  }
};

export const Tones: Story = {
  args: {
    body: "Tone preview"
  },
  render: () => (
    <Grid columns={2}>
      <Callout body="Use this when the note is informational." title="Info" tone="info" />
      <Callout body="Use this when the path is recommended." title="Success" tone="success" />
      <Callout body="Use this when a tradeoff needs attention." title="Warning" tone="warning" />
      <Callout body="Use this when the issue can break the artifact." title="Danger" tone="danger" />
    </Grid>
  )
};
