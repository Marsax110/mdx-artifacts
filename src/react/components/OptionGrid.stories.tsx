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
    id: "option.first-components",
    title: "First component scope",
    options: [
      {
        id: "decision",
        name: "DecisionMatrix",
        intent: "Compare options",
        tradeoffs: ["Stable structure", "Good for design decisions"]
      },
      {
        id: "option-grid",
        name: "OptionGrid",
        intent: "Show alternatives side by side",
        tradeoffs: ["Easy to scan", "Can add selection later"]
      },
      {
        id: "export",
        name: "ExportPanel",
        intent: "Return edited state to the workflow",
        tradeoffs: ["Copy-only in v1", "Can add downloads later"]
      }
    ]
  }
};

export const Empty: Story = {
  args: {
    id: "option.empty",
    title: "Empty option list",
    options: []
  }
};
