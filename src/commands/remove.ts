import { Command } from "commander";
import { readConfig, writeConfig } from "../config.js";
import { removeSshKey } from "../ssh.js";
import { removeIncludeIf, removeWorkspaceGitconfig } from "../gitconfig.js";
import { getWorkspaceGitconfigPath } from "../config.js";
import { red, green, yellow } from "../utils.js";

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove <account>")
    .alias("rm")
    .description("Remove a registered git account and its SSH keys (alias: rm)")
    .option("--force", "Remove even if workspaces reference this account")
    .action((accountName: string, opts: { force?: boolean }) => {
      const config = readConfig();
      const account = config.accounts[accountName];

      if (!account) {
        console.log(red(`Account "${accountName}" not found.`));
        process.exit(1);
      }

      // Check if any workspaces reference this account
      const linkedWorkspaces = Object.entries(config.workspaces).filter(
        ([, ws]) => ws.account === accountName
      );

      if (linkedWorkspaces.length > 0 && !opts.force) {
        console.log(
          red(`Account "${accountName}" is used by these workspaces:`)
        );
        for (const [name, ws] of linkedWorkspaces) {
          console.log(`  - ${name} (${ws.path})`);
        }
        console.log(
          yellow(
            "\nRemove the workspaces first, or use --force to remove everything."
          )
        );
        process.exit(1);
      }

      // If --force, also remove linked workspaces
      if (linkedWorkspaces.length > 0 && opts.force) {
        for (const [name, ws] of linkedWorkspaces) {
          removeIncludeIf(ws.path);
          removeWorkspaceGitconfig(getWorkspaceGitconfigPath(name));
          delete config.workspaces[name];
          console.log(yellow(`Removed workspace "${name}".`));
        }
      }

      // Remove SSH keys
      removeSshKey(account.private_key);

      // Remove from config
      delete config.accounts[accountName];
      writeConfig(config);

      console.log(green(`Account "${accountName}" removed.`));
    });
}
