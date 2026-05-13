import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnnotatedCode } from "./AnnotatedCode";

const sampleCode = `export function copyOutput(value: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }

  fallbackCopy(value);
}`;

const meta = {
  title: "Semantic Primitives/AnnotatedCode",
  component: AnnotatedCode
} satisfies Meta<typeof AnnotatedCode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    code: sampleCode,
    filename: "src/export-panel.ts",
    language: "ts",
    annotations: [
      {
        line: 2,
        severity: "medium",
        title: "Browser capability branch",
        body: "This path depends on the Clipboard API. Keep a fallback for local artifact previews."
      },
      {
        line: 6,
        severity: "high",
        title: "Fallback behavior",
        body: "This should stay small and synchronous because artifact pages run without a backend."
      }
    ]
  }
};
