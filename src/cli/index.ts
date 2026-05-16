#!/usr/bin/env node
import path from "node:path";
import { buildCommand } from "./build";
import { componentsCommand } from "./components";
import { devCommand } from "./dev";
import { interactionsCommand } from "./interactions";
import { reviewCommand } from "./review";
import { initProject } from "./scaffold";
import { printValidationResult, validateMdx } from "./validate";

const projectRoot = process.cwd();
const [command, input] = process.argv.slice(2);

async function main() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    await initProject(projectRoot);
    return;
  }

  if (command === "components") {
    const args = process.argv.slice(3);
    const json = args.includes("--json");
    const name = args.find((arg) => arg !== "--json");
    componentsCommand(name, { json });
    return;
  }

  if (command === "review") {
    await reviewCommand(projectRoot, process.argv.slice(3));
    return;
  }

  if (command === "interactions") {
    await interactionsCommand(projectRoot, process.argv.slice(3));
    return;
  }

  if (!input) {
    throw new Error(`${command} requires a .mdx file path.`);
  }

  if (command === "validate") {
    const result = await validateMdx(path.resolve(projectRoot, input));
    printValidationResult(result);
    if (result.errors.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  if (command === "build") {
    await buildCommand(projectRoot, input);
    return;
  }

  if (command === "dev") {
    await devCommand(projectRoot, input);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function printHelp() {
  console.log(`artifact-kit

Usage:
  artifact-kit init
  artifact-kit components [ComponentName] [--json]
  artifact-kit validate <file.mdx>
  artifact-kit interactions inspect <file.mdx> <id> [--json]
  artifact-kit interactions set-order <file.mdx> <id> --ordered-ids <id> [...id]
  artifact-kit interactions reset <file.mdx> <id>
  artifact-kit interactions promote <file.mdx> <id>
  artifact-kit review add <file.mdx> --anchor <anchorId> --body <message> [--title <title>]
  artifact-kit review reply <file.mdx> --thread <threadId> --body <message> [...repeat] [--status <status>]
  artifact-kit review validate <file.mdx>
  artifact-kit dev <file.mdx>
  artifact-kit build <file.mdx>
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
