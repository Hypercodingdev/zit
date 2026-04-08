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

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);

const program = new Command();

program
  .name("zit")
  .description(
    "Folder-based Git identity manager. Associate workspace folders with Git accounts."
  )
  .version(pkg.version);

registerAddCommand(program);
registerRemoveCommand(program);
registerListCommand(program);
registerWorkspaceCommand(program);
registerCloneCommand(program);
registerStatusCommand(program);

program.parse();
