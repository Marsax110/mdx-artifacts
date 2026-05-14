import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentLayer } from "./Comments";
import { DecisionMatrix } from "./DecisionMatrix";
import { ExportPanel } from "./ExportPanel";
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
            name: "ExportPanel",
            intent: "Copy the result and current comments back to an agent."
          }
        ]}
        title="Comment workflow components"
      />

      <ExportPanel
        title="Export artifact feedback"
        value={{
          recommendation: "Use explicit targets first.",
          nextStep: "Validate commentable prose blocks."
        }}
      />
    </>
  )
};
