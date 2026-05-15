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
        title="Should comments target explicit blocks?"
      >
        <DecisionMatrix.Option
          id="explicit-blocks"
          title="Explicit blocks"
          badge="Recommended"
          summary="Use stable block targets for prose and components."
        >
          <ul>
            <li>Stable target ids</li>
            <li>Clear export context</li>
            <li>Authors must wrap reviewable regions</li>
          </ul>
        </DecisionMatrix.Option>
        <DecisionMatrix.Option
          id="implicit-components"
          title="Implicit component comments"
          badge="Deferred"
          summary="Let components create targets without explicit author wrappers."
        >
          <ul>
            <li>Less explicit authoring syntax</li>
            <li>Harder to comment on prose</li>
            <li>Harder to export stable targets</li>
          </ul>
        </DecisionMatrix.Option>
      </DecisionMatrix>

      <OptionGrid
        id="option.comment-workflow"
        title="Comment workflow components"
      >
        <OptionGrid.Item id="comment-layer" title="CommentLayer" summary="Own shared local comment state." />
        <OptionGrid.Item id="commentable-block" title="CommentableBlock" summary="Mark one stable review target." />
        <OptionGrid.Item
          id="export-panel"
          title="ExportPanel"
          summary="Copy the result and current comments back to an agent."
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
