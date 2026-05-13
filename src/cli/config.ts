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
  const configPath = path.join(projectRoot, "artifact-kit.config.ts");

  try {
    await access(configPath);
  } catch {
    return defaultConfig;
  }

  try {
    const imported = (await import(pathToFileURL(configPath).href)) as { default?: ArtifactKitConfig };
    return { ...defaultConfig, ...(imported.default ?? {}) };
  } catch (error) {
    throw new Error(`Failed to read artifact-kit.config.ts: ${String(error)}`);
  }
}
