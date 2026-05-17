import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContentItem, ContentSet } from "./ContentItem";

const meta = {
  title: "Artifact Components/ContentSet",
  component: ContentSet,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "ContentSet groups short content items into stack or grid layouts while keeping rich prose in children."
      }
    }
  }
} satisfies Meta<typeof ContentSet>;

export default meta;

type Story = StoryObj<typeof meta>;

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M8 1.5 9.7 6l4.8 2-4.8 2L8 14.5 6.3 10 1.5 8l4.8-2L8 1.5Z" fill="currentColor" />
    </svg>
  );
}

export const Grid: Story = {
  args: {
    id: "set.authoring-paths",
    title: "Authoring paths",
    layout: "grid",
    columns: 3,
    surface: "subtle"
  },
  render: () => (
    <ContentSet id="set.authoring-paths" title="Authoring paths" layout="grid" columns={3} surface="subtle">
      <ContentSet.Item
        id="component-first"
        title="Component-first"
        badge="Recommended"
        tone="positive"
        emphasis="primary"
        summary="Best for stable interaction and visual structure."
      >
        <h4>Tradeoffs</h4>
        <ul>
          <li>Clear component boundaries</li>
          <li>Easy to debug</li>
          <li>Less natural for long prose</li>
        </ul>
      </ContentSet.Item>
      <ContentSet.Item
        id="markdown-first"
        title="Markdown-first"
        badge="Readable"
        tone="info"
        summary="Best for prose-heavy documents and source diffs."
      >
        <p>Use this when the artifact is mostly narrative and only needs light structure.</p>
      </ContentSet.Item>
      <ContentSet.Item id="parser-first" title="Parser-first" badge="Risk" tone="warning" emphasis="subtle">
        <p>Use cautiously. Hidden Markdown protocols can make authoring harder to reason about.</p>
      </ContentSet.Item>
    </ContentSet>
  )
};

export const WithIcons: Story = {
  args: {
    id: "set.icon-slots",
    title: "Icon slot paths",
    layout: "grid",
    columns: 3,
    surface: "subtle",
    icon: "🧭"
  },
  render: () => (
    <ContentSet id="set.icon-slots" title="Icon slot paths" icon="🧭" layout="grid" columns={3} surface="subtle">
      <ContentSet.Item
        id="emoji"
        title="Emoji marker"
        badge="Default"
        icon="✅"
        tone="positive"
        summary="Best for agent-authored artifacts."
      >
        <p>Emoji keep the authoring model light and avoid a package-level icon dependency.</p>
      </ContentSet.Item>
      <ContentSet.Item
        id="react-node"
        title="React node marker"
        badge="Custom"
        icon={<SparkIcon />}
        tone="accent"
        summary="Use project icons when a stricter visual system is needed."
      >
        <p>The component still owns placement, sizing, and spacing.</p>
      </ContentSet.Item>
      <ContentSet.Item id="none" title="No marker" badge="Optional" summary="Icons are never required.">
        <p>Text slots and tone keep carrying the semantic meaning.</p>
      </ContentSet.Item>
    </ContentSet>
  )
};

export const Stack: Story = {
  args: {
    id: "set.release-risks",
    title: "Release risks",
    layout: "stack",
    surface: "outlined"
  },
  render: () => (
    <ContentSet id="set.release-risks" title="Release risks" layout="stack" surface="outlined" tone="warning">
      <ContentSet.Item id="api-drift" title="API drift" badge="Watch" summary="Docs and examples must match the exported API.">
        <p>Run validate and component metadata checks before publishing.</p>
      </ContentSet.Item>
      <ContentSet.Item id="package-smoke" title="Package smoke test" badge="Required" emphasis="primary">
        <p>Install the tarball in a temporary project and verify CLI plus React imports.</p>
      </ContentSet.Item>
    </ContentSet>
  )
};

export const StandaloneItem: Story = {
  args: {
    title: "Standalone item preview"
  },
  render: () => (
    <ContentItem
      id="item.api-boundary"
      title="API boundary"
      badge="Focus"
      tone="accent"
      emphasis="primary"
      icon="🎯"
      summary="Use ContentItem when a single reusable content block is enough."
    >
      <p>Put detailed rationale, lists, and caveats in children.</p>
    </ContentItem>
  )
};
