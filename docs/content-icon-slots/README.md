# Content Icon Slots

This document defines the first icon-slot direction for content components.

The goal is to enrich `ContentItem` and `ContentSet` expression without turning MDX Artifacts into an icon library or a general UI kit.

## Core Decision

Content components may accept a lightweight `icon?: ReactNode` prop.

The icon is a decorative visual marker rendered in a component-defined position. It does not control layout, and authors must not put essential meaning only in the icon.

Use `title`, `badge`, `summary`, `tone`, `emphasis`, and children for meaning. Use `icon` only to make the content easier to scan.

## Recommended Authoring Model

Default agent-authored artifacts should use emoji or short visual markers:

```mdx
<ContentItem
  title="Low risk path"
  badge="Recommended"
  tone="positive"
  icon="✅"
>
  This path keeps the implementation small and easy to verify.
</ContentItem>
```

Project authors may inject their own icon components when they need a stricter visual system:

```mdx
import { CheckCircle } from "lucide-react";

<ContentItem
  title="Low risk path"
  badge="Recommended"
  tone="positive"
  icon={<CheckCircle />}
>
  This path keeps the implementation small and easy to verify.
</ContentItem>
```

The core package should not require `lucide-react` for this feature. If a project wants Lucide, Heroicons, custom SVGs, or a design-system icon package, it can pass those icons into the slot.

## Component-Owned Layout

The component owns icon placement.

For `ContentItem`, the icon should be fixed in the top-left title area:

```text
[icon] title                         [badge]
       summary
       body
```

For `ContentSet`, the icon should be fixed beside the set title:

```text
[icon] ContentSet title
       children...
```

Do not add `iconPosition` in the first version. If an artifact needs custom icon placement, authors should compose their own layout with primitives such as `Frame`, `Columns`, `Grid`, or `Stack`.

## API Boundary

First version:

```ts
type ContentItemProps = {
  icon?: ReactNode;
};

type ContentSetProps = {
  icon?: ReactNode;
};
```

Do not add `iconLabel` in the first version. The icon is decorative, so the semantic meaning must remain in existing text and tone props.

Do not add icon inheritance from `ContentSet` to `ContentSet.Item` in the first version. A set icon describes the group; an item icon describes the item.

## Non-goals

- Do not add `lucide-react` as a core dependency.
- Do not add an icon registry.
- Do not add `iconPosition`, `iconSize`, `iconShape`, or icon styling props.
- Do not make icons required.
- Do not replace semantic props with icon semantics.

## Related Documents

- [Migration plan](./content-icon-slots-migration-plan.md)
- [Phase 1 execution plan](./phase-1-content-icon-slots-execution-plan.md)
- [Component protocol](../component-protocol.md)
