import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { MdxArtifactsConfig } from "./types";

const defaultConfig: Required<MdxArtifactsConfig> = {
  docsDir: "artifact-docs",
  includeDefaultStyles: true,
  outDir: "dist/artifacts",
  port: 4321,
  styles: [],
  tailwindSources: []
};

export async function loadConfig(projectRoot: string): Promise<Required<MdxArtifactsConfig>> {
  const configPath = await findConfigPath(projectRoot);

  if (!configPath) {
    return defaultConfig;
  }

  try {
    const imported = (await import(pathToFileURL(configPath).href)) as { default?: MdxArtifactsConfig };
    return { ...defaultConfig, ...(imported.default ?? {}) };
  } catch (error) {
    throw new Error(`Failed to read ${path.basename(configPath)}: ${String(error)}`);
  }
}

async function findConfigPath(projectRoot: string) {
  for (const filename of ["mdx-artifacts.config.mjs", "mdx-artifacts.config.js", "mdx-artifacts.config.ts"]) {
    const configPath = path.join(projectRoot, filename);
    try {
      await access(configPath);
      return configPath;
    } catch {
      // Try the next supported config filename.
    }
  }

  return undefined;
}
