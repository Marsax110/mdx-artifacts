import type { Meta, StoryObj } from "@storybook/react-vite";
import { DecisionMatrix } from "./DecisionMatrix";
import { ExportPanel } from "./ExportPanel";
import { InlineText } from "./InlineText";
import { Columns, Frame, Grid, SplitPane, Stack } from "./Layout";
import { MarkdownBody } from "./MarkdownBody";

const meta = {
  title: "Layout Primitives/Overview"
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const StackBasic: Story = {
  render: () => (
    <Stack gap="md">
      <Frame surface="outlined">
        <InlineText as="h3" text="Stack item A" variant="subtitle" />
      </Frame>
      <Frame surface="subtle">
        <InlineText as="h3" text="Stack item B" variant="subtitle" />
      </Frame>
      <Frame surface="plain">
        <InlineText as="h3" text="Stack item C" variant="subtitle" />
      </Frame>
    </Stack>
  )
};

export const ColumnsRatios: Story = {
  render: () => (
    <Stack gap="lg">
      <Columns ratio="1:1">
        <PreviewFrame title="1fr" />
        <PreviewFrame title="1fr" />
      </Columns>
      <Columns ratio="3:1">
        <PreviewFrame title="3fr" />
        <PreviewFrame title="1fr" />
      </Columns>
      <Columns ratio="3:1:1">
        <PreviewFrame title="3fr" />
        <PreviewFrame title="1fr" />
        <PreviewFrame title="1fr" />
      </Columns>
    </Stack>
  )
};

export const GridBasic: Story = {
  render: () => (
    <Grid columns={3}>
      <PreviewFrame title="Variant A" />
      <PreviewFrame title="Variant B" />
      <PreviewFrame title="Variant C" />
    </Grid>
  )
};

export const SplitPaneBasic: Story = {
  render: () => (
    <SplitPane ratio="3:1">
      <Frame surface="outlined">
        <MarkdownBody
          body={`Primary reading surface.

Use \`SplitPane\` when an artifact needs a clear main area and supporting context.`}
        />
      </Frame>
      <Frame surface="subtle">
        <MarkdownBody body={`Sidebar notes:\n\n- Keep narrow\n- Avoid workflow semantics\n- Collapse on smaller screens`} variant="compact" />
      </Frame>
    </SplitPane>
  )
};

export const FrameSurfaces: Story = {
  render: () => (
    <Grid columns={4}>
      <Frame surface="none">
        <InlineText text="none" variant="label" />
      </Frame>
      <Frame surface="plain">
        <InlineText text="plain" variant="label" />
      </Frame>
      <Frame surface="subtle">
        <InlineText text="subtle" variant="label" />
      </Frame>
      <Frame surface="outlined">
        <InlineText text="outlined" variant="label" />
      </Frame>
    </Grid>
  )
};

export const ComposedArtifact: Story = {
  render: () => (
    <Stack gap="lg">
      <SplitPane ratio="2:1">
        <DecisionMatrix
          question="Should layout primitives stay advanced?"
          options={[
            {
              name: "Advanced-only layout",
              summary: "Use layout primitives for composition checks and unusual artifact structure.",
              pros: ["Keeps semantic components as the default", "Avoids becoming a UI builder"],
              cons: ["Agents need clearer examples when layout is needed"],
              confidence: "high",
              verdict: "Recommended"
            },
            {
              name: "Layout-first authoring",
              summary: "Let agents assemble most artifacts from layout primitives and children.",
              pros: ["Very flexible"],
              cons: ["Recreates raw HTML/React authoring", "Harder to validate"],
              confidence: "low",
              verdict: "Do not make this the default"
            }
          ]}
        />
        <Frame surface="subtle">
          <MarkdownBody
            body={`Layout primitives only control placement and surface.

The child component still owns the meaning.`}
          />
        </Frame>
      </SplitPane>
      <ExportPanel
        title="Export layout decision"
        value={{
          recommendation: "Ship layout primitives as advanced composition tools.",
          next: ["Validate light and dark modes in Storybook", "Keep semantic components as the agent default"]
        }}
      />
    </Stack>
  )
};

function PreviewFrame({ title }: { title: string }) {
  return (
    <Frame surface="outlined">
      <InlineText as="h3" text={title} variant="subtitle" />
      <MarkdownBody body="This frame has no artifact semantics. It only makes layout visible." variant="compact" />
    </Frame>
  );
}
