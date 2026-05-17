import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeBlock } from "./CodeBlock";

const sampleCode = `export function createArtifact(input: ArtifactInput) {
  const result = normalizeInput(input);

  return {
    title: result.title,
    status: "ready"
  };
}`;

const meta = {
  title: "Content Primitives/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "CodeBlock renders static source snippets with optional filenames, line numbers, copy controls, and highlighted lines."
      }
    }
  }
} satisfies Meta<typeof CodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    code: sampleCode,
    language: "ts",
    filename: "src/artifact.ts"
  },
  render: (args) => <CodeBlock {...args} />
};

export const WithLineNumbers: Story = {
  args: {
    code: sampleCode,
    language: "ts",
    filename: "src/artifact.ts",
    showLineNumbers: true
  },
  render: (args) => <CodeBlock {...args} />
};

export const HighlightedLines: Story = {
  args: {
    code: sampleCode,
    language: "ts",
    filename: "src/artifact.ts",
    showLineNumbers: true,
    highlightLines: [2, 5]
  },
  render: (args) => <CodeBlock {...args} />
};

export const Copyable: Story = {
  args: {
    code: sampleCode,
    language: "ts",
    filename: "src/artifact.ts",
    showLineNumbers: true,
    copyable: true
  },
  render: (args) => <CodeBlock {...args} />
};
