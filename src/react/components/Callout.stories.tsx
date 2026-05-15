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
  render: () => (
    <Callout title="Review focus" tone="info">
      Check the **export path** before treating this artifact as complete.
    </Callout>
  )
};

export const Tones: Story = {
  render: () => (
    <Grid columns={2}>
      <Callout title="Info" tone="info">
        Use this when the note is informational.
      </Callout>
      <Callout title="Success" tone="success">
        Use this when the path is recommended.
      </Callout>
      <Callout title="Warning" tone="warning">
        Use this when a tradeoff needs attention.
      </Callout>
      <Callout title="Danger" tone="danger">
        Use this when the issue can break the artifact.
      </Callout>
    </Grid>
  )
};
