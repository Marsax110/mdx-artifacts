import { readFile } from "node:fs/promises";
import path from "node:path";
import { componentRegistry } from "../../react/registry";
import type { MdxArtifactsConfig } from "../config/types";
import type { ArtifactDiagnostic } from "../diagnostics/diagnostics";
import { validateResourceReferences } from "../resources/resource-policy";

export type { ArtifactDiagnostic } from "../diagnostics/diagnostics";

export type ValidationResult = {
  diagnostics: ArtifactDiagnostic[];
  errors: string[];
  warnings: string[];
};

export type ValidateMdxOptions = {
  projectRoot?: string;
  config?: Required<MdxArtifactsConfig>;
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
    warning: "DecisionMatrix has been removed from the public API. Use ContentSet with ContentSet.Item children.",
    suggestion: "Replace DecisionMatrix with ContentSet and ContentSet.Item children."
  },
  {
    componentName: "DecisionMatrix.Option",
    warning: "DecisionMatrix.Option has been removed from the public API. Use ContentSet.Item.",
    suggestion: "Replace DecisionMatrix.Option with ContentSet.Item."
  },
  {
    componentName: "OptionGrid",
    warning: "OptionGrid has been removed from the public API. Use ContentSet with ContentSet.Item children.",
    suggestion: "Replace OptionGrid with ContentSet and ContentSet.Item children."
  },
  {
    componentName: "OptionGrid.Item",
    warning: "OptionGrid.Item has been removed from the public API. Use ContentSet.Item.",
    suggestion: "Replace OptionGrid.Item with ContentSet.Item."
  }
];

const deprecatedAuthoringProps = [
  {
    componentName: "DecisionMatrix",
    propName: "question",
    warning: 'DecisionMatrix prop "question" is deprecated. Use ContentSet prop "title".',
    suggestion: 'Rename "question" to "title" when migrating to ContentSet.'
  },
  {
    componentName: "DecisionMatrix",
    propName: "options",
    warning: 'DecisionMatrix prop "options" is deprecated. Use ContentSet.Item children.',
    suggestion: "Move each option into an explicit ContentSet.Item child."
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "name",
    warning: 'DecisionMatrix.Option prop "name" is deprecated. Use "title".',
    suggestion: 'Rename "name" to "title".'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "pros",
    warning: 'DecisionMatrix.Option prop "pros" is deprecated. Move long lists into MDX children.',
    suggestion: "Move pros into the ContentSet.Item MDX body."
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "cons",
    warning: 'DecisionMatrix.Option prop "cons" is deprecated. Move long lists into MDX children.',
    suggestion: "Move cons into the ContentSet.Item MDX body."
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "risks",
    warning: 'DecisionMatrix.Option prop "risks" is deprecated. Move risks into MDX children.',
    suggestion: "Move risks into the ContentSet.Item MDX body."
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "confidence",
    warning: 'DecisionMatrix.Option prop "confidence" is deprecated. Use "badge" for short display labels.',
    suggestion: 'Use "badge" for short display labels.'
  },
  {
    componentName: "DecisionMatrix.Option",
    propName: "verdict",
    warning: 'DecisionMatrix.Option prop "verdict" is deprecated. Use "summary" or MDX children.',
    suggestion: 'Use "summary" for short verdict text or move longer verdicts into children.'
  },
  {
    componentName: "OptionGrid.Item",
    propName: "name",
    warning: 'OptionGrid.Item prop "name" is deprecated. Use "title".',
    suggestion: 'Rename "name" to "title".'
  },
  {
    componentName: "OptionGrid",
    propName: "options",
    warning: 'OptionGrid prop "options" is deprecated. Use ContentSet.Item children.',
    suggestion: "Move each option into an explicit ContentSet.Item child."
  },
  {
    componentName: "OptionGrid.Item",
    propName: "intent",
    warning: 'OptionGrid.Item prop "intent" is deprecated. Use "summary" for short intent text.',
    suggestion: 'Rename "intent" to "summary" when the text is short.'
  },
  {
    componentName: "OptionGrid.Item",
    propName: "description",
    warning: 'OptionGrid.Item prop "description" is deprecated. Move longer descriptions into MDX children.',
    suggestion: "Move longer descriptions into the ContentSet.Item MDX body."
  },
  {
    componentName: "OptionGrid.Item",
    propName: "tradeoffs",
    warning: 'OptionGrid.Item prop "tradeoffs" is deprecated. Move tradeoff lists into MDX children.',
    suggestion: "Move tradeoff lists into the ContentSet.Item MDX body."
  }
];

