import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentLayer } from "./Comments";
import { ContentSet } from "../../composites/content-set/ContentItem";
import { ExportPanel } from "../../composites/export-panel/ExportPanel";

const meta = {
  title: "Artifact Components/Comments",
  component: CommentLayer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Comments provide local review targets and feedback state around explicit artifact regions."
      }
    }
  }
} satisfies Meta<typeof CommentLayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BlockComments: Story = {
  args: {
    children: null
  },
  render: () => (
    <>
      <ContentSet
        id="set.comment-targets"
        title="Should comments target explicit blocks?"
        columns={2}
      >
        <ContentSet.Item
          id="explicit-blocks"
          title="Explicit blocks"
          badge="Recommended"
          tone="positive"
          emphasis="primary"
          summary="Use stable block targets for prose and components."
        >
          <ul>
            <li>Stable target ids</li>
            <li>Clear export context</li>
            <li>Authors must wrap reviewable regions</li>
          </ul>
        </ContentSet.Item>
        <ContentSet.Item
          id="implicit-components"
          title="Implicit component comments"
          badge="Deferred"
          tone="warning"
          emphasis="subtle"
          summary="Let components create targets without explicit author wrappers."
        >
          <ul>
            <li>Less explicit authoring syntax</li>
            <li>Harder to comment on prose</li>
            <li>Harder to export stable targets</li>
          </ul>
        </ContentSet.Item>
      </ContentSet>

      <ContentSet
        id="set.comment-workflow"
        title="Comment workflow components"
        columns={3}
      >
        <ContentSet.Item id="comment-layer" title="CommentLayer" tone="info" summary="Own shared local comment state." />
        <ContentSet.Item id="commentable-block" title="CommentableBlock" tone="accent" summary="Mark one stable review target." />
        <ContentSet.Item
          id="export-panel"
          title="ExportPanel"
          tone="neutral"
          summary="Copy the result and current comments back to an agent."
        />
      </ContentSet>

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
