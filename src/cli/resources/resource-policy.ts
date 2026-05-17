import { access } from "node:fs/promises";
import type { ArtifactDiagnostic } from "../diagnostics/diagnostics";
import { resolveSafeProjectPath } from "./safe-path";

export const resourceTypes = ["style", "data", "artifact", "component-module"] as const;

export type ResourceType = (typeof resourceTypes)[number];

export type ResourceReference = {
  type: ResourceType;
  path: string;
  sourcePath: string;
  fieldName?: string;
  mustExist?: boolean;
};

export type ResourcePolicyInput = {
  projectRoot: string;
  references: ResourceReference[];
};

export async function validateResourceReferences(input: ResourcePolicyInput): Promise<ArtifactDiagnostic[]> {
  const diagnostics: ArtifactDiagnostic[] = [];

  for (const reference of input.references) {
    const safePath = await resolveSafeProjectPath(input.projectRoot, reference.path, { realpath: true });

    if (!safePath.ok) {
      diagnostics.push({
        severity: "error",
        code: safePath.code,
        message: resourceMessage(reference, safePath.message),
        sourcePath: reference.sourcePath,
        propName: reference.fieldName,
        suggestion: safePath.suggestion
      });
      continue;
    }

    if (reference.mustExist === false) {
      continue;
    }

    try {
      await access(safePath.path);
    } catch {
      diagnostics.push({
        severity: "error",
        code: "resource_not_found",
        message: `${resourceLabel(reference.type)} not found: ${reference.path}`,
        sourcePath: reference.sourcePath,
        propName: reference.fieldName,
        suggestion: "Confirm the resource path exists relative to the project root."
      });
    }
  }

  return diagnostics;
}

function resourceMessage(reference: ResourceReference, message: string) {
  return message.replace("resources", `${resourceLabel(reference.type)}s`).replace("Resource path", resourceLabel(reference.type));
}

function resourceLabel(type: ResourceType) {
  if (type === "component-module") {
    return "component module resource";
  }

  return `${type} resource`;
}
