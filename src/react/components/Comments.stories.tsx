import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentExport, CommentLayer } from "./Comments";
import { DecisionMatrix } from "./DecisionMatrix";
import { OptionGrid } from "./OptionGrid";

const meta = {
  title: "Artifact Components/Comments",
  component: CommentLayer
} satisfies Meta<typeof CommentLayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BlockComments: Story = {
  args: {
    children: null
  },
  render: () => (
    <>
      <DecisionMatrix
        question="Should comments target explicit blocks?"
        options={[
          {
            name: "Explicit blocks",
            pros: ["Stable target ids", "Clear export context"],
            cons: ["Authors must wrap reviewable regions"],
            confidence: "high",
            verdict: "Recommended"
          },
          {
            name: "Implicit component comments",
            pros: ["Less explicit authoring syntax"],
            cons: ["Harder to comment on prose", "Harder to export stable targets"],
            confidence: "medium"
          }
        ]}
      />

      <OptionGrid
        options={[
          {
            name: "CommentLayer",
            intent: "Own shared local comment state."
          },
          {
            name: "CommentableBlock",
            intent: "Mark one stable review target."
          },
          {
            name: "CommentExport",
            intent: "Copy comments back to an agent."
          }
        ]}
        title="Comment workflow components"
      />

      <CommentExport title="Export artifact feedback" />
    </>
  )
};
