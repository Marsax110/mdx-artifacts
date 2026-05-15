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
        id="decision.comment-targets"
        question="Should comments target explicit blocks?"
      >
        <DecisionMatrix.Option
          id="explicit-blocks"
          name="Explicit blocks"
          pros={["Stable target ids", "Clear export context"]}
          cons={["Authors must wrap reviewable regions"]}
          confidence="high"
          verdict="Recommended"
        />
        <DecisionMatrix.Option
          id="implicit-components"
          name="Implicit component comments"
          pros={["Less explicit authoring syntax"]}
          cons={["Harder to comment on prose", "Harder to export stable targets"]}
          confidence="medium"
        />
      </DecisionMatrix>

      <OptionGrid
        id="option.comment-workflow"
        title="Comment workflow components"
      >
        <OptionGrid.Item id="comment-layer" name="CommentLayer" intent="Own shared local comment state." />
        <OptionGrid.Item id="commentable-block" name="CommentableBlock" intent="Mark one stable review target." />
        <OptionGrid.Item
          id="export-panel"
          name="ExportPanel"
          intent="Copy the result and current comments back to an agent."
        />
      </OptionGrid>

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
