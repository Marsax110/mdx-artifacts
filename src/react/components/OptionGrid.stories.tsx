import type { Meta, StoryObj } from "@storybook/react-vite";
import { OptionGrid } from "./OptionGrid";

const meta = {
  title: "Artifact Components/OptionGrid",
  component: OptionGrid
} satisfies Meta<typeof OptionGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "First component scope"
  },
  render: () => (
    <OptionGrid id="option.first-components" title="First component scope">
      <OptionGrid.Item
        id="decision"
        title="DecisionMatrix"
        badge="Core"
        summary="Compare options."
      >
        <p>Use for explicit tradeoff decisions and recommendations.</p>
        <ul>
          <li>Stable structure</li>
          <li>Good for design decisions</li>
        </ul>
      </OptionGrid.Item>
      <OptionGrid.Item
        id="option-grid"
        title="OptionGrid"
        summary="Show alternatives side by side."
      >
        <p>Use when each item needs readable local explanation.</p>
        <ul>
          <li>Easy to scan</li>
          <li>Can add selection later</li>
        </ul>
      </OptionGrid.Item>
      <OptionGrid.Item
        id="export"
        title="ExportPanel"
        summary="Return edited state to the workflow."
      >
        <p>Use when an artifact needs a clear handoff path.</p>
        <ul>
          <li>Copy-only in v1</li>
          <li>Can add downloads later</li>
        </ul>
      </OptionGrid.Item>
    </OptionGrid>
  )
};

export const Empty: Story = {
  args: {
    id: "option.empty",
    title: "Empty option list",
    options: []
  }
};
