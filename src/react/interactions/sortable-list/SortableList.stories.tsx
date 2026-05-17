import { Description, Primary, Stories, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { ArtifactStateProvider } from "../artifact-state/ArtifactState";
import { SortableList, type SortableListItem } from "./SortableList";

const baseItems: SortableListItem[] = [
  {
    id: "contentset-api",
    title: "Stabilize ContentSet API",
    summary: "Must land before public examples.",
    badge: "P0",
    tags: ["api", "docs"]
  },
  {
    id: "layout-guidance",
    title: "Clarify layout guidance",
    summary: "Explain Frame, Columns, Section, and ContentSet boundaries.",
    badge: "P1",
    tags: ["protocol"]
  },
  {
    id: "artifact-export",
    title: "Verify artifact export",
    summary: "Confirm the final artifact carries the sorted priority result.",
    badge: "P1",
    tags: ["export"]
  }
];

const meta = {
  title: "Artifact Components/SortableList",
  component: SortableList,
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SortableListDocsPage,
      description: {
        component:
          "SortableList presents a short structured item set that users can reorder. In a local writable artifact dev server it can also expose item editing controls; static artifacts remain read-only."
      }
    }
  },
  decorators: [
    (Story, context) =>
      context.parameters.artifactDaemon === "off" ? (
        <Story />
      ) : (
        <StorybookArtifactDaemon>
          <Story />
        </StorybookArtifactDaemon>
      )
  ]
} satisfies Meta<typeof SortableList>;

export default meta;

type Story = StoryObj<typeof meta>;

function SortableListDocsPage() {
  return (
    <>
      <Title />
      <Description />

      <p>
        Use SortableList when an artifact needs a short, structured priority list whose order matters. Keep long
        explanation in Markdown around the component, and keep item props focused on stable ids, concise titles, and short
        metadata.
      </p>

      <h2>Primary workflow</h2>
      <p>
        The primary story shows the local writable artifact experience. Storybook mocks the artifact daemon so editing
        controls are visible without writing the source MDX file.
      </p>
      <Primary />

      <h2>Variants</h2>
      <p>
        The remaining stories show the static artifact behavior, surface variants, and disabled items in a vertical docs
        flow.
      </p>
      <Stories includePrimary={false} />
    </>
  );
}

export const LaunchPriority: Story = {
  name: "Writable preview",
  parameters: {
    docs: {
      description: {
        story:
          "Shows the local writable artifact experience. Add, edit, and delete are mocked inside Storybook and do not write the source MDX file."
      }
    }
  },
  args: {
    id: "list.launch-priority",
    title: "Launch priority",
    summary: "Drag items, use the controls, or edit short item metadata in a local writable preview.",
    surface: "outlined",
    items: baseItems
  }
};

export const ReadOnlyArtifact: Story = {
  name: "Read-only artifact",
  parameters: {
    artifactDaemon: "off",
    docs: {
      description: {
        story: "Shows the static artifact behavior. Reordering controls are available, but item editing controls are hidden without a writable local daemon."
      }
    }
  },
  args: {
    id: "list.read-only",
    title: "Read-only handoff order",
    summary: "Static artifacts do not expose item add, edit, or delete controls.",
    surface: "outlined",
    items: baseItems
  }
};

export const PlainSurface: Story = {
  name: "Plain surface",
  parameters: {
    artifactDaemon: "off",
    docs: {
      description: {
        story: "Uses the plain surface when the list should sit quietly inside an already framed section."
      }
    }
  },
  args: {
    id: "list.plain-surface",
    title: "Plain priority list",
    summary: "A low-emphasis list for dense artifact pages.",
    surface: "plain",
    items: baseItems
  }
};

export const SubtleSurface: Story = {
  name: "Subtle surface",
  parameters: {
    artifactDaemon: "off",
    docs: {
      description: {
        story: "Uses the subtle surface for a light visual boundary without the weight of an outlined container."
      }
    }
  },
  args: {
    id: "list.subtle-surface",
    title: "Subtle priority list",
    summary: "A moderate-emphasis list for mixed narrative and workflow pages.",
    surface: "subtle",
    items: baseItems
  }
};

export const DisabledItem: Story = {
  name: "Disabled item",
  parameters: {
    artifactDaemon: "off",
    docs: {
      description: {
        story: "Shows a locked item that stays visible but cannot be moved by drag or keyboard-style controls."
      }
    }
  },
  args: {
    id: "list.disabled-item",
    title: "Priority list with a locked item",
    summary: "Disabled items remain in the list but cannot be reordered.",
    surface: "outlined",
    items: [
      baseItems[0],
      {
        ...baseItems[1],
        disabled: true,
        badge: "Locked"
      },
      baseItems[2]
    ]
  }
};

let restoreStorybookFetch: (() => void) | undefined;

function StorybookArtifactDaemon({ children }: { children: ReactNode }) {
  ensureStorybookArtifactFetch();

  useEffect(() => {
    return () => {
      restoreStorybookFetch?.();
      restoreStorybookFetch = undefined;
    };
  }, []);

  return <ArtifactStateProvider>{children}</ArtifactStateProvider>;
}

function ensureStorybookArtifactFetch() {
  if (typeof window === "undefined" || restoreStorybookFetch) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  let storybookState = {
    version: 1,
    source: "storybook://sortable-list",
    threads: [],
    interactions: {}
  };

  window.fetch = async (input, init) => {
    const pathname = getRequestPathname(input);

    if (pathname === "/__artifact/meta") {
      return createJsonResponse({
        sourcePath: "storybook://sortable-list",
        statePath: "storybook://sortable-list.state.json",
        writable: true
      });
    }

    if (pathname === "/__artifact/state") {
      if (init?.method === "POST" && typeof init.body === "string") {
        storybookState = JSON.parse(init.body);
      }

      return createJsonResponse(storybookState);
    }

    if (
      pathname === "/__artifact/interactions/add-item" ||
      pathname === "/__artifact/interactions/update-item" ||
      pathname === "/__artifact/interactions/remove-item"
    ) {
      return createJsonResponse({ ok: true, state: storybookState });
    }

    return originalFetch(input, init);
  };

  restoreStorybookFetch = () => {
    window.fetch = originalFetch;
  };
}

function getRequestPathname(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return new URL(input, window.location.origin).pathname;
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  return new URL(input.url, window.location.origin).pathname;
}

function createJsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json" },
    status: 200
  });
}
