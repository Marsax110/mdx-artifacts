import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { ArtifactStateProvider } from "./ArtifactState";
import { SortableList } from "./SortableList";

const meta = {
  title: "Artifact Components/SortableList",
  component: SortableList,
  decorators: [
    (Story) => (
      <StorybookArtifactDaemon>
        <Story />
      </StorybookArtifactDaemon>
    )
  ]
} satisfies Meta<typeof SortableList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LaunchPriority: Story = {
  args: {
    id: "list.launch-priority",
    title: "Launch priority",
    summary: "Drag items or use the controls to change the handoff order.",
    surface: "outlined",
    items: [
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
