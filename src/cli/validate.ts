import { readFile } from "node:fs/promises";
import path from "node:path";
import { componentRegistry } from "../react/registry";

export type ValidationResult = {
  errors: string[];
  warnings: string[];
};

const componentsRequiringStableId = [
  "Section",
  "ComparisonSet",
  "ComparisonSet.Item",
  "AnnotatedCode",
  "CodeBlock",
  "DiffBlock",
  "Callout",
  "ContentItem",
  "ContentSet",
  "ContentSet.Item",
  "SortableList"
];

const deprecatedAuthoringComponents = [
  {
    componentName: "DecisionMatrix",
    warning: "DecisionMatrix has been removed from the public API. Use ContentSet with ContentSet.Item children."
  },
  {
    componentName: "DecisionMatrix.Option",
    warning: "DecisionMatrix.Option has been removed from the public API. Use ContentSet.Item."
  },
  {
    componentName: "OptionGrid",
    warning: "OptionGrid has been removed from the public API. Use ContentSet with ContentSet.Item children."
  },
  {
    componentName: "OptionGrid.Item",
    warning: "OptionGrid.Item has been removed from the public API. Use ContentSet.Item."
  }
];

const deprecatedAuthoringProps = [
  {
    componentName: "DecisionMatrix",
    propName: "question",
    warning: 'DecisionMatrix prop "question" is deprecated. Use ContentSet prop "title".'
  },
  {
    componentName: "DecisionMatrix",
    propName: "options",
    warning: 'DecisionMatrix prop "options" is deprecated. Use ContentSet.Item children.'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "name",
    warning: 'DecisionMatrix.Option prop "name" is deprecated. Use "title".'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "pros",
    warning: 'DecisionMatrix.Option prop "pros" is deprecated. Move long lists into MDX children.'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "cons",
    warning: 'DecisionMatrix.Option prop "cons" is deprecated. Move long lists into MDX children.'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "risks",
    warning: 'DecisionMatrix.Option prop "risks" is deprecated. Move risks into MDX children.'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "confidence",
    warning: 'DecisionMatrix.Option prop "confidence" is deprecated. Use "badge" for short display labels.'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "verdict",
    warning: 'DecisionMatrix.Option prop "verdict" is deprecated. Use "summary" or MDX children.'
  },
  {
    componentName: "OptionGrid.Item",
    propName: "name",
    warning: 'OptionGrid.Item prop "name" is deprecated. Use "title".'
  },
  {
    componentName: "OptionGrid",
    propName: "options",
    warning: 'OptionGrid prop "options" is deprecated. Use ContentSet.Item children.'
  },
  {
    componentName: "OptionGrid.Item",
    propName: "intent",
    warning: 'OptionGrid.Item prop "intent" is deprecated. Use "summary" for short intent text.'
  },
  {
    componentName: "OptionGrid.Item",
    propName: "description",
    warning: 'OptionGrid.Item prop "description" is deprecated. Move longer descriptions into MDX children.'
  },
  {
    componentName: "OptionGrid.Item",
    propName: "tradeoffs",
    warning: 'OptionGrid.Item prop "tradeoffs" is deprecated. Move tradeoff lists into MDX children.'
  }
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

  for (const deprecatedComponent of deprecatedAuthoringComponents) {
    if (hasOpeningTag(sourceWithoutStringLiterals, deprecatedComponent.componentName)) {
      result.warnings.push(deprecatedComponent.warning);
    }
  }

  for (const deprecatedProp of deprecatedAuthoringProps) {
    if (
      hasOpeningTagWithProp(
        sourceWithoutStringLiterals,
        deprecatedProp.componentName,
        deprecatedProp.propName
      )
    ) {
      result.warnings.push(deprecatedProp.warning);
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

function hasOpeningTag(source: string, componentName: string) {
  const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = new RegExp(`<${escapedName}(?=[\\s>/])`);
  return tagPattern.test(source);
}

function hasOpeningTagWithProp(source: string, componentName: string, propName: string) {
  const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = new RegExp(`<${escapedName}(?=[\\s>/])[^>]*>`, "g");
  const propPattern = new RegExp(`\\s${propName}\\s*=`);

  for (const match of source.matchAll(tagPattern)) {
    if (propPattern.test(match[0])) {
      return true;
    }
  }

  return false;
}
