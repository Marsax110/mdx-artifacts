import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContentSet } from "../../components/ContentItem";
import { ExportPanel } from "../../components/ExportPanel";
import { InlineText } from "../../primitives/inline-text/InlineText";
import { Columns, Frame, Grid, SplitPane, Stack } from "./Layout";
import { MarkdownBody } from "../../primitives/markdown-body/MarkdownBody";

const meta = {
  title: "Layout Primitives/Overview",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Layout primitives arrange semantic artifact components without owning workflow meaning."
      }
    }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const StackBasic: Story = {
  render: () => (
    <Stack gap="md">
      <Frame surface="outlined">
        <InlineText as="h3" variant="subtitle">Stack item A</InlineText>
      </Frame>
      <Frame surface="subtle">
        <InlineText as="h3" variant="subtitle">Stack item B</InlineText>
      </Frame>
      <Frame surface="plain">
        <InlineText as="h3" variant="subtitle">Stack item C</InlineText>
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
        <MarkdownBody>{`Primary reading surface.

Use \`SplitPane\` when an artifact needs a clear main area and supporting context.`}</MarkdownBody>
      </Frame>
      <Frame surface="subtle">
        <MarkdownBody variant="compact">{`Sidebar notes:

- Keep narrow
- Avoid workflow semantics
- Collapse on smaller screens`}</MarkdownBody>
      </Frame>
    </SplitPane>
  )
};

export const FrameSurfaces: Story = {
  render: () => (
    <Grid columns={4}>
      <Frame surface="none">
        <InlineText variant="label">none</InlineText>
      </Frame>
      <Frame surface="plain">
        <InlineText variant="label">plain</InlineText>
      </Frame>
      <Frame surface="subtle">
        <InlineText variant="label">subtle</InlineText>
      </Frame>
      <Frame surface="outlined">
        <InlineText variant="label">outlined</InlineText>
      </Frame>
    </Grid>
  )
};

export const ComposedArtifact: Story = {
  render: () => (
    <Stack gap="lg">
      <SplitPane ratio="2:1">
        <ContentSet
          id="set.layout-position"
          title="Should layout primitives stay advanced?"
          columns={2}
        >
          <ContentSet.Item
            id="advanced-only"
            title="Advanced-only layout"
            badge="Recommended"
            tone="positive"
            emphasis="primary"
            summary="Use layout primitives for composition checks and unusual artifact structure."
          >
            <ul>
              <li>Keeps semantic components as the default</li>
              <li>Avoids becoming a UI builder</li>
              <li>Agents need clearer examples when layout is needed</li>
            </ul>
          </ContentSet.Item>
          <ContentSet.Item
            id="layout-first"
            title="Layout-first authoring"
            badge="Avoid"
            tone="warning"
            emphasis="subtle"
            summary="Do not make this the default authoring model."
          >
            <ul>
              <li>Very flexible</li>
              <li>Recreates raw HTML/React authoring</li>
              <li>Harder to validate</li>
            </ul>
          </ContentSet.Item>
        </ContentSet>
        <Frame surface="subtle">
          <MarkdownBody>{`Layout primitives only control placement and surface.

The child component still owns the meaning.`}</MarkdownBody>
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
      <InlineText as="h3" variant="subtitle">{title}</InlineText>
      <MarkdownBody variant="compact">
        This frame has no artifact semantics. It only makes layout visible.
      </MarkdownBody>
    </Frame>
  );
}
