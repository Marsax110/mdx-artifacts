import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentLayer } from "./Comments";
import { Section } from "./Section";

const meta = {
  title: "Artifact Components/Section",
  component: Section,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Section wraps native MDX prose in a stable artifact region that can be targeted by comments."
      }
    }
  }
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    id: "section.context",
    children: null
  },
  render: () => (
    <CommentLayer>
      <Section id="section.context">
        <h2>Context</h2>
        <p>This section keeps native MDX prose under one stable review anchor.</p>
        <ul>
          <li>Native heading authored inside the section</li>
          <li>Stable id for comment state</li>
          <li>Native prose remains authored as MDX children</li>
        </ul>
      </Section>
    </CommentLayer>
  )
};
