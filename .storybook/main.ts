import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  addons: ["@storybook/addon-docs"],
  stories: ["../src/react/**/*.stories.@(ts|tsx|mdx)"]
};

export default config;
