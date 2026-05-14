export type ComponentPropMeta = {
  name: string;
  type: string;
  contentType?: "plainText" | "inlineMarkdown" | "blockMarkdown" | "json" | "code";
  required?: boolean;
  description: string;
};

export type ComponentTypeMeta = {
  name: string;
  description?: string;
  fields: ComponentPropMeta[];
};

export type ComponentMeta = {
  name: string;
  category?: "artifact" | "content" | "layout" | "semantic";
  stability?: "stable" | "advanced";
  description: string;
  useWhen: string[];
  props: ComponentPropMeta[];
  types?: ComponentTypeMeta[];
  example: string;
};

export const componentRegistry: ComponentMeta[] = [
  {
    name: "InlineText",
    category: "content",
    stability: "stable",
    description: "Renders short single-line text with controlled inline Markdown.",
    useWhen: ["Titles", "Labels", "Captions", "Short notes", "Inline explanations"],
    props: [
      {
        name: "text",
        type: "string",
        contentType: "inlineMarkdown",
        required: true,
        description: "Short text. Supports bold, emphasis, strikethrough, inline code, and links."
      },
      {
        name: "as",
        type: "'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'",
        description: "Semantic element to render. Use this instead of Markdown headings."
      },
      {
        name: "variant",
        type: "'default' | 'title' | 'subtitle' | 'label' | 'caption'",
        description: "Visual text variant."
      }
    ],
    example: `<InlineText
  as="h3"
  variant="subtitle"
  text="Use **MDX** as source and ~~raw HTML~~ only as fallback."
/>`
  },
  {
    name: "MarkdownBody",
    category: "content",
    stability: "stable",
    description: "Renders controlled multi-line Markdown for component body copy.",
    useWhen: ["Body explanations", "Short artifact notes", "Controlled lists", "Component-local prose"],
    props: [
      {
        name: "body",
        type: "string",
        contentType: "blockMarkdown",
        required: true,
        description:
          "Multi-line Markdown. Supports headings, paragraphs, lists, blockquotes, bold, emphasis, strikethrough, inline code, and links. Prefer component title props for main artifact structure."
      },
      {
        name: "variant",
        type: "'default' | 'compact'",
        description: "Body density variant."
      }
    ],
    example: `<MarkdownBody
  body={\`Use MarkdownBody when a component needs controlled body copy:

- **Readable** paragraphs and lists
- \\\`inline code\\\` for short technical names
- Headings for local body sections
- No tables, HTML, math, or code blocks\`}
/>`
  },
  {
    name: "CodeBlock",
    category: "content",
    stability: "stable",
    description: "Renders code text with optional filename, language label, line numbers, and highlighted lines.",
    useWhen: ["Code examples", "Implementation notes", "Technical explanations", "Code review context"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Prefer short semantic ids such as code.example."
      },
      {
        name: "code",
        type: "string",
        contentType: "code",
        required: true,
        description: "Raw code text. Whitespace and indentation are preserved."
      },
      {
        name: "language",
        type: "string",
        description: "Optional language label and future highlighter hook. Does not enable syntax highlighting in v1."
      },
      {
        name: "filename",
        type: "string",
        contentType: "plainText",
        description: "Optional filename shown above the code."
      },
      {
        name: "showLineNumbers",
        type: "boolean",
        description: "Shows one-based line numbers when true."
      },
      {
        name: "highlightLines",
        type: "number[]",
        description: "One-based line numbers to visually emphasize."
      }
    ],
    example: `<CodeBlock
  id="code.artifact-normalizer"
  filename="src/artifact.ts"
  language="ts"
  showLineNumbers
  highlightLines={[2]}
  code={\`export function createArtifact(input: ArtifactInput) {
  return normalizeInput(input);
}\`}
/>`
  },
  {
    name: "DiffBlock",
    category: "content",
    stability: "stable",
    description:
      "Renders structured diff lines with add, remove, and context rows plus a compact effective line number column.",
    useWhen: ["Code review context", "Patch explanations", "Before and after code changes", "Implementation reports"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Prefer short semantic ids such as diff.patch."
      },
      {
        name: "lines",
        type: "DiffLine[]",
        contentType: "json",
        required: true,
        description:
          "Structured diff rows. Each row has type, optional oldLine, optional newLine, and content. The UI shows one effective line number."
      },
      {
        name: "filename",
        type: "string",
        contentType: "plainText",
        description: "Optional filename shown above the diff."
      },
      {
        name: "language",
        type: "string",
        description: "Optional language label and future highlighter hook. Does not enable syntax highlighting in v1."
      }
    ],
    types: [
      {
        name: "DiffLine",
        description: "One structured row in a rendered diff.",
        fields: [
          {
            name: "type",
            type: "'add' | 'remove' | 'context'",
            required: true,
            description: "Diff row kind. Use add for inserted lines, remove for deleted lines, and context for unchanged lines."
          },
          {
            name: "oldLine",
            type: "number",
            description: "Original file line number. Required for remove rows and usually present for context rows."
          },
          {
            name: "newLine",
            type: "number",
            description: "New file line number. Required for add rows and usually present for context rows."
          },
          {
            name: "content",
            type: "string",
            contentType: "code",
            required: true,
            description: "Line content without the leading diff marker."
          }
        ]
      }
    ],
    example: `<DiffBlock
  id="diff.exporter"
  filename="src/exporter.ts"
  language="ts"
  lines={[
    { type: "context", oldLine: 12, newLine: 12, content: "export function serialize(value: unknown) {" },
    { type: "remove", oldLine: 13, content: "  return JSON.stringify(value);" },
    { type: "add", newLine: 13, content: "  return JSON.stringify(value, null, 2);" },
    { type: "context", oldLine: 14, newLine: 14, content: "}" }
  ]}
/>`
  },
  {
    name: "SeverityBadge",
    category: "semantic",
    stability: "stable",
    description: "Renders a compact severity, confidence, status, or risk label.",
    useWhen: ["Code review findings", "Risk labels", "Status summaries", "Annotated explanations"],
    props: [
      {
        name: "level",
        type: "'info' | 'low' | 'medium' | 'high' | 'critical'",
        description: "Severity level. Defaults to info."
      },
      {
        name: "label",
        type: "string",
        contentType: "plainText",
        description: "Optional visible label. Defaults to a title-cased version of the level."
      }
    ],
    example: `<SeverityBadge level="high" label="Regression risk" />`
  },
  {
    name: "Callout",
    category: "semantic",
    stability: "stable",
    description: "Highlights a focused note, warning, recommendation, or risk with controlled Markdown body copy.",
    useWhen: ["Review notes", "Assumptions", "Warnings", "Implementation gotchas", "Recommendations"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Prefer short semantic ids such as callout.risk."
      },
      {
        name: "body",
        type: "string",
        contentType: "blockMarkdown",
        required: true,
        description: "Controlled Markdown body. Use for the message inside the callout."
      },
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        description: "Optional callout title."
      },
      {
        name: "tone",
        type: "'info' | 'success' | 'warning' | 'danger'",
        description: "Visual tone. Defaults to info."
      }
    ],
    example: `<Callout
  id="callout.review-focus"
  tone="warning"
  title="Review focus"
  body="Check the **export path** before treating this artifact as complete."
/>`
  },
  {
    name: "AnnotatedCode",
    category: "semantic",
    stability: "stable",
    description: "Combines a CodeBlock with line-level annotations and severity labels.",
    useWhen: ["Code explanations", "Review focus areas", "Implementation walkthroughs", "Risk notes tied to code lines"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Child code and annotation anchors derive from this id."
      },
      {
        name: "code",
        type: "string",
        contentType: "code",
        required: true,
        description: "Raw code text. Whitespace and indentation are preserved."
      },
      {
        name: "annotations",
        type: "CodeAnnotation[]",
        contentType: "json",
        required: true,
        description: "Line-level annotations with line, optional title, Markdown body, and optional severity."
      },
      {
        name: "language",
        type: "string",
        description: "Optional language label passed through to CodeBlock."
      },
      {
        name: "filename",
        type: "string",
        contentType: "plainText",
        description: "Optional filename shown above the code."
      },
      {
        name: "showLineNumbers",
        type: "boolean",
        description: "Shows line numbers. Defaults to true."
      },
      {
        name: "highlightLines",
        type: "number[]",
        description: "Additional one-based line numbers to visually emphasize."
      }
    ],
    types: [
      {
        name: "CodeAnnotation",
        description: "Line-level explanation attached to a CodeBlock line.",
        fields: [
          {
            name: "id",
            type: "string",
            contentType: "plainText",
            description: "Optional stable child anchor id. When AnnotatedCode has id, child anchors become parentId.annotationId."
          },
          {
            name: "line",
            type: "number",
            required: true,
            description: "One-based line number in the code string."
          },
          {
            name: "body",
            type: "string",
            contentType: "blockMarkdown",
            required: true,
            description: "Controlled Markdown explanation for this line."
          },
          {
            name: "title",
            type: "string",
            contentType: "inlineMarkdown",
            description: "Optional short annotation title."
          },
          {
            name: "severity",
            type: "'info' | 'low' | 'medium' | 'high' | 'critical'",
            description: "Optional severity label. Defaults to info in the rendered badge."
          }
        ]
      }
    ],
    example: `<AnnotatedCode
  id="code.export-panel"
  filename="src/export-panel.ts"
  language="ts"
  code={\`export function copyOutput(value: string) {
  return navigator.clipboard.writeText(value);
}\`}
  annotations={[
    {
      id: "clipboard-boundary",
      line: 2,
      severity: "medium",
      title: "Clipboard boundary",
      body: "Keep a fallback for local artifact previews."
    }
  ]}
/>`
  },
  {
    name: "Stack",
    category: "layout",
    stability: "advanced",
    description: "Arranges children in a single vertical column with controlled spacing and alignment.",
    useWhen: ["Advanced composition", "Vertical sections", "Storybook layout checks"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Content to arrange vertically."
      },
      {
        name: "gap",
        type: "'sm' | 'md' | 'lg'",
        description: "Spacing between children. Defaults to md."
      },
      {
        name: "align",
        type: "'start' | 'center' | 'stretch'",
        description: "Horizontal child alignment. Defaults to stretch."
      }
    ],
    example: `<Stack gap="md">
  <MarkdownBody body="Use semantic components first." />
  <ExportPanel value={{ status: "ready" }} />
</Stack>`
  },
  {
    name: "Columns",
    category: "layout",
    stability: "advanced",
    description: "Arranges children in ratio-based columns that collapse responsively.",
    useWhen: ["Advanced composition", "Main and supporting content", "Side-by-side artifact sections"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Content to arrange into columns."
      },
      {
        name: "ratio",
        type: "'1:1' | '1:1:1' | '1:1:1:1' | '2:1' | '3:1' | '3:1:1' | '1:3:1' | '1:1:3'",
        description: "Column ratio. Defaults to 1:1."
      },
      {
        name: "gap",
        type: "'sm' | 'md' | 'lg'",
        description: "Spacing between columns. Defaults to md."
      },
      {
        name: "collapseAt",
        type: "'sm' | 'md' | 'lg'",
        description: "Viewport size where columns collapse to one column. Defaults to md."
      }
    ],
    example: `<Columns ratio="3:1" gap="md">
  <MarkdownBody body="Main explanation." />
  <Frame surface="subtle">Supporting notes</Frame>
</Columns>`
  },
  {
    name: "Grid",
    category: "layout",
    stability: "advanced",
    description: "Arranges children in equal-width two, three, or four column grids.",
    useWhen: ["Advanced composition", "Equal alternative cards", "Preview groups"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Content to arrange into equal columns."
      },
      {
        name: "columns",
        type: "2 | 3 | 4",
        description: "Number of equal columns. Defaults to 2."
      },
      {
        name: "gap",
        type: "'sm' | 'md' | 'lg'",
        description: "Spacing between grid items. Defaults to md."
      },
      {
        name: "collapseAt",
        type: "'sm' | 'md' | 'lg'",
        description: "Viewport size where the grid collapses to one column. Defaults to md."
      }
    ],
    example: `<Grid columns={3}>
  <Frame>Variant A</Frame>
  <Frame>Variant B</Frame>
  <Frame>Variant C</Frame>
</Grid>`
  },
  {
    name: "SplitPane",
    category: "layout",
    stability: "advanced",
    description: "Arranges children into a two-pane layout with a controlled ratio.",
    useWhen: ["Advanced composition", "Main content with sidebar", "Editor and preview layouts"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Two panes to arrange."
      },
      {
        name: "ratio",
        type: "'1:1' | '2:1' | '3:1' | '1:2' | '1:3'",
        description: "Pane ratio. Defaults to 3:1."
      },
      {
        name: "gap",
        type: "'sm' | 'md' | 'lg'",
        description: "Spacing between panes. Defaults to md."
      },
      {
        name: "collapseAt",
        type: "'sm' | 'md' | 'lg'",
        description: "Viewport size where panes collapse to one column. Defaults to md."
      }
    ],
    example: `<SplitPane ratio="3:1">
  <MarkdownBody body="Primary reading surface." />
  <Frame surface="outlined">Sidebar</Frame>
</SplitPane>`
  },
  {
    name: "Frame",
    category: "layout",
    stability: "advanced",
    description: "Provides a stable visual boundary for previews, snippets, mockups, or charts.",
    useWhen: ["Advanced composition", "Preview boundaries", "Code or mockup framing"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Content to frame."
      },
      {
        name: "surface",
        type: "'none' | 'plain' | 'subtle' | 'outlined'",
        description: "Visual surface treatment. Defaults to outlined."
      },
      {
        name: "padding",
        type: "'none' | 'sm' | 'md' | 'lg'",
        description: "Inner spacing. Defaults to md."
      }
    ],
    example: `<Frame surface="outlined" padding="md">
  <MarkdownBody body="A framed preview." />
</Frame>`
  },
  {
    name: "CommentLayer",
    category: "artifact",
    stability: "stable",
    description: "Provides local browser comment state for block-level artifact feedback. Artifact and Storybook shells provide this automatically.",
    useWhen: ["Custom React shells", "Reviewable artifacts", "Block-level user feedback", "Agent handoff comments"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "CommentableBlock and CommentExport children that share one local comment state. Most MDX authors should rely on the artifact shell instead of writing this manually."
      }
    ],
    example: `// Usually provided by the artifact shell.
<CommentLayer>
  <CommentableBlock blockId="decision" title="Decision">
    <DecisionMatrix question="Choose a path" options={[]} />
  </CommentableBlock>
  <CommentExport />
</CommentLayer>`
  },
  {
    name: "Section",
    category: "artifact",
    stability: "stable",
    description: "Defines a stable reviewable document section for native MDX prose.",
    useWhen: ["Reviewable prose sections", "Stable Markdown anchors", "Document structure", "Block-level feedback"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        required: true,
        description: "Stable unique anchor id for this section within one artifact."
      },
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        required: true,
        description: "Section heading text. Section renders this as the heading; do not repeat it inside children."
      },
      {
        name: "level",
        type: "1 | 2 | 3 | 4 | 5 | 6",
        description: "Heading level to render. Defaults to 2."
      },
      {
        name: "description",
        type: "string",
        contentType: "plainText",
        description: "Optional section context exported with comments."
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Native MDX prose or composed content that belongs to this section."
      }
    ],
    example: `<Section id="context" title="Context" level={2}>
  This section can contain native MDX paragraphs, lists, and code fences.

  - Stable review anchor
  - Generated heading
  - One comment thread per section
</Section>`
  },
  {
    name: "CommentableBlock",
    category: "artifact",
    stability: "stable",
    description: "Wraps any artifact content with a stable block target and hover-revealed local comment input.",
    useWhen: ["Commenting on existing components", "Commenting on prose blocks", "Exporting block-level feedback"],
    props: [
      {
        name: "blockId",
        type: "string",
        contentType: "plainText",
        required: true,
        description: "Stable unique identifier for this comment target within one artifact."
      },
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        required: true,
        description: "Human-readable block title shown in the UI and exported comments."
      },
      {
        name: "description",
        type: "string",
        contentType: "plainText",
        description: "Optional block context exported with comments."
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "The prose, semantic component, or layout composition being reviewed."
      }
    ],
    example: `<CommentableBlock
  blockId="component-menu"
  title="Component menu"
  description="Feedback on the option grid"
>
  <OptionGrid title="Components" options={[]} />
</CommentableBlock>`
  },
  {
    name: "CommentTarget",
    category: "artifact",
    stability: "stable",
    description: "Marks a fine-grained comment target with hover affordance and persistent comment count.",
    useWhen: ["Component internals", "Fine-grained review targets", "Custom local component comment anchors"],
    props: [
      {
        name: "targetId",
        type: "string",
        contentType: "plainText",
        required: true,
        description: "Stable unique identifier for this fine-grained comment target within one artifact."
      },
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        required: true,
        description: "Human-readable target title shown in the form and exported comments."
      },
      {
        name: "description",
        type: "string",
        contentType: "plainText",
        description: "Optional target context exported with comments."
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "The smallest visible content block being reviewed."
      }
    ],
    example: `<CommentTarget targetId="decision-explicit-blocks" title="Explicit blocks">
  <Frame surface="outlined">Small reviewable block</Frame>
</CommentTarget>`
  },
  {
    name: "CommentExport",
    category: "artifact",
    stability: "stable",
    description: "Compatibility dock for exporting comments from the nearest CommentLayer. Prefer ExportPanel when an artifact also has result output.",
    useWhen: ["Comments-only artifacts", "Legacy comment handoff", "Copying review comments without a result export"],
    props: [
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        description: "Comment export drawer title. Defaults to Export Comments."
      },
      {
        name: "formats",
        type: "Array<'markdown' | 'json'>",
        description: "Available comment export formats. Defaults to markdown and json."
      }
    ],
    types: [
      {
        name: "ArtifactComment",
        description: "One block-level comment exported from CommentLayer.",
        fields: [
          {
            name: "blockId",
            type: "string",
            contentType: "plainText",
            required: true,
            description: "Stable identifier for the commented block."
          },
          {
            name: "blockTitle",
            type: "string",
            contentType: "plainText",
            required: true,
            description: "Human-readable title for the commented block."
          },
          {
            name: "blockDescription",
            type: "string",
            contentType: "plainText",
            description: "Optional block context."
          },
          {
            name: "comment",
            type: "string",
            contentType: "plainText",
            required: true,
            description: "User-entered block-level comment."
          },
          {
            name: "createdAt",
            type: "string",
            description: "ISO timestamp created in the browser when the comment is added."
          }
        ]
      }
    ],
    example: `<CommentExport
  title="Export artifact feedback"
  formats={["markdown", "json"]}
/>`
  },
  {
    name: "DecisionMatrix",
    category: "artifact",
    stability: "stable",
    description: "Compares options by pros, cons, risks, confidence, and recommendation.",
    useWhen: ["Architecture decisions", "Product tradeoffs", "Implementation planning", "Open-source roadmap"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Prefer short semantic ids such as decision.comment-targets."
      },
      {
        name: "question",
        type: "string",
        contentType: "inlineMarkdown",
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
    types: [
      {
        name: "DecisionMatrixOption",
        description: "One option in a decision comparison.",
        fields: [
          {
            name: "id",
            type: "string",
            contentType: "plainText",
            description: "Optional stable child anchor id. When the parent has id, child anchors become parentId.optionId."
          },
          {
            name: "name",
            type: "string",
            contentType: "inlineMarkdown",
            required: true,
            description: "Option title."
          },
          {
            name: "summary",
            type: "string",
            contentType: "inlineMarkdown",
            description: "Short option summary."
          },
          {
            name: "pros",
            type: "string[]",
            contentType: "inlineMarkdown",
            description: "Advantages for this option."
          },
          {
            name: "cons",
            type: "string[]",
            contentType: "inlineMarkdown",
            description: "Disadvantages for this option."
          },
          {
            name: "risks",
            type: "string[]",
            contentType: "inlineMarkdown",
            description: "Risks or failure modes for this option."
          },
          {
            name: "confidence",
            type: "'low' | 'medium' | 'high'",
            description: "Confidence level for this option."
          },
          {
            name: "verdict",
            type: "string",
            contentType: "inlineMarkdown",
            description: "Short recommendation or conclusion for this option."
          }
        ]
      }
    ],
    example: `<DecisionMatrix
  id="decision.stage-one"
  question="Should the first stage focus on a Vite single HTML artifact?"
  options={[
    {
      id: "vite",
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
    name: "ComparisonSet",
    category: "artifact",
    stability: "stable",
    description: "Groups comparable candidates while allowing each item to render arbitrary component content.",
    useWhen: ["Candidate comparison", "Mixed media alternatives", "Prototype comparison", "Reviewable option sets"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Prefer short semantic ids such as comparison.content-shapes."
      },
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        required: true,
        description: "Comparison set title."
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description:
          "Use `ComparisonSet.Item` children. Each item accepts title, optional value, and arbitrary component content."
      },
      {
        name: "columns",
        type: "2 | 3 | 4",
        description: "Number of comparison columns. Defaults to 2."
      }
    ],
    types: [
      {
        name: "ComparisonSet.Item",
        description: "Compound child used inside ComparisonSet.",
        fields: [
          {
            name: "id",
            type: "string",
            contentType: "plainText",
            description: "Optional stable child anchor id. When the parent has id, child anchors become parentId.itemId."
          },
          {
            name: "title",
            type: "string",
            contentType: "inlineMarkdown",
            required: true,
            description: "Item title."
          },
          {
            name: "children",
            type: "ReactNode",
            required: true,
            description: "Arbitrary component content for this comparable item."
          },
          {
            name: "value",
            type: "string",
            contentType: "plainText",
            description: "Optional stable machine value for future review or export flows."
          }
        ]
      }
    ],
    example: `<ComparisonSet id="comparison.artifact-forms" title="Compare artifact forms" columns={3}>
  <ComparisonSet.Item id="markdown" title="Markdown explanation" value="markdown">
    <MarkdownBody body="Best for prose-heavy context." />
  </ComparisonSet.Item>
  <ComparisonSet.Item id="code" title="Code path" value="code">
    <Frame surface="subtle">Code renderer or local component</Frame>
  </ComparisonSet.Item>
</ComparisonSet>`
  },
  {
    name: "OptionGrid",
    category: "artifact",
    stability: "stable",
    description: "Displays multiple options, component candidates, or prototype directions in a scannable grid.",
    useWhen: ["Option exploration", "Component scope", "Prototype comparison"],
    props: [
      {
        name: "id",
        type: "string",
        contentType: "plainText",
        description: "Optional stable anchor id for comments and state. Prefer short semantic ids such as option.comment-flow."
      },
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
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
    types: [
      {
        name: "OptionGridItem",
        description: "One option in an OptionGrid.",
        fields: [
          {
            name: "id",
            type: "string",
            contentType: "plainText",
            description: "Optional stable child anchor id. When the parent has id, child anchors become parentId.itemId."
          },
          {
            name: "name",
            type: "string",
            contentType: "inlineMarkdown",
            required: true,
            description: "Option title."
          },
          {
            name: "intent",
            type: "string",
            contentType: "inlineMarkdown",
            description: "Short statement of what this option is trying to achieve."
          },
          {
            name: "description",
            type: "string",
            contentType: "inlineMarkdown",
            description: "Short option description."
          },
          {
            name: "tradeoffs",
            type: "string[]",
            contentType: "inlineMarkdown",
            description: "Tradeoffs or caveats for this option."
          }
        ]
      }
    ],
    example: `<OptionGrid
  id="option.first-components"
  title="First component scope"
  options={[
    {
      id: "export",
      name: "ExportPanel",
      intent: "Return human edits to the workflow",
      tradeoffs: ["Copy-only in v1", "Can add downloads later"]
    }
  ]}
/>`
  },
  {
    name: "ExportPanel",
    category: "artifact",
    stability: "stable",
    description: "Shows a floating export dock for artifact results and, when comments are available, review comments.",
    useWhen: ["Exporting decisions", "Copying state back to an agent", "Issue or PR handoff", "Configuration handoff", "Exporting comments with artifact results"],
    props: [
      {
        name: "title",
        type: "string",
        contentType: "inlineMarkdown",
        description: "Export drawer title. Defaults to Export Result."
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
];

export function findComponentMeta(name: string) {
  return componentRegistry.find((component) => component.name.toLowerCase() === name.toLowerCase());
}
