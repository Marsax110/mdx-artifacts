import type { Meta, StoryObj } from "@storybook/react-vite";
import { SortableList } from "./SortableList";

const meta = {
  title: "Artifact Components/SortableList",
  component: SortableList
} satisfies Meta<typeof SortableList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LaunchPriority: Story = {
  args: {
    id: "list.launch-priority",
    title: "Launch priority",
    summary: "Drag items or use the controls to change the handoff order.",
    surface: "outlined",
    items: [
      {
        id: "contentset-api",
        title: "Stabilize ContentSet API",
        summary: "Must land before public examples.",
        badge: "P0",
        tags: ["api", "docs"]
      },
      {
        id: "layout-guidance",
        title: "Clarify layout guidance",
        summary: "Explain Frame, Columns, Section, and ContentSet boundaries.",
        badge: "P1",
        tags: ["protocol"]
      },
      {
        id: "artifact-export",
        title: "Verify artifact export",
        summary: "Confirm the final artifact carries the sorted priority result.",
        badge: "P1",
        tags: ["export"]
      }
    ]
  }
};
