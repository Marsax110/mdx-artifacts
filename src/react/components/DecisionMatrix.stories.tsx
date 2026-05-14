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
    id: "decision.stage-one",
    question: "Should stage one focus on a Vite single HTML artifact?",
    options: [
      {
        id: "vite",
        name: "Vite single HTML artifact",
        summary: "Validate the shortest MDX-to-interactive-HTML loop first.",
        pros: ["Short feedback loop", "Direct interactive component debugging"],
        cons: ["No docs-site navigation yet"],
        confidence: "high",
        verdict: "Recommended"
      },
      {
        id: "astro",
        name: "Astro docs site",
        summary: "Host the long-lived documentation tree later.",
        pros: ["Complete reading experience", "File-based pages"],
        cons: ["Too heavy for stage one"],
        confidence: "medium",
        verdict: "Add in stage two"
      }
    ]
  }
};

export const LongText: Story = {
  args: {
    id: "decision.adapter-boundary",
    question: "When option titles and descriptions are long, does the card still wrap cleanly and remain scannable?",
    options: [
      {
        id: "core-astro-adapter",
        name: "Keep the core components independent from Astro and treat Astro as a long-lived docs-site adapter",
        summary:
          "This lets the same core components work in Vite artifacts, Astro docs, and future Claude artifact builders.",
        pros: ["Portable", "Avoids premature docs-site coupling", "Better npm package shape"],
        cons: ["Requires adapter boundaries early", "README must explain the split clearly"],
        risks: ["Users may mistake this for another docs framework"],
        confidence: "high",
        verdict: "Use as the long-term abstraction"
      }
    ]
  }
};
