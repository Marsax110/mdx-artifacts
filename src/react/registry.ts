export type ComponentPropMeta = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

export type ComponentMeta = {
  name: string;
  description: string;
  useWhen: string[];
  props: ComponentPropMeta[];
  example: string;
};

export const componentRegistry = [
  {
    name: "DecisionMatrix",
    description: "Compares options by pros, cons, risks, confidence, and recommendation.",
    useWhen: ["Architecture decisions", "Product tradeoffs", "Implementation planning", "Open-source roadmap"],
    props: [
      {
        name: "question",
        type: "string",
        required: true,
        description: "The decision question being answered."
      },
      {
        name: "options",
        type: "DecisionMatrixOption[]",
        required: true,
        description: "Options to compare. Each option can include name, pros, cons, risks, confidence, and verdict."
      }
    ],
    example: `<DecisionMatrix
  question="Should the first stage focus on a Vite single HTML artifact?"
  options={[
    {
      name: "Vite single HTML artifact",
      pros: ["Short feedback loop", "Direct component debugging"],
      cons: ["No docs-site navigation yet"],
      confidence: "high",
      verdict: "Recommended for stage one"
    }
  ]}
/>`
  },
  {
    name: "OptionGrid",
    description: "Displays multiple options, component candidates, or prototype directions in a scannable grid.",
    useWhen: ["Option exploration", "Component scope", "Prototype comparison"],
    props: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Grid title."
      },
      {
        name: "options",
        type: "OptionGridItem[]",
        required: true,
        description: "Items to display. Each item can include name, intent, description, and tradeoffs."
      }
    ],
    example: `<OptionGrid
  title="First component scope"
  options={[
    {
      name: "ExportPanel",
      intent: "Return human edits to the workflow",
      tradeoffs: ["Copy-only in v1", "Can add downloads later"]
    }
  ]}
/>`
  },
  {
    name: "ExportPanel",
    description: "Exports conclusions, configuration, or user-edited state as Markdown or JSON.",
    useWhen: ["Exporting decisions", "Copying state back to an agent", "Issue or PR handoff", "Configuration handoff"],
    props: [
      {
        name: "title",
        type: "string",
        description: "Export section title. Defaults to Export Result."
      },
      {
        name: "formats",
        type: "Array<'markdown' | 'json'>",
        description: "Available export formats. Defaults to markdown and json."
      },
      {
        name: "value",
        type: "unknown",
        required: true,
        description: "Structured value to serialize."
      }
    ],
    example: `<ExportPanel
  title="Export recommendation"
  formats={["markdown", "json"]}
  value={{
    recommendation: "Start with Vite + React + MDX to single HTML artifact.",
    nextSteps: ["Add CLI component metadata lookup", "Support external CSS injection"]
  }}
/>`
  }
] satisfies ComponentMeta[];

export function findComponentMeta(name: string) {
  return componentRegistry.find((component) => component.name.toLowerCase() === name.toLowerCase());
}
