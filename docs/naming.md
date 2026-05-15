# Naming Conventions

Naming should help agents choose the right component without long prompt instructions.

## Component Names

Use `PascalCase`.

Component names should describe the artifact workflow:

- `DecisionMatrix`
- `OptionGrid`
- `ExportPanel`
- `InlineText`
- `MarkdownBody`

Avoid vague primitive names:

- `Text`
- `Panel`
- `CardList`
- `Box`

Use `Markdown` in a component name only when the component consumes a Markdown string.

## Text Field Names

Use a small shared vocabulary:

- `title`: short title, usually `inlineMarkdown`
- `subtitle`: secondary short title, usually `inlineMarkdown`
- `description`: short explanation, usually `inlineMarkdown`
- `caption`: auxiliary note, usually `inlineMarkdown`
- `text`: primary field for `InlineText`
- `body`: primary field for `MarkdownBody` and future long-form prose components

Avoid introducing synonyms unless a component has a specific workflow reason:

- `copy`
- `message`
- `content`
- `details`
- `richText`

## Content Types

The registry can label prop content with these content types:

- `plainText`
- `inlineMarkdown`
- `blockMarkdown`
- `json`
- `code`

Agents should inspect content types through:

```bash
artifact-kit components <ComponentName>
artifact-kit components <ComponentName> --json
```

## Complex Prop Types

Complex object props must be queryable without opening TypeScript source files.

If a prop type references a named object or object array, add `types` metadata in `src/react/registry.ts`.

Examples:

- `DiffLine[]` requires a `DiffLine` type entry.
- `CodeAnnotation[]` requires a `CodeAnnotation` type entry.
- `DecisionMatrixOption[]` still requires a `DecisionMatrixOption` type entry when the structured-data form is supported.

Each nested field should include:

- `name`
- `type`
- `required` when true
- `contentType` when the field contains text, Markdown, JSON, or code
- `description`

The CLI output should be sufficient for an agent to write valid MDX without relying on editor LSP hover information.

## Markdown Levels

`inlineMarkdown` supports:

- bold
- emphasis
- strikethrough
- inline code
- links

`blockMarkdown` supports:

- headings
- paragraphs
- ordered lists
- unordered lists
- blockquotes
- bold
- emphasis
- strikethrough
- inline code
- links

`blockMarkdown` intentionally does not support tables, HTML, math, or code blocks.

For main artifact structure, prefer component title props or `InlineText as="h2"` instead of headings inside body strings. Headings inside `MarkdownBody` are for local body sections.

Use:

```tsx
<InlineText as="h3">**Recommended option**</InlineText>
```

Avoid:

```md
### **Recommended option**
```

inside component string props.
