#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const expectedPackageFiles = [
  "dist/lib",
  "agents",
  "artifact-docs/examples/*.mdx",
  "docs/*.md",
  "README.md",
  "README.zh-CN.md",
  "LICENSE"
];

const forbiddenPackagePatterns = [
  [/^src(\/|$)/, "src/"],
  [/^docs\/local(\/|$)/, "docs/local/"],
  [/^node_modules(\/|$)/, "node_modules/"],
  [/^dist\/artifacts(\/|$)/, "dist/artifacts/"],
  [/^\.storybook(\/|$)/, ".storybook/"],
  [/storybook-static(\/|$)/, "storybook-static/"],
  [/\.state\.json$/, ".state.json"],
  [/\.local\./, ".local.*"],
  [/\.stories\./, "Storybook stories"],
  [/\.log$/, ".log"],
  [/\.tgz$/, ".tgz"],
  [/\.map$/, "sourcemap"]
];

const languageScanRoots = [
  "src",
  "artifact-docs",
  "agents",
  "docs",
  "README.md",
  "package.json",
  "LICENSE"
];

const legacyNamePattern = /artifact-kit|Artifact Kit|ArtifactKit|\.artifact-kit|artifact-kit\.config/;
const hanPattern = /\p{Script=Han}/u;
const textFilePattern = /\.(css|html|js|json|jsx|md|mdx|mjs|ts|tsx|txt|yaml|yml)$/;

function addFailure(message) {
  failures.push(message);
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativeToRoot(filePath) {
  return toPosix(path.relative(root, filePath));
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(filePath) {
  const info = await stat(filePath);

  if (info.isFile()) {
    return [filePath];
  }

  if (!info.isDirectory()) {
    return [];
  }

  const entries = await readdir(filePath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => collectFiles(path.join(filePath, entry.name)))
  );

  return nested.flat();
}

async function collectMarkdownGlob(entry) {
  const slashIndex = entry.lastIndexOf("/");
  const dir = slashIndex === -1 ? "." : entry.slice(0, slashIndex);
  const pattern = slashIndex === -1 ? entry : entry.slice(slashIndex + 1);
  const suffix = pattern.startsWith("*.") ? pattern.slice(1) : null;

  if (!suffix) {
    addFailure(`Unsupported package files glob: ${entry}`);
    return [];
  }

  const dirPath = path.join(root, dir);

  if (!(await exists(dirPath))) {
    return [];
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((file) => file.isFile() && file.name.endsWith(suffix))
    .map((file) => path.join(dirPath, file.name));
}

async function expandPackageFiles(entries) {
  const files = [];

  for (const entry of entries) {
    if (entry.includes("*")) {
      files.push(...(await collectMarkdownGlob(entry)));
      continue;
    }

    const fullPath = path.join(root, entry);

    if (!(await exists(fullPath))) {
      continue;
    }

    files.push(...(await collectFiles(fullPath)));
  }

  return files.map(relativeToRoot).sort();
}

function isLocalizedChineseDoc(relativePath) {
  return relativePath === "README.zh-CN.md" || relativePath.endsWith(".zh-CN.md");
}

function shouldScanLanguage(relativePath) {
  if (!textFilePattern.test(relativePath)) {
    return false;
  }

  if (relativePath.startsWith("docs/local/")) {
    return false;
  }

  if (isLocalizedChineseDoc(relativePath)) {
    return false;
  }

  return true;
}

async function collectLanguageScanFiles() {
  const files = [];

  for (const target of languageScanRoots) {
    const fullPath = path.join(root, target);

    if (!(await exists(fullPath))) {
      continue;
    }

    files.push(...(await collectFiles(fullPath)));
  }

  return files.map(relativeToRoot).filter(shouldScanLanguage).sort();
}

function assertArrayEqual(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    return;
  }

  addFailure(
    `${name} must match the release allowlist.\n` +
      `  expected: ${JSON.stringify(expected)}\n` +
      `  actual:   ${JSON.stringify(actual)}`
  );
}

async function main() {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

  assertArrayEqual("package.json files", packageJson.files ?? [], expectedPackageFiles);

  if (packageJson.scripts?.["release:check"] !== "node scripts/check-release.mjs") {
    addFailure('package.json scripts.release:check must be "node scripts/check-release.mjs".');
  }

  const packageFiles = await expandPackageFiles(packageJson.files ?? []);

  for (const file of packageFiles) {
    for (const [pattern, label] of forbiddenPackagePatterns) {
      if (pattern.test(file)) {
        addFailure(`Package file must not include ${label}: ${file}`);
      }
    }
  }

  const languageFiles = await collectLanguageScanFiles();

  for (const file of languageFiles) {
    const content = await readFile(path.join(root, file), "utf8");

    if (hanPattern.test(content)) {
      addFailure(`Public English/code file contains Han characters: ${file}`);
    }

    if (legacyNamePattern.test(content)) {
      addFailure(`Public file contains legacy artifact-kit naming: ${file}`);
    }
  }

  if (failures.length > 0) {
    console.error("release check failed");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`release check ok: ${packageFiles.length} package files, ${languageFiles.length} public files scanned`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
