import { Command } from "commander";
import { readConfig, findWorkspaceByPath } from "../config.js";
import { collapseHome, green, yellow } from "../utils.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show the current directory's workspace and account info")
    .action(() => {
      const cwd = process.cwd();
      const match = findWorkspaceByPath(cwd);

      if (!match) {
        console.log(yellow("Not inside a zit workspace."));
        return;
      }

      const { name, workspace } = match;
      const config = readConfig();
      const account = config.accounts[workspace.account];

      console.log(green("Workspace: ") + name);
      console.log(green("Path:      ") + collapseHome(workspace.path));
      console.log(green("Account:   ") + workspace.account);

      if (account) {
        console.log(green("Name:      ") + account.name);
        console.log(green("Email:     ") + account.email);
        console.log(green("SSH Key:   ") + collapseHome(account.private_key));
      } else {
        console.log(
          yellow(`Warning: Account "${workspace.account}" not found in config.`)
        );
      }
    });
}
