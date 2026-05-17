#!/usr/bin/env node
import path from "node:path";
import { buildCommand } from "./commands/build";
import { componentsCommand } from "./commands/components";
import { devCommand } from "./commands/dev";
import { interactionsCommand } from "./commands/interactions";
import { reviewCommand } from "./commands/review";
import { initProject } from "./commands/scaffold";
import { formatValidationJson, printValidationResult, validateMdx } from "./commands/validate";

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
    const args = process.argv.slice(3);
    const json = args.includes("--json");
    const result = await validateMdx(path.resolve(projectRoot, input));

    if (json) {
      console.log(JSON.stringify(formatValidationJson(result), null, 2));
    } else {
      printValidationResult(result);
    }

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
  artifact-kit validate <file.mdx> [--json]
  artifact-kit interactions inspect <file.mdx> <id> [--json]
  artifact-kit interactions set-order <file.mdx> <id> --ordered-ids <id> [...id]
  artifact-kit interactions reset <file.mdx> <id>
  artifact-kit interactions promote <file.mdx> <id>
  artifact-kit interactions add-item <file.mdx> <id> --item-id <id> --title <title> [--summary <text>] [--badge <text>] [--tags <tag,tag>] [--disabled true|false] [--after <itemId>]
  artifact-kit interactions remove-item <file.mdx> <id> --item-id <id>
  artifact-kit interactions update-item <file.mdx> <id> --item-id <id> [--title <title>] [--summary <text>] [--badge <text>] [--tags <tag,tag>] [--disabled true|false]
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
