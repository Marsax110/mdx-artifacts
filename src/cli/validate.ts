import { readFile } from "node:fs/promises";
import path from "node:path";
import { componentRegistry } from "../react/registry";

export type ValidationResult = {
  errors: string[];
  warnings: string[];
};

const componentsRequiringStableId = [
  "Section",
  "DecisionMatrix",
  "OptionGrid",
  "ComparisonSet",
  "ComparisonSet.Item",
  "AnnotatedCode",
  "CodeBlock",
  "DiffBlock",
  "Callout"
];

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

  const sourceWithoutStringLiterals = stripStringLiterals(source);
  for (const componentName of componentsRequiringStableId) {
    if (hasOpeningTagWithoutProp(sourceWithoutStringLiterals, componentName, "id")) {
      result.warnings.push(
        `${componentName} should include a stable id prop so comments and state can use a durable anchorId.`
      );
    }
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

function stripStringLiterals(source: string) {
  return source
    .replace(/`(?:\\[\s\S]|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function hasOpeningTagWithoutProp(source: string, componentName: string, propName: string) {
  const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = new RegExp(`<${escapedName}(?=[\\s>/])[^>]*>`, "g");
  const propPattern = new RegExp(`\\s${propName}\\s*=`);

  for (const match of source.matchAll(tagPattern)) {
    const openingTag = match[0];
    if (!propPattern.test(openingTag)) {
      return true;
    }
  }

  return false;
}
