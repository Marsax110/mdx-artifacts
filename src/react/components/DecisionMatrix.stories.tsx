import type { Meta, StoryObj } from "@storybook/react-vite";
import { DecisionMatrix } from "./DecisionMatrix";

const meta = {
  title: "Artifact Components/DecisionMatrix",
  component: DecisionMatrix
} satisfies Meta<typeof DecisionMatrix>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Should stage one focus on a Vite single HTML artifact?"
  },
  render: () => (
    <DecisionMatrix id="decision.stage-one" title="Should stage one focus on a Vite single HTML artifact?">
      <DecisionMatrix.Option
        id="vite"
        title="Vite single HTML artifact"
        badge="Recommended"
        summary="Validate the shortest MDX-to-interactive-HTML loop first."
      >
        <h4>Tradeoffs</h4>
        <ul>
          <li>Short feedback loop</li>
          <li>Direct interactive component debugging</li>
          <li>No docs-site navigation yet</li>
        </ul>
      </DecisionMatrix.Option>
      <DecisionMatrix.Option
        id="astro"
        title="Astro docs site"
        badge="Later"
        summary="Host the long-lived documentation tree later."
      >
        <h4>Tradeoffs</h4>
        <ul>
          <li>Complete reading experience</li>
          <li>File-based pages</li>
          <li>Too heavy for stage one</li>
        </ul>
      </DecisionMatrix.Option>
    </DecisionMatrix>
  )
};

export const LongText: Story = {
  args: {
    title: "When option titles and descriptions are long, does the card still wrap cleanly and remain scannable?"
  },
  render: () => (
    <DecisionMatrix
      id="decision.adapter-boundary"
      title="When option titles and descriptions are long, does the card still wrap cleanly and remain scannable?"
    >
      <DecisionMatrix.Option
        id="core-astro-adapter"
        title="Keep the core components independent from Astro and treat Astro as a long-lived docs-site adapter"
        badge="Recommended"
        summary="Use this as the long-term abstraction boundary."
      >
        <p>
          This lets the same core components work in Vite artifacts, Astro docs, and future Claude artifact builders.
        </p>
        <h4>Tradeoffs</h4>
        <ul>
          <li>Portable</li>
          <li>Avoids premature docs-site coupling</li>
          <li>Requires adapter boundaries early</li>
          <li>Users may mistake this for another docs framework</li>
        </ul>
      </DecisionMatrix.Option>
    </DecisionMatrix>
  )
};
