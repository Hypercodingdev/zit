#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import { registerAddCommand } from "./commands/add.js";
import { registerRemoveCommand } from "./commands/remove.js";
import { registerListCommand } from "./commands/list.js";
import { registerWorkspaceCommand } from "./commands/workspace.js";
import { registerCloneCommand } from "./commands/clone.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerCompletionCommand } from "./commands/completion.js";
import { readConfig } from "./config.js";

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);

const program = new Command();

program
  .name("zit")
  .description(
    "Folder-based Git identity manager. Associate workspace folders with Git accounts."
  )
  .version(pkg.version, "-v, --version");

registerAddCommand(program);
registerRemoveCommand(program);
registerListCommand(program);
registerWorkspaceCommand(program);
registerCloneCommand(program);
registerStatusCommand(program);
registerCompletionCommand(program);

// Hidden helpers for shell completion
program
  .command("_list-accounts", { hidden: true })
  .action(() => {
    const config = readConfig();
    for (const name of Object.keys(config.accounts)) {
      console.log(name);
    }
  });

program
  .command("_list-workspaces", { hidden: true })
  .action(() => {
    const config = readConfig();
    for (const name of Object.keys(config.workspaces)) {
      console.log(name);
    }
  });

program.parse();
