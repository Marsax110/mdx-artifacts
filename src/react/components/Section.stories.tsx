import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentLayer } from "./Comments";
import { Section } from "./Section";

const meta = {
  title: "Artifact Components/Section",
  component: Section
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    id: "section.context",
    title: "Context",
    level: 2,
    children: null
  },
  render: () => (
    <CommentLayer>
      <Section id="section.context" title="Context" level={2}>
        <p>This section keeps native MDX prose under one stable review anchor.</p>
        <ul>
          <li>Generated heading from the title prop</li>
          <li>Stable id for comment state</li>
          <li>Native prose remains authored as MDX children</li>
        </ul>
      </Section>
    </CommentLayer>
  )
};
