import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function initProject(projectRoot: string) {
  const docsDir = path.join(projectRoot, "artifact-docs", "examples");
  const agentsDir = path.join(projectRoot, "agents");

  await mkdir(docsDir, { recursive: true });
  await mkdir(agentsDir, { recursive: true });

  await writeFile(
    path.join(projectRoot, "artifact-kit.config.ts"),
    `import type { ArtifactKitConfig } from "./src/cli/types";

const config: ArtifactKitConfig = {
  docsDir: "artifact-docs",
  outDir: "dist/artifacts",
  includeDefaultStyles: true,
  styles: []
};

export default config;
`,
    { flag: "wx" }
  ).catch(ignoreExisting);

  await writeFile(
    path.join(agentsDir, "AGENTS.snippet.md"),
    `# Artifact Kit Agent Instructions

1. Create .mdx files under artifact-docs/.
2. Prefer Artifact Kit high-level components. Do not generate raw HTML unless explicitly requested.
3. Interactive artifacts must include ExportPanel or an equivalent export path.
4. Run artifact-kit components <ComponentName> when component props are unclear.
5. Run artifact-kit validate <file.mdx> before build.
6. Run artifact-kit build <file.mdx> to produce standalone HTML.
`,
    { flag: "wx" }
  ).catch(ignoreExisting);

  await writeFile(
    path.join(docsDir, "hello.mdx"),
    `import { DecisionMatrix, ExportPanel } from "../../src/react";

# Hello Artifact

<DecisionMatrix
  question="Has Artifact Kit been initialized?"
  options={[
    {
      name: "Initialized",
      pros: ["MDX source exists", "Export panel exists"],
      cons: ["Real content still needs to be added"],
      verdict: "Ready to continue generating artifacts"
    }
  ]}
/>

<ExportPanel
  value={{
    recommendation: "Continue generating interactive HTML artifacts with MDX and high-level components"
  }}
/>
`,
    { flag: "wx" }
  ).catch(ignoreExisting);

  console.log("Artifact Kit initialized.");
}

function ignoreExisting(error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
    throw error;
  }
}
