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

## Markdown Levels

`inlineMarkdown` supports:

- bold
- emphasis
- strikethrough
- inline code
- links

`blockMarkdown` supports:

- paragraphs
- ordered lists
- unordered lists
- blockquotes
- bold
- emphasis
- strikethrough
- inline code
- links

`blockMarkdown` intentionally does not support headings, tables, HTML, math, or code blocks.

Heading level is controlled by component props such as `as`, not by Markdown heading syntax inside strings.

Use:

```tsx
<InlineText as="h3" text="**Recommended option**" />
```

Avoid:

```md
### **Recommended option**
```

inside component string props.
