import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExportPanel } from "./ExportPanel";

const meta = {
  title: "Artifact Components/ExportPanel",
  component: ExportPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "ExportPanel exposes artifact results as copyable Markdown and JSON handoff payloads."
      }
    }
  }
} satisfies Meta<typeof ExportPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MarkdownAndJson: Story = {
  args: {
    title: "Export recommendation",
    formats: ["markdown", "json"],
    value: {
      recommendation: "Start with Vite + React + MDX to single HTML artifact.",
      reasons: [
        "Validate the high-level component protocol and exporter first.",
        "Avoid binding the core to Astro docs-site structure too early."
      ],
      nextSteps: ["Add Storybook component previews", "Add PriorityBoard"]
    }
  }
};

export const JsonOnly: Story = {
  args: {
    title: "Export structured data",
    formats: ["json"],
    value: {
      component: "ExportPanel",
      purpose: "Copy human-edited results back to an agent or issue"
    }
  }
};