export async function validateMdx(filePath: string, options: ValidateMdxOptions = {}): Promise<ValidationResult> {
  const result = createValidationResult();

  if (path.extname(filePath) !== ".mdx") {
    addDiagnostic(result, {
      severity: "error",
      code: "invalid_file_extension",
      message: "Input file must be .mdx.",
      sourcePath: filePath,
      suggestion: "Pass a .mdx artifact source file to mdx-artifacts validate.",
      example: "mdx-artifacts validate artifact-docs/examples/hello.mdx"
    });
    return result;
  }

  let source = "";
  try {
    source = await readFile(filePath, "utf8");
  } catch {
    addDiagnostic(result, {
      severity: "error",
      code: "file_read_failed",
      message: `Failed to read file: ${filePath}`,
      sourcePath: filePath,
      suggestion: "Confirm the file exists and is readable."
    });
    return result;
  }

  if (source.includes("<script")) {
    addDiagnostic(result, {
      severity: "error",
      code: "raw_script_blocked",
      message: "Do not write <script> directly in MDX. Wrap behavior in a controlled component.",
      sourcePath: filePath,
      suggestion: "Move browser behavior into a controlled React component instead of inline script tags."
    });
  }

  if (options.config) {
    const resourceDiagnostics = await validateResourceReferences({
      projectRoot: options.projectRoot ?? process.cwd(),
      references: options.config.styles.map((stylePath) => ({
        type: "style",
        path: stylePath,
        sourcePath: filePath,
        fieldName: "styles"
      }))
    });

    for (const diagnostic of resourceDiagnostics) {
      addDiagnostic(result, diagnostic);
    }
  }

  if (!source.includes("ExportPanel") && !source.includes("CommentExport")) {
    addDiagnostic(result, {
      severity: "warning",
      code: "export_component_missing",
      message: "ExportPanel or equivalent export component not found. Interactive artifacts should provide an export path.",
      sourcePath: filePath,
      suggestion: "Add ExportPanel for result handoff, or CommentExport for comments-only artifacts.",
      example: '<ExportPanel value={{ status: "ready" }} />'
    });
  }

  if (source.length > 40_000) {
    addDiagnostic(result, {
      severity: "warning",
      code: "mdx_file_large",
      message: "MDX file is large. Move bulky data to adjacent JSON files.",
      sourcePath: filePath,
      suggestion: "Keep authored prose in MDX and move large structured data into adjacent files."
    });
  }

  const knownComponents = componentRegistry.map((component) => component.name);
  const usedArtifactComponent = knownComponents.some((name) => source.includes(`<${name}`));
  if (!usedArtifactComponent) {
    addDiagnostic(result, {
      severity: "warning",
      code: "high_level_component_missing",
      message: "No first-stage high-level artifact component found. Confirm plain MDX is intentional.",
      sourcePath: filePath,
      suggestion: "Use high-level artifact components when the document needs structured workflow UI."
    });
  }

  const sourceWithoutStringLiterals = stripStringLiterals(source);
  for (const componentName of componentsRequiringStableId) {
    if (hasOpeningTagWithoutProp(sourceWithoutStringLiterals, componentName, "id")) {
      addDiagnostic(result, {
        severity: "warning",
        code: "stable_id_missing",
        message: `${componentName} should include a stable id prop so comments and state can use a durable anchorId.`,
        sourcePath: filePath,
        componentName,
        propName: "id",
        suggestion: `Add a stable id prop to ${componentName}.`,
        example: stableIdExample(componentName)
      });
    }
  }

  for (const deprecatedComponent of deprecatedAuthoringComponents) {
    if (hasOpeningTag(sourceWithoutStringLiterals, deprecatedComponent.componentName)) {
      addDiagnostic(result, {
        severity: "warning",
        code: "deprecated_component",
        message: deprecatedComponent.warning,
        sourcePath: filePath,
        componentName: deprecatedComponent.componentName,
        suggestion: deprecatedComponent.suggestion
      });
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
      addDiagnostic(result, {
        severity: "warning",
        code: "deprecated_prop",
        message: deprecatedProp.warning,
        sourcePath: filePath,
        componentName: deprecatedProp.componentName,
        propName: deprecatedProp.propName,
        suggestion: deprecatedProp.suggestion
      });
    }
  }

  return result;
}

function createValidationResult(): ValidationResult {
  return { diagnostics: [], errors: [], warnings: [] };
}

function addDiagnostic(result: ValidationResult, diagnostic: ArtifactDiagnostic) {
  result.diagnostics.push(diagnostic);

  if (diagnostic.severity === "error") {
    result.errors.push(diagnostic.message);
    return;
  }

  if (diagnostic.severity === "warning") {
    result.warnings.push(diagnostic.message);
  }
}

export function formatValidationJson(result: ValidationResult) {
  return {
    ok: result.errors.length === 0,
    diagnostics: result.diagnostics
  };
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

function stableIdExample(componentName: string) {
  if (componentName.includes(".")) {
    return `<${componentName} id="item.example" title="Example">Readable body.</${componentName}>`;
  }

  return `<${componentName} id="${componentName.toLowerCase()}.example" />`;
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
