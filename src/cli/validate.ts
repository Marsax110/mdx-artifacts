import { readFile } from "node:fs/promises";
import path from "node:path";
import { componentRegistry } from "../react/registry";

export type ValidationResult = {
  errors: string[];
  warnings: string[];
};

export async function validateMdx(filePath: string): Promise<ValidationResult> {
  const result: ValidationResult = { errors: [], warnings: [] };

  if (path.extname(filePath) !== ".mdx") {
    result.errors.push("Input file must be .mdx.");
    return result;
  }

  let source = "";
  try {
    source = await readFile(filePath, "utf8");
  } catch {
    result.errors.push(`Failed to read file: ${filePath}`);
    return result;
  }

  if (source.includes("<script")) {
    result.errors.push("Do not write <script> directly in MDX. Wrap behavior in a controlled component.");
  }

  if (!source.includes("ExportPanel") && !source.includes("CommentExport")) {
    result.warnings.push("ExportPanel or equivalent export component not found. Interactive artifacts should provide an export path.");
  }

  if (source.length > 40_000) {
    result.warnings.push("MDX file is large. Move bulky data to adjacent JSON files.");
  }

  const knownComponents = componentRegistry.map((component) => component.name);
  const usedArtifactComponent = knownComponents.some((name) => source.includes(`<${name}`));
  if (!usedArtifactComponent) {
    result.warnings.push("No first-stage high-level artifact component found. Confirm plain MDX is intentional.");
  }

  return result;
}

export function printValidationResult(result: ValidationResult) {
  for (const error of result.errors) {
    console.error(`error: ${error}`);
  }

  for (const warning of result.warnings) {
    console.warn(`warn: ${warning}`);
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log("validate ok");
  }
}
