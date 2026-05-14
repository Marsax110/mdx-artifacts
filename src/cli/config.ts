import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ArtifactKitConfig } from "./types";

const defaultConfig: Required<ArtifactKitConfig> = {
  docsDir: "artifact-docs",
  includeDefaultStyles: true,
  outDir: "dist/artifacts",
  port: 4321,
  styles: []
};

export async function loadConfig(projectRoot: string): Promise<Required<ArtifactKitConfig>> {
  const configPath = await findConfigPath(projectRoot);

  if (!configPath) {
    return defaultConfig;
  }

  try {
    const imported = (await import(pathToFileURL(configPath).href)) as { default?: ArtifactKitConfig };
    return { ...defaultConfig, ...(imported.default ?? {}) };
  } catch (error) {
    throw new Error(`Failed to read ${path.basename(configPath)}: ${String(error)}`);
  }
}

async function findConfigPath(projectRoot: string) {
  for (const filename of ["artifact-kit.config.mjs", "artifact-kit.config.js", "artifact-kit.config.ts"]) {
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
