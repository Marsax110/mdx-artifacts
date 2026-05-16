import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/config";
import { buildArtifact, createArtifactProject } from "../dev-server/vite-artifact";

export async function buildCommand(projectRoot: string, input: string) {
  const config = await loadConfig(projectRoot);
  const mdxPath = path.resolve(projectRoot, input);
  const project = await createArtifactProject(projectRoot, mdxPath, config);

  try {
    const html = await buildArtifact(project);
    const outputPath = outputFileFor(projectRoot, mdxPath, config.docsDir, config.outDir);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
    console.log(`built ${path.relative(projectRoot, outputPath)}`);
  } finally {
    await project.cleanup();
  }
}

function outputFileFor(projectRoot: string, mdxPath: string, docsDir: string, outDir: string) {
  const docsRoot = path.resolve(projectRoot, docsDir);
  const relative = path.relative(docsRoot, mdxPath);
  const safeRelative = relative.startsWith("..") ? path.basename(mdxPath) : relative;
  return path.resolve(projectRoot, outDir, safeRelative.replace(/\.mdx$/, ".html"));
}
