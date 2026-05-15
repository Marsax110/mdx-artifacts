import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComparisonSet } from "./ComparisonSet";
import { Frame } from "./Layout";
import { MarkdownBody } from "./MarkdownBody";

const meta = {
  title: "Artifact Components/ComparisonSet"
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const MixedContent: Story = {
  render: () => (
      <ComparisonSet title="Compare artifact forms" columns={3}>
        <ComparisonSet.Item title="Markdown explanation" value="markdown">
        <MarkdownBody variant="compact">{`Best for prose-heavy context.

- Easy for agents to write
- Easy for humans to scan
- Limited visual structure`}</MarkdownBody>
      </ComparisonSet.Item>

      <ComparisonSet.Item title="Code path" value="code-path">
        <Frame surface="subtle">
          <pre className="ak-export-output">{`src/react/components/ComparisonSet.tsx
src/react/registry.ts
artifact-docs/examples/layout-composition.mdx`}</pre>
        </Frame>
      </ComparisonSet.Item>

      <ComparisonSet.Item title="Local preview" value="local-preview">
        <Frame surface="plain">
          <MarkdownBody variant="compact">
            This slot can hold a future local component, image, Mermaid renderer, or prototype preview.
          </MarkdownBody>
        </Frame>
      </ComparisonSet.Item>
    </ComparisonSet>
  )
};
