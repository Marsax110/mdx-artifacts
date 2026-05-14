import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distRoot = path.resolve("dist/lib");
const staticSpecifierPattern = /((?:from\s+|import\s*)["'])(\.{1,2}\/[^"']+)(["'])/g;

await rewriteDirectory(distRoot);

async function rewriteDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteDirectory(entryPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      await rewriteFile(entryPath);
    }
  }
}

async function rewriteFile(filePath) {
  const source = await readFile(filePath, "utf8");
  const nextSource = source.replace(staticSpecifierPattern, (_match, prefix, specifier, suffix) => {
    if (hasRuntimeExtension(specifier)) {
      return `${prefix}${specifier}${suffix}`;
    }

    return `${prefix}${specifier}.js${suffix}`;
  });

  if (nextSource !== source) {
    await writeFile(filePath, nextSource, "utf8");
  }
}

function hasRuntimeExtension(specifier) {
  return /\.(?:js|mjs|cjs|json|css)(?:[?#].*)?$/.test(specifier);
}
