import "../src/react/styles.css";

import { Description, Primary, Stories, Title } from "@storybook/addon-docs/blocks";
import type { Preview } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { CommentLayer } from "../src/react";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Artifact theme",
      defaultValue: "system",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" }
        ],
        dynamicTitle: true
      }
    }
  },
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Description />
          <Primary />
          <h2>Variants</h2>
          <p>Review the remaining stories for visual states, surface choices, and composition boundaries.</p>
          <Stories includePrimary={false} />
        </>
      )
    }
  },
  decorators: [
    (Story, context) => (
      <ThemeScope theme={context.globals.theme}>
        <main className="ak-shell">
          <article className="ak-document">
            <CommentLayer>
              <Story />
            </CommentLayer>
          </article>
        </main>
      </ThemeScope>
    )
  ]
};

export default preview;

function ThemeScope({ children, theme }: { children: ReactNode; theme: unknown }) {
  useEffect(() => {
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
      return;
    }

    delete document.documentElement.dataset.theme;
  }, [theme]);

  return <>{children}</>;
}
