#!/usr/bin/env node
import path from "node:path";
import { buildCommand } from "./commands/build";
import { componentsCommand } from "./commands/components";
import { devCommand } from "./commands/dev";
import { interactionsCommand } from "./commands/interactions";
import { reviewCommand } from "./commands/review";
import { initProject, parseInitAgent } from "./commands/scaffold";
import { formatValidationJson, printValidationResult, validateMdx } from "./commands/validate";
import { loadConfig } from "./config/config";

const projectRoot = process.cwd();
const [command, input] = process.argv.slice(2);

async function main() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "init") {
    const args = process.argv.slice(3);
    const agentFlagIndex = args.indexOf("--agent");
    if (agentFlagIndex >= 0 && !args[agentFlagIndex + 1]) {
      throw new Error("mdx-artifacts init --agent requires a value: generic, codex, claude-code, cursor, or all.");
    }
    const agent = parseInitAgent(agentFlagIndex >= 0 ? args[agentFlagIndex + 1] : undefined);
    await initProject(projectRoot, { agent });
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
    const config = await loadConfig(projectRoot);
    const result = await validateMdx(path.resolve(projectRoot, input), { projectRoot, config });

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
  console.log(`mdx-artifacts

Usage:
  mdx-artifacts init [--agent <generic|codex|claude-code|cursor|all>]
  mdx-artifacts components [ComponentName] [--json]
  mdx-artifacts validate <file.mdx> [--json]
  mdx-artifacts interactions inspect <file.mdx> <id> [--json]
  mdx-artifacts interactions set-order <file.mdx> <id> --ordered-ids <id> [...id]
  mdx-artifacts interactions reset <file.mdx> <id>
  mdx-artifacts interactions promote <file.mdx> <id>
  mdx-artifacts interactions add-item <file.mdx> <id> --item-id <id> --title <title> [--summary <text>] [--badge <text>] [--tags <tag,tag>] [--disabled true|false] [--after <itemId>]
  mdx-artifacts interactions remove-item <file.mdx> <id> --item-id <id>
  mdx-artifacts interactions update-item <file.mdx> <id> --item-id <id> [--title <title>] [--summary <text>] [--badge <text>] [--tags <tag,tag>] [--disabled true|false]
  mdx-artifacts review add <file.mdx> --anchor <anchorId> --body <message> [--title <title>]
  mdx-artifacts review reply <file.mdx> --thread <threadId> --body <message> [...repeat] [--status <status>]
  mdx-artifacts review validate <file.mdx>
  mdx-artifacts dev <file.mdx>
  mdx-artifacts build <file.mdx>
`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
