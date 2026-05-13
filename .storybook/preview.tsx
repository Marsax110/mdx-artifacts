import "../src/react/styles.css";

import type { Preview } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";

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
    layout: "padded"
  },
  decorators: [
    (Story, context) => (
      <ThemeScope theme={context.globals.theme}>
        <main className="ak-shell">
          <article className="ak-document">
            <Story />
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
