import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ArtifactRoute = {
  routePath: string;
  slug: string;
  sourcePath: string;
  sourceRelativePath: string;
  statePath: string;
  stateRelativePath: string;
};

export type ArtifactState = {
  version: number;
  source: string;
  threads: unknown[];
  interactions: Record<string, unknown>;
  [key: string]: unknown;
};

export function createArtifactRoute(projectRoot: string, mdxPath: string, docsDir: string): ArtifactRoute {
  const sourcePath = path.resolve(mdxPath);
  const statePath = sourcePath.replace(/\.mdx$/i, ".state.json");
  const slug = createArtifactSlug(projectRoot, sourcePath, docsDir);

  return {
    routePath: `/artifacts/${slug}`,
    slug,
    sourcePath,
    sourceRelativePath: toProjectRelativePath(projectRoot, sourcePath),
    statePath,
    stateRelativePath: toProjectRelativePath(projectRoot, statePath)
  };
}

export async function createArtifactMeta(projectRoot: string, artifact: ArtifactRoute) {
  return {
    routePath: artifact.routePath,
    slug: artifact.slug,
    sourcePath: artifact.sourceRelativePath,
    statePath: artifact.stateRelativePath,
    stateExists: await fileExists(artifact.statePath),
    writable: isSafeStatePath(projectRoot, artifact)
  };
}

export async function readArtifactState(artifact: ArtifactRoute): Promise<ArtifactState> {
  try {
    const source = await readFile(artifact.statePath, "utf8");
    return normalizeArtifactState(JSON.parse(source), artifact);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createDefaultArtifactState(artifact);
    }
    throw error;
  }
}

export async function writeArtifactState(
  projectRoot: string,
  artifact: ArtifactRoute,
  value: unknown
): Promise<ArtifactState> {
  if (!isSafeStatePath(projectRoot, artifact)) {
    throw new Error("State file must be next to its MDX source inside the project workspace.");
  }

  const state = normalizeArtifactState(value, artifact);
  await mkdir(path.dirname(artifact.statePath), { recursive: true });
  await writeFile(artifact.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

export function createDefaultArtifactState(artifact: ArtifactRoute): ArtifactState {
  return {
    version: 1,
    source: artifact.sourceRelativePath,
    threads: [],
    interactions: {}
  };
}

function normalizeArtifactState(value: unknown, artifact: ArtifactRoute): ArtifactState {
  if (!isRecord(value)) {
    throw new Error("Artifact state must be a JSON object.");
  }

  return {
    ...value,
    version: typeof value.version === "number" ? value.version : 1,
    source: artifact.sourceRelativePath,
    threads: Array.isArray(value.threads) ? value.threads : [],
    interactions: isRecord(value.interactions) ? value.interactions : {}
  };
}

function createArtifactSlug(projectRoot: string, mdxPath: string, docsDir: string) {
  const docsRoot = path.resolve(projectRoot, docsDir);
  const relativeToDocs = path.relative(docsRoot, mdxPath);
  const pathForSlug =
    relativeToDocs.startsWith("..") || path.isAbsolute(relativeToDocs)
      ? path.basename(mdxPath, path.extname(mdxPath))
      : relativeToDocs.replace(/\.mdx$/i, "");

  return pathForSlug
    .split(path.sep)
    .map((segment) => slugify(segment))
    .filter(Boolean)
    .join("/");
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug || "artifact";
}

function isSafeStatePath(projectRoot: string, artifact: ArtifactRoute) {
  return (
    isInsidePath(projectRoot, artifact.sourcePath) &&
    isInsidePath(projectRoot, artifact.statePath) &&
    isSiblingStatePath(artifact)
  );
}

function isInsidePath(root: string, target: string) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isSiblingStatePath(artifact: ArtifactRoute) {
  const expected = artifact.sourcePath.replace(/\.mdx$/i, ".state.json");
  return path.resolve(expected) === path.resolve(artifact.statePath);
}

function toProjectRelativePath(projectRoot: string, target: string) {
  return path.relative(projectRoot, target).replaceAll(path.sep, "/");
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
