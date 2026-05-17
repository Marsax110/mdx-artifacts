import { realpath } from "node:fs/promises";
import path from "node:path";

export type SafeProjectPathResult =
  | {
      ok: true;
      path: string;
    }
  | {
      ok: false;
      code: "remote_resource_blocked" | "home_resource_blocked" | "resource_path_escape";
      message: string;
      suggestion: string;
    };

export type SafeProjectPathOptions = {
  realpath?: boolean;
};

export async function resolveSafeProjectPath(
  projectRoot: string,
  resourcePath: string,
  options: SafeProjectPathOptions = {}
): Promise<SafeProjectPathResult> {
  if (isUrlLike(resourcePath)) {
    return {
      ok: false,
      code: "remote_resource_blocked",
      message: `Remote resources are not allowed: ${resourcePath}`,
      suggestion: "Use a local project-relative resource path."
    };
  }

  if (resourcePath === "~" || resourcePath.startsWith("~/")) {
    return {
      ok: false,
      code: "home_resource_blocked",
      message: `Home-relative resources are not allowed: ${resourcePath}`,
      suggestion: "Move the resource inside the project and reference it with a project-relative path."
    };
  }

  const rootPath = path.resolve(projectRoot);
  const resolvedPath = path.resolve(rootPath, resourcePath);

  if (!isInsidePath(rootPath, resolvedPath)) {
    return {
      ok: false,
      code: "resource_path_escape",
      message: `Resource path must stay inside the project root: ${resourcePath}`,
      suggestion: "Move the resource inside the project root before referencing it."
    };
  }

  if (!options.realpath) {
    return { ok: true, path: resolvedPath };
  }

  try {
    const [realRootPath, realResolvedPath] = await Promise.all([realpath(rootPath), realpath(resolvedPath)]);

    if (!isInsidePath(realRootPath, realResolvedPath)) {
      return {
        ok: false,
        code: "resource_path_escape",
        message: `Resource path must stay inside the project root: ${resourcePath}`,
        suggestion: "Do not reference symlinks that resolve outside the project root."
      };
    }

    return { ok: true, path: realResolvedPath };
  } catch {
    return { ok: true, path: resolvedPath };
  }
}

function isUrlLike(resourcePath: string) {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(resourcePath) || /^(data|blob):/.test(resourcePath) || resourcePath.startsWith("//");
}

function isInsidePath(rootPath: string, candidatePath: string) {
  const relativePath = path.relative(rootPath, candidatePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}
