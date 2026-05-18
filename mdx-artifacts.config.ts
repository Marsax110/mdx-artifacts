import type { MdxArtifactsConfig } from "./src/cli/config/types";

const config: MdxArtifactsConfig = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: []
};

export default config;
