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
    question: "Should stage one focus on a Vite single HTML artifact?"
  },
  render: () => (
    <DecisionMatrix id="decision.stage-one" question="Should stage one focus on a Vite single HTML artifact?">
      <DecisionMatrix.Option
        id="vite"
        name="Vite single HTML artifact"
        pros={["Short feedback loop", "Direct interactive component debugging"]}
        cons={["No docs-site navigation yet"]}
        confidence="high"
        verdict="Recommended"
      >
        <p>Validate the shortest MDX-to-interactive-HTML loop first.</p>
      </DecisionMatrix.Option>
      <DecisionMatrix.Option
        id="astro"
        name="Astro docs site"
        pros={["Complete reading experience", "File-based pages"]}
        cons={["Too heavy for stage one"]}
        confidence="medium"
        verdict="Add in stage two"
      >
        <p>Host the long-lived documentation tree later.</p>
      </DecisionMatrix.Option>
    </DecisionMatrix>
  )
};

export const LongText: Story = {
  args: {
    question: "When option titles and descriptions are long, does the card still wrap cleanly and remain scannable?"
  },
  render: () => (
    <DecisionMatrix
      id="decision.adapter-boundary"
      question="When option titles and descriptions are long, does the card still wrap cleanly and remain scannable?"
    >
      <DecisionMatrix.Option
        id="core-astro-adapter"
        name="Keep the core components independent from Astro and treat Astro as a long-lived docs-site adapter"
        pros={["Portable", "Avoids premature docs-site coupling", "Better npm package shape"]}
        cons={["Requires adapter boundaries early", "README must explain the split clearly"]}
        risks={["Users may mistake this for another docs framework"]}
        confidence="high"
        verdict="Use as the long-term abstraction"
      >
        <p>
          This lets the same core components work in Vite artifacts, Astro docs, and future Claude artifact builders.
        </p>
      </DecisionMatrix.Option>
    </DecisionMatrix>
  )
};
