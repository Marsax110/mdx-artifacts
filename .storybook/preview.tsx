import "../src/react/styles.css";

import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "padded"
  },
  decorators: [
    (Story) => (
      <main className="ak-shell">
        <article className="ak-document">
          <Story />
        </article>
      </main>
    )
  ]
};

export default preview;
